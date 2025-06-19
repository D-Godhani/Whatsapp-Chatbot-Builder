import axios from "axios";
import projectModel from "../models/project.model.js";

// Helper function to get project credentials securely
async function getProjectCredentials(projectId) {
  const project = await projectModel.findById(projectId).select(
    "whatsappPhoneNumberId whatsappAccessToken"
  );
  if (!project || !project.whatsappPhoneNumberId || !project.whatsappAccessToken) {
    throw new Error(`WhatsApp credentials not configured for project ${projectId}`);
  }
  return {
    phoneNumberId: project.whatsappPhoneNumberId,
    accessToken: project.whatsappAccessToken,
  };
}

export async function sendWhatsappMessage({
  to,
  text,
  buttons = [],
  type = "text",
  content = {},
  projectId,
}) {
  try {
    const { phoneNumberId, accessToken } = await getProjectCredentials(projectId);

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

    let payload = {
      messaging_product: "whatsapp",
      to,
    };

    const finalText = text || content.text || "No message body";

    // 🎯 1. Interactive Buttons
    if (buttons.length > 0 && type === "text") {
      const formattedButtons =
        typeof buttons[0] === "string"
          ? buttons.slice(0, 3).map((label, index) => ({
              type: "reply",
              reply: {
                id: `btn_${index + 1}_${label.toLowerCase().replace(/\s+/g, "_")}`,
                title: label,
              },
            }))
          : buttons.slice(0, 3); // Already formatted

      payload.type = "interactive";
      payload.interactive = {
        type: "button",
        body: {
          text: finalText,
        },
        action: {
          buttons: formattedButtons,
        },
      };
    }

    // 📝 2. Plain Text Message
    else if (type === "text") {
      payload.type = "text";
      payload.text = { body: finalText };
    }

    // 📎 3. Media Messages
    else {
      payload.type = type;

      const mediaUrl = content.mediaUrl;
      if (!mediaUrl) throw new Error("Missing mediaUrl for media message");

      switch (type) {
        case "image":
          payload.image = {
            link: mediaUrl,
            caption: content.caption || "",
          };
          break;

        case "document":
          payload.document = {
            link: mediaUrl,
            filename: content.filename || "file.pdf",
            caption: content.caption || "",
          };
          break;

        case "video":
          payload.video = {
            link: mediaUrl,
            caption: content.caption || "",
          };
          break;

        case "audio":
          payload.audio = {
            link: mediaUrl,
          };
          break;

        case "sticker":
          payload.sticker = {
            link: mediaUrl,
          };
          break;

        default:
          throw new Error(`Unsupported message type: ${type}`);
      }
    }

    // 🚀 Send the message
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ WhatsApp message sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Error sending WhatsApp message:",
      error.response?.data || error.message
    );
    throw error;
  }
}