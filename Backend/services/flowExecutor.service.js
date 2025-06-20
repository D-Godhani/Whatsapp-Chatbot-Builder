import projectModel from "../models/project.model.js";
import redisClient from "./redis.service.js";
import axios from "axios";
import {
  sendWhatsappTextMessage,
  sendWhatsappButtonMessage,
  sendWhatsappMediaMessage,
} from "./whatsapp.service.js";

export async function handleButtonAction({
  projectId,
  senderWaPhoneNo,
  buttonId,
  fileTree,
}) {
  let buttonConfig = null;
  for (const node of fileTree.nodes) {
    if (
      node.type === "buttons" &&
      Array.isArray(node.data?.properties?.buttons)
    ) {
      const foundButton = node.data.properties.buttons.find(
        (b) => b.id === buttonId
      );
      if (foundButton) {
        buttonConfig = foundButton;
        break;
      }
    }
  }

  if (!buttonConfig || !buttonConfig.action) {
    console.error(
      `No action configured for buttonId: ${buttonId} in project: ${projectId}`
    );
    return;
  }

  const action = buttonConfig.action;

  if (action.type === "FETCH_AND_SEND_MEDIA") {
    if (!action.request?.url || !action.responseMapping?.mediaUrlField) {
      console.error(
        `Incomplete configuration for FETCH_AND_SEND_MEDIA action on button ${buttonId}`
      );
      return;
    }

    try {
      let url = action.request.url.replace(
        /{{sender\.phone}}/g,
        senderWaPhoneNo
      );
      console.log(`Executing API call for button ${buttonId}: GET ${url}`);

      const response = await axios.get(url);
      const responseData = response.data;

      const mediaUrl = responseData[action.responseMapping.mediaUrlField];
      if (!mediaUrl) {
        throw new Error(
          `Media URL field '${action.responseMapping.mediaUrlField}' not found in API response.`
        );
      }
      const caption = responseData[action.responseMapping.captionField] || "";

      await sendWhatsappMediaMessage({
        to: senderWaPhoneNo,
        mediaUrl: mediaUrl,
        mediaType: "document",
        caption: caption,
        projectId: projectId,
      });
    } catch (error) {
      console.error(
        `Error during FETCH_AND_SEND_MEDIA action for button ${buttonId}:`,
        error.message
      );
      await sendWhatsappTextMessage({
        to: senderWaPhoneNo,
        text: "Sorry, we couldn't fetch your document at this time.",
        projectId,
      });
    }
  }
}

export async function processMessage({
  projectId,
  senderWaPhoneNo,
  messageText,
  fileTree,
  buttonReplyId,
}) {
  const userStateKey = `flow-state:${senderWaPhoneNo}:${projectId}`;

  const tree = fileTree || (await getProjectFileTree(projectId));
  if (!tree) return;

  let currentNodeId = await redisClient.get(userStateKey);
  if (!currentNodeId) {
    const startNode = tree.nodes.find((node) => node.type === "start");
    if (!startNode) {
      console.error(`No start node found for project ${projectId}.`);
      return;
    }
    currentNodeId = startNode.id;
  }

  await executeNode(currentNodeId, {
    projectId,
    senderWaPhoneNo,
    messageText,
    fileTree: tree,
    userStateKey,
    buttonReplyId,
  });
}

async function executeNode(nodeId, context) {
  const {
    fileTree,
    userStateKey,
    projectId,
    senderWaPhoneNo,
    messageText,
    buttonReplyId,
  } = context;
  const node = fileTree.nodes.find((n) => n.id === nodeId);

  if (!node) {
    console.error(`Node with ID ${nodeId} not found.`);
    await redisClient.del(userStateKey);
    return;
  }

  console.log(`Executing node ${node.id} of type ${node.type}`);
  let nextNodeId = null;

  switch (node.type) {
    case "start":
      nextNodeId = findNextNode(node.id, fileTree.edges);
      break;

    case "message":
      const message = node.data?.properties?.message || "Default message text";
      await sendWhatsappTextMessage({
        to: senderWaPhoneNo,
        text: message,
        projectId,
      });
      nextNodeId = findNextNode(node.id, fileTree.edges);
      break;

    case "condition":
      const keywords = (node.data?.properties?.keywords || "")
        .split(",")
        .map((k) => k.trim().toLowerCase());
      const matches =
        messageText &&
        keywords.some((k) => messageText.toLowerCase().includes(k));
      nextNodeId = findNextNode(
        node.id,
        fileTree.edges,
        matches ? "true" : "false"
      );
      break;

    case "buttons":
      const buttonText =
        node.data?.properties?.text || "Please choose an option:";
      const buttons = node.data?.properties?.buttons || [];
      await sendWhatsappButtonMessage({
        to: senderWaPhoneNo,
        text: buttonText,
        buttons,
        projectId,
      });
      return;

    case "media":
      const { mediaUrl, mediaType, caption } = node.data?.properties;
      await sendWhatsappMediaMessage({
        to: senderWaPhoneNo,
        mediaUrl,
        mediaType,
        caption,
        projectId,
      });
      nextNodeId = findNextNode(node.id, fileTree.edges);
      break;

    case "end":
      console.log("Flow ended by 'end' node.");
      await redisClient.del(userStateKey);
      return;

    default:
      console.warn(`Unsupported node type: ${node.type} for node ${node.id}`);
      await redisClient.del(userStateKey);
      return;
  }

  if (nextNodeId) {
    await redisClient.set(userStateKey, nextNodeId, "EX", 3600);
    const waitForReply = node.data?.properties?.waitForUserReply === true;
    if (!waitForReply) {
      await executeNode(nextNodeId, context);
    } else {
      console.log(
        `Waiting for user reply before continuing from node ${node.id}`
      );
    }
  } else {
    console.log(
      `Flow ended for user ${senderWaPhoneNo}. No next node from ${node.id}.`
    );
    await redisClient.del(userStateKey);
  }
}

function findNextNode(sourceNodeId, edges, conditionLabel = null) {
  const edge = conditionLabel
    ? edges.find((e) => e.source === sourceNodeId && e.label === conditionLabel)
    : edges.find((e) => e.source === sourceNodeId && !e.label);
  return edge?.target || null;
}
