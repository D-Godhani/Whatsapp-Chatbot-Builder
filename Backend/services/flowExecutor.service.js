import projectModel from "../models/project.model.js";
import redisClient from "./redis.service.js";
import axios from "axios";
import {
  sendWhatsappTextMessage,
  sendWhatsappButtonMessage,
  sendWhatsappMediaMessage,
} from "./whatsapp.service.js";

// ====================================================================================
// SECTION 1: ACTION HANDLER (For "Smart" Buttons with Embedded Actions)
// ====================================================================================

/**
 * Handles button clicks that have a self-contained "action" payload.
 * This is for stateless actions like fetching a specific document via API.
 */
export async function handleButtonAction({ projectId, senderWaPhoneNo, buttonId, fileTree }) {
  // Find the button's configuration within the entire flow
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

  // ✅ Execute the action based on its type. This is highly scalable.
  if (action.type === 'FETCH_AND_SEND_MEDIA') {
    if (!action.request?.url || !action.responseMapping?.mediaUrlField) {
        console.error(`Incomplete configuration for FETCH_AND_SEND_MEDIA action on button ${buttonId}`);
        return;
    }

    try {
      let url = action.request.url.replace(/{{sender\.phone}}/g, senderWaPhoneNo);
      console.log(`Executing API call for button ${buttonId}: GET ${url}`);
      
      const response = await axios.get(url);
      const responseData = response.data;

      const mediaUrl = responseData[action.responseMapping.mediaUrlField];
      if (!mediaUrl) {
          throw new Error(`Media URL field '${action.responseMapping.mediaUrlField}' not found in API response.`);
      }
      const caption = responseData[action.responseMapping.captionField] || '';

      await sendWhatsappMediaMessage({
        to: senderWaPhoneNo,
        mediaUrl: mediaUrl,
        mediaType: 'document', // Future enhancement: get this from config or response
        caption: caption,
        projectId: projectId,
      });

    } catch (error) {
      console.error(`Error during FETCH_AND_SEND_MEDIA action for button ${buttonId}:`, error.message);
      await sendWhatsappTextMessage({ to: senderWaPhoneNo, text: "Sorry, we couldn't fetch your document at this time.", projectId });
    }
  }
  // ✅ You can add other action types here in the future
  // else if (action.type === 'SHOW_IN_TEXT') { ... }
}


// ====================================================================================
// SECTION 2: CONVERSATIONAL FLOW HANDLER (For Navigational Flows)
// ====================================================================================

/**
 * Processes standard text-based messages or simple navigational button clicks.
 * Manages the user's state in the conversation flow using Redis.
 */
export async function processMessage({ projectId, senderWaPhoneNo, messageText, fileTree, buttonReplyId }) {
  const userStateKey = `flow-state:${senderWaPhoneNo}:${projectId}`;
  
  const tree = fileTree || await getProjectFileTree(projectId);
  if (!tree) return;

  // Get the user's current position in the flow, or find the start node.
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

/**
 * The core engine that executes a single node and decides where to go next.
 */
async function executeNode(nodeId, context) {
  const { fileTree, userStateKey, projectId, senderWaPhoneNo, messageText, buttonReplyId } = context;
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
      await sendWhatsappTextMessage({ to: senderWaPhoneNo, text: message, projectId });
      nextNodeId = findNextNode(node.id, fileTree.edges);
      break;

    case "condition":
      const keywords = (node.data?.properties?.keywords || "").split(",").map((k) => k.trim().toLowerCase());
      const matches = messageText && keywords.some((k) => messageText.toLowerCase().includes(k));
      nextNodeId = findNextNode(node.id, fileTree.edges, matches ? "true" : "false");
      break;

    case "buttons":
      const buttonText = node.data?.properties?.text || "Please choose an option:";
      const buttons = node.data?.properties?.buttons || [];
      await sendWhatsappButtonMessage({ to: senderWaPhoneNo, text: buttonText, buttons, projectId });
      // ✅ For navigational buttons, we simply wait. The user's reply (button click)
      // will be processed by the webhook as new input in the next turn. We don't need
      // complex 'awaitingResponse' flags.
      return; // Stop execution here and wait for user input.

    case "media":
        const { mediaUrl, mediaType, caption } = node.data?.properties;
        await sendWhatsappMediaMessage({ to: senderWaPhoneNo, mediaUrl, mediaType, caption, projectId });
        nextNodeId = findNextNode(node.id, fileTree.edges);
        break;

    case "end":
      console.log("Flow ended by 'end' node.");
      await redisClient.del(userStateKey);
      return;

    default:
      console.warn(`Unsupported node type: ${node.type} for node ${node.id}`);
      await redisClient.del(userStateKey); // End flow on unknown node to prevent errors.
      return;
  }

  // --- After the switch, decide the next step ---
  if (nextNodeId) {
    await redisClient.set(userStateKey, nextNodeId, "EX", 3600); // Set next state
    
    // ✅ Auto-continue the flow if the current node doesn't require user input.
    const waitForReply = node.data?.properties?.waitForUserReply === true;
    if (!waitForReply) {
      await executeNode(nextNodeId, context); // Recursively call for the next node.
    } else {
      console.log(`Waiting for user reply before continuing from node ${node.id}`);
    }
  } else {
    // If there's no next node, the flow naturally ends.
    console.log(`Flow ended for user ${senderWaPhoneNo}. No next node from ${node.id}.`);
    await redisClient.del(userStateKey);
  }
}

/**
 * Helper function to find the target of an edge from a source node.
 * Supports labeled edges for conditional branching.
 */
function findNextNode(sourceNodeId, edges, conditionLabel = null) {
  const edge = conditionLabel
    ? edges.find((e) => e.source === sourceNodeId && e.label === conditionLabel)
    : edges.find((e) => e.source === sourceNodeId && !e.label); // Default to unlabeled edge
  return edge?.target || null;
}