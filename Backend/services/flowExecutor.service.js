import projectModel from "../models/project.model.js";
import redisClient from "./redis.service.js";
import { sendWhatsappMessage } from "./whatsapp.service.js";

// Normalize button text
function normalizeLabel(label) {
  return label.trim().toLowerCase().replace(/\s+/g, "_");
}

// Find next node based on edge label
function findNextNode(sourceNodeId, edges, conditionLabel = null) {
  if (conditionLabel) {
    return (
      edges.find((e) => e.source === sourceNodeId && e.label === conditionLabel)?.target || null
    );
  }
  return edges.find((e) => e.source === sourceNodeId)?.target || null;
}

// Get project fileTree from DB
async function getProjectFileTree(projectId) {
  try {
    const project = await projectModel.findById(projectId).select("fileTree");
    return project?.fileTree || null;
  } catch (error) {
    console.error("Error fetching project fileTree:", error);
    return null;
  }
}

export async function processMessage({
  projectId,
  senderWaPhoneNo,
  messageText,
  buttonReplyId,
}) {
  const userStateKey = `flow-state:${senderWaPhoneNo}:${projectId}`;
  const fileTree = await getProjectFileTree(projectId);
  if (!fileTree) return;

  const cleanedInput = (buttonReplyId || messageText || "").trim().toLowerCase();
  const normalizedInput = normalizeLabel(cleanedInput);

  // 🔘 1. Handle awaiting button response
  let awaiting;
  try {
    const awaitingStr = await redisClient.get(`${userStateKey}:awaitingButtonResponse`);
    if (awaitingStr) awaiting = JSON.parse(awaitingStr);
  } catch (error) {
    console.error("Redis read error:", error);
  }

  if (awaiting) {
    const { nodeId, buttons } = awaiting;

    const matchedLabel = buttons.find((btn, index) => {
      const idMatch = `btn_${index + 1}_${normalizeLabel(btn)}`;
      return (
        normalizedInput === normalizeLabel(btn) ||
        normalizedInput === idMatch
      );
    });

    if (matchedLabel) {
      const nextNodeId = findNextNode(nodeId, fileTree.edges, normalizeLabel(matchedLabel));
      if (nextNodeId) {
        await redisClient.set(userStateKey, nextNodeId, "EX", 3600);
        await redisClient.del(`${userStateKey}:awaitingButtonResponse`);
        await redisClient.del(`${userStateKey}:buttonInvalidCount`);
        await executeNode(nextNodeId, {
          projectId,
          senderWaPhoneNo,
          messageText,
          fileTree,
          userStateKey,
        });
        return;
      }
    } else {
      // Handle invalid response
      const invalidCountKey = `${userStateKey}:buttonInvalidCount`;
      let invalidCount = 0;
      try {
        const countStr = await redisClient.get(invalidCountKey);
        invalidCount = countStr ? parseInt(countStr, 10) : 0;
      } catch (err) {
        console.error("Error reading invalid count from Redis:", err);
      }

      invalidCount += 1;

      if (invalidCount >= 3) {
        console.warn(`User ${senderWaPhoneNo} exceeded invalid attempts. Ending flow.`);

        // Notify the user before ending
        await sendWhatsappMessage({
          to: senderWaPhoneNo,
          text: `You've entered too many invalid responses (3/3).\nEnding this session. Please try again later if needed.`,
          projectId,
        });

        // Clean up
        await redisClient.del(userStateKey);
        await redisClient.del(`${userStateKey}:awaitingButtonResponse`);
        await redisClient.del(invalidCountKey);

        // Trigger end node if present
        const endNode = fileTree.nodes.find((n) => n.type === "end");
        if (endNode) {
          await executeNode(endNode.id, {
            projectId,
            senderWaPhoneNo,
            messageText,
            fileTree,
            userStateKey,
          });
        }

        return;
      }

      await redisClient.set(invalidCountKey, invalidCount.toString(), "EX", 3600);

      await sendWhatsappMessage({
        to: senderWaPhoneNo,
        text: `Invalid response. Please choose one of the buttons. (${invalidCount}/3 attempts used)`,
        projectId,
      });
      return;
    }
  }

  // 🔁 2. Global button check
  for (const node of fileTree.nodes) {
    if (node.type === "buttons") {
      const buttons = node.data?.properties?.buttons || [];

      const matchedLabel = buttons.find((btn, index) => {
        const idMatch = `btn_${index + 1}_${normalizeLabel(btn)}`;
        return (
          normalizedInput === normalizeLabel(btn) ||
          normalizedInput === idMatch
        );
      });

      if (matchedLabel) {
        const nextNodeId = findNextNode(node.id, fileTree.edges, normalizeLabel(matchedLabel));
        if (nextNodeId) {
          await redisClient.set(userStateKey, nextNodeId, "EX", 3600);
          await redisClient.del(`${userStateKey}:awaitingButtonResponse`);
          await redisClient.del(`${userStateKey}:buttonInvalidCount`);
          await executeNode(nextNodeId, {
            projectId,
            senderWaPhoneNo,
            messageText,
            fileTree,
            userStateKey,
          });
          return;
        }
      }
    }
  }

  // ▶️ 3. Continue or start normal flow
  let currentNodeId = null;
  try {
    currentNodeId = await redisClient.get(userStateKey);
  } catch (err) {
    console.error("Redis error while getting currentNodeId:", err);
  }

  if (!currentNodeId) {
    const startNode = fileTree.nodes.find((node) => node.type === "start");
    if (!startNode) {
      console.error("No start node found.");
      return;
    }
    currentNodeId = startNode.id;
  }

  //------------------------------ question - node starts-------------------------------//

  const currentNode = fileTree.nodes.find((n) => n.id === currentNodeId);
  if (!currentNode) {
    console.error("Current node not found in fileTree.");
    await redisClient.del(userStateKey);
    return;
  }


  if (currentNode.type === "question") {
    const askedFlag = await redisClient.get(`${userStateKey}:asked`);

    if (askedFlag) {
      const variableName = currentNode.data?.properties?.propertyName;
      const validationType = currentNode.data?.properties?.validationType;
      const numberOfRepeats = parseInt(currentNode.data?.properties?.numberOfRepeats || "3", 10);
      const retryKey = `${userStateKey}:retries`;

      const retryCount = parseInt((await redisClient.get(retryKey)) || "0", 10);

      let isValid = true;
      const input = messageText.trim();

      if (validationType === "email") {
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      } else if (validationType === "phonenumber") {
        isValid = /^\+?\d{10,15}$/.test(input);
      } else if (validationType === "url") {
        isValid = /^(https?:\/\/)?[\w.-]+(\.[\w\.-]+)+[\w\-\._~:\/?#\[\]@!\$&'\(\)\*\+,;=.]+$/.test(input);
      }

      if (!isValid) {
        if (retryCount + 1 >= numberOfRepeats) {
          await sendWhatsappMessage({
            to: senderWaPhoneNo,
            text: "❌ Too many invalid attempts. Ending flow.",
            projectId,
          });
          await redisClient.del(userStateKey);
          await redisClient.del(`${userStateKey}:asked`);
          await redisClient.del(retryKey);
          return;
        }

        await redisClient.set(retryKey, retryCount + 1, "EX", 3600);
        await sendWhatsappMessage({
          to: senderWaPhoneNo,
          text: `❌ Please provide a valid ${validationType}.`,
          projectId,
        });
        return;
      }

      // Store valid answer
      if (variableName) {
        await redisClient.set(
          `${projectId}_${senderWaPhoneNo}_${variableName}`,
          input,
          "EX",
          3600
        );
        console.log(`Stored variable ${variableName} = ${input}`);
      }

      const nextNodeId = findNextNode(currentNode.id, fileTree.edges);
      if (nextNodeId) {
        await redisClient.set(userStateKey, nextNodeId, "EX", 3600);
        await redisClient.del(`${userStateKey}:asked`);
        await redisClient.del(retryKey);
        await executeNode(nextNodeId, {
          projectId,
          senderWaPhoneNo,
          messageText,
          fileTree,
          userStateKey,
        });
      } else {
        await redisClient.del(userStateKey);
        console.log("No next node after question.");
      }
      return;
    }
  }
  //------------------------------ question - node ends-------------------------------//

  await executeNode(currentNodeId, {
    projectId,
    senderWaPhoneNo,
    messageText,
    fileTree,
    userStateKey,
  });
}

// Executes a node in the flow
async function executeNode(nodeId, context) {
  const { fileTree, userStateKey } = context;
  const node = fileTree.nodes.find((n) => n.id === nodeId);
  if (!node) {
    console.error(`Node with ID ${nodeId} not found.`);
    await redisClient.del(userStateKey);
    return;
  }

  console.log(`Executing node ${node.id} of type ${node.type}`);

  const quickReply = node.data?.properties?.quickReply;
  if (quickReply) {
    await sendWhatsappMessage({
      to: context.senderWaPhoneNo,
      text: quickReply,
      projectId: context.projectId,
    });
  }

  let nextNodeId = null;

  switch (node.type) {
    case "start":
      nextNodeId = findNextNode(node.id, fileTree.edges);
      break;

    case "message":
      const message = node.data?.properties?.message || "Default message";
      await sendWhatsappMessage({
        to: context.senderWaPhoneNo,
        text: message,
        projectId: context.projectId,
      });
      nextNodeId = findNextNode(node.id, fileTree.edges);
      break;

    case "keywordMatch":
      const keywords = (node.data?.properties?.keywords || "")
        .split(",")
        .map((k) => k.trim().toLowerCase());
      const matches = keywords.some((k) =>
        context.messageText.toLowerCase().includes(k)
      );
      nextNodeId = findNextNode(
        node.id,
        fileTree.edges,
        matches ? "true" : "false"
      );
      break;

    case "buttons":
      const buttonText = node.data?.properties?.message || "Choose an option:";
      const buttons = node.data?.properties?.buttons || [];

      const formattedButtons = buttons.map((btn, index) => ({
        type: "reply",
        reply: {
          id: `btn_${index + 1}_${normalizeLabel(btn)}`,
          title: btn,
        },
      }));

      await sendWhatsappMessage({
        to: context.senderWaPhoneNo,
        text: buttonText,
        projectId: context.projectId,
        buttons: formattedButtons,
      });

      await redisClient.set(
        `${userStateKey}:awaitingButtonResponse`,
        JSON.stringify({
          nodeId: node.id,
          buttons: buttons.map((btn) => btn.trim().toLowerCase()),
        }),
        "EX",
        3600
      );
      await redisClient.del(`${userStateKey}:buttonInvalidCount`);
      return;

      // question-node
      case "question": {
      const alreadyAsked = await redisClient.get(`${userStateKey}:asked`);
      if (alreadyAsked) return; // already asked, waiting for reply

      const questionText = node.data?.properties?.question || "Please reply:";
      await sendWhatsappMessage({
        to: context.senderWaPhoneNo,
        type: "text",
        text: questionText,
        projectId: context.projectId,
      });
      await redisClient.set(`${userStateKey}:asked`, "true", "EX", 3600);
      return; // pause until user replies
    }

    // api-node
    case "api": {
      const {
        method,
        url,
        headers = {},
        body,
        responseKey,
        responseType,
        filename,
        caption,
        mediaType,
      } = node.data?.properties || {};

      if (!method || !url) break;

      try {
        // Extract all {{variable}} patterns from URL
        const variableRegex = /{{(.*?)}}/g;
        const matches = [...url.matchAll(variableRegex)];

        // Replace all variables in the URL using Redis
        let compiledUrl = url;
        for (const match of matches) {
          const variableName = match[1]; // e.g., "orderId"
          const redisKey = `${context.projectId}_${context.senderWaPhoneNo}_${variableName}`;
          // const redisKey = `${context.senderWaPhoneNo}:${context.projectId}:${variableName}`;
          const variableValue = await redisClient.get(redisKey);

          if (!variableValue) {
            throw new Error(`Missing value for variable "${variableName}"`);
          }

          compiledUrl = compiledUrl.replace(`{{${variableName}}}`, variableValue);
        }

        // Perform the API request
        const response = await axios({
          method,
          url: compiledUrl,
          headers,
          data: body,
        });

        let result = response.data;

        if (responseKey) {
          result = response.data?.[responseKey];
        }

        // Case: Media Response
        if (responseType === "media") {
          if (!result) throw new Error("No media URL found in API response.");

          await sendWhatsappMessage({
            to: context.senderWaPhoneNo,
            type: mediaType || "document",
            content: {
              mediaUrl: result,
              filename: filename || "file.pdf",
              caption: caption || "",
            },
            projectId: context.projectId,
          });
        }

        // Case: Text Response
        else {
          await sendWhatsappMessage({
            to: context.senderWaPhoneNo,
            type: "text",
            text:
              typeof result === "object"
                ? `API Response:\n${JSON.stringify(result, null, 2)}`
                : `API Response: ${result}`,
            projectId: context.projectId,
          });
        }
      } catch (err) {
        console.error("API Call Failed:", err.message);

        await sendWhatsappMessage({
          to: context.senderWaPhoneNo,
          type: "text",
          text: "Failed to fetch data. Please try again later.",
          projectId: context.projectId,
        });
      }

      // Move to the next node
      nextNodeId = findNextNode(node.id, fileTree.edges);
      break;
    }

//----------------------------- api-node ends ---------------------------------//

    case "end":
      console.log("Flow ended by end node.");
      await redisClient.del(userStateKey);
      return;

    default:
      console.warn(`Unsupported node type: ${node.type}`);
      await sendWhatsappMessage({
        to: context.senderWaPhoneNo,
        text: "Something went wrong. Please try again later.",
        projectId: context.projectId,
      });
      await redisClient.del(userStateKey);
      return;
  }

  const waitForReply = node.data?.properties?.waitForUserReply === true;

  if (nextNodeId) {
    await redisClient.set(userStateKey, nextNodeId, "EX", 3600);
    if (!waitForReply) {
      await executeNode(nextNodeId, context);
    } else {
      console.log(`Waiting for user reply before continuing from node ${node.id}`);
    }
  } else {
    console.log(`Flow ended. No next node from ${node.id}.`);
    await redisClient.del(userStateKey);
  }
}
