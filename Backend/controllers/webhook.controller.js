import projectModel from "../models/project.model.js";
<<<<<<< HEAD
import {processMessage, handleButtonAction} from "../services/flowExecutor.service.js";
=======
import { processMessage } from "../services/flowExecutor.service.js";
>>>>>>> 98b746c745a63444892ad0e78b10624d9f2dd7a4

// Webhook verification (GET /webhook)
export const verifyWebhook = (req, res) => {
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified.");
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
};

// Incoming message handler (POST /webhook)
export const handleIncomingMessage = async (req, res) => {
  try {
    const body = req.body;
    console.log("Incoming webhook:", JSON.stringify(body, null, 2));

    if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    const phoneNumberId = change?.metadata?.phone_number_id;
    const message = change?.messages?.[0];

<<<<<<< HEAD
    if (!phoneNumberId || !message) {
      return res.sendStatus(200);
=======
    if (!phoneNumberId || !message || !message.from) {
      return res.sendStatus(200); // Ignore unsupported messages
>>>>>>> 98b746c745a63444892ad0e78b10624d9f2dd7a4
    }

    const project = await projectModel.findOne({
      whatsappPhoneNumberId: phoneNumberId,
      isActive: true,
    });

    if (!project) {
      console.warn("No project found for phone_number_id:", phoneNumberId);
      return res.sendStatus(404);
    }

    const from = message.from;
<<<<<<< HEAD
    const projectId = project._id;
    const fileTree = project.fileTree;

     if (message.type === "text") {
      const text = message.text.body;
      await processMessage({ projectId, senderWaPhoneNo: from, messageText: text, fileTree });

    } else if (message.type === "interactive" && message.interactive?.type === "button_reply") {
      const buttonId = message.interactive.button_reply.id;
      // --- NEW LOGIC: Trigger the specific button action handler ---
      await handleButtonAction({ projectId, senderWaPhoneNo: from, buttonId, fileTree });
      // -----------------------------------------------------------
    } else {
      console.log(`Ignoring unsupported message type: ${message.type}`);
    }
=======

const messageText = message?.text?.body || "";
const buttonReplyId = message?.interactive?.button_reply?.id || "";

    // Send both text and button id to the processor
    await processMessage({
      projectId: project._id,
      senderWaPhoneNo: from,
      messageText,
      buttonReplyId,
    });
>>>>>>> 98b746c745a63444892ad0e78b10624d9f2dd7a4

    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling incoming message:", err);
    res.sendStatus(500);
  }
};
