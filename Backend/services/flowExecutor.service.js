import projectModel from "../models/project.model.js";
import redisClient from "./redis.service.js";
<<<<<<< HEAD
import generateReply from "./gptService.js";
import {sendWhatsappMessage, sendWhatsappMediaMessage} from "./whatsapp.service.js";
import axios from "axios"; // <-- ADD AXIOS IMPORT

// --- NEW FUNCTION: The Dynamic Action Handler ---
export async function handleButtonAction({ projectId, senderWaPhoneNo, buttonId, fileTree }) {
  // Find the button configuration within the entire flow
  let buttonConfig = null;
  for (const node of fileTree.nodes) {
    if (node.type === 'buttons' && Array.isArray(node.data?.properties?.buttons)) {
      const foundButton = node.data.properties.buttons.find(b => b.id === buttonId);
      if (foundButton) {
        buttonConfig = foundButton;
        break;
      }
    }
  }

  if (!buttonConfig || !buttonConfig.action) {
    console.error(`No action configured for buttonId: ${buttonId} in project: ${projectId}`);
    return;
  }

  const action = buttonConfig.action;

  // Execute the action based on its type
  if (action.type === 'FETCH_AND_SEND_MEDIA') {
    try {
      // 1. Prepare the API request
      let url = action.request.url;
      // Replace placeholders like {{sender.phone}}
      url = url.replace(/{{sender\.phone}}/g, senderWaPhoneNo);

      console.log(`Executing API call for button ${buttonId}: GET ${url}`);
      
      // 2. Make the API call
      const response = await axios.get(url);
      const responseData = response.data;

      // 3. Map the response to media properties
      const mediaUrl = responseData[action.responseMapping.mediaUrlField];
      const caption = responseData[action.responseMapping.captionField] || '';
      
      if (!mediaUrl) {
          throw new Error(`Media URL field '${action.responseMapping.mediaUrlField}' not found in API response.`);
      }

      // 4. Send the media file to the user
      // For now, we assume PDF is 'document'. A more advanced version could get this from the response too.
      await sendWhatsappMediaMessage({
        to: senderWaPhoneNo,
        mediaUrl: mediaUrl,
        mediaType: 'document',
        caption: caption,
        projectId: projectId,
      });

    } catch (error) {
      console.error(`Error during FETCH_AND_SEND_MEDIA action for button ${buttonId}:`, error.message);
      // Optionally, send an error message back to the user
      await sendWhatsappTextMessage({ to: senderWaPhoneNo, text: "Sorry, we couldn't fetch your document at this time. Please try again later.", projectId });
    }
  }
  // Future-proof: Add else-if for other action types like 'SHOW_IN_TEXT'
=======
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
>>>>>>> 98b746c745a63444892ad0e78b10624d9f2dd7a4
}

export async function processMessage({
  projectId,
  senderWaPhoneNo,
  messageText,
<<<<<<< HEAD
  fileTree,
}) {
  
=======
  buttonReplyId,
}) {
  const userStateKey = `flow-state:${senderWaPhoneNo}:${projectId}`;
  const fileTree = await getProjectFileTree(projectId);
>>>>>>> 98b746c745a63444892ad0e78b10624d9f2dd7a4
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
