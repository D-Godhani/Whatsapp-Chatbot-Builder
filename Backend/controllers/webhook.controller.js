import projectModel from "../models/project.model.js";
import {
  processMessage,
  handleButtonAction,
} from "../services/flowExecutor.service.js";

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

export const handleIncomingMessage = async (req, res) => {
  try {
    const body = req.body;
    if (body.object !== "whatsapp_business_account") return res.sendStatus(404);

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const phoneNumberId = change?.metadata?.phone_number_id;
    const message = change?.messages?.[0];

    if (!phoneNumberId || !message) return res.sendStatus(200);

    const project = await projectModel.findOne({
      whatsappPhoneNumberId: phoneNumberId,
      isActive: true,
    });
    if (!project) {
      console.warn(
        "No active project found for phone_number_id:",
        phoneNumberId
      );
      return res.sendStatus(404);
    }

    const from = message.from;
    const projectId = project._id;
    const fileTree = project.fileTree;

    if (message.type === "text") {
      const text = message.text.body;
      await processMessage({
        projectId,
        senderWaPhoneNo: from,
        messageText: text,
        fileTree,
      });
    } else if (
      message.type === "interactive" &&
      message.interactive?.type === "button_reply"
    ) {
      const buttonId = message.interactive.button_reply.id;
      const buttonTitle = message.interactive.button_reply.title;
      const buttonConfig = findButtonConfig(buttonId, fileTree);

      if (buttonConfig?.action) {
        await handleButtonAction({
          projectId,
          senderWaPhoneNo: from,
          buttonId,
          fileTree,
        });
      } else {
        await processMessage({
          projectId,
          senderWaPhoneNo: from,
          messageText: buttonTitle,
          fileTree,
        });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Error handling incoming message:", err);
    res.sendStatus(500);
  }
};

function findButtonConfig(buttonId, fileTree) {
  for (const node of fileTree.nodes) {
    if (
      node.type === "buttons" &&
      Array.isArray(node.data?.properties?.buttons)
    ) {
      const foundButton = node.data.properties.buttons.find(
        (b) => b.id === buttonId
      );
      if (foundButton) return foundButton;
    }
  }
  return null;
}
