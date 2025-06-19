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


export async function sendWhatsappMessage({ to, text, projectId }) {
  try {
    const { phoneNumberId, accessToken } = await getProjectCredentials(projectId);

    const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
    
    const response = await axios.post(
      url,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: text },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Message sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Error sending WhatsApp message:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

export async function sendWhatsappMediaMessage({ to, mediaUrl, mediaType, caption, projectId }) {
    const { phoneNumberId, accessToken } = await getProjectCredentials(projectId);

    const payload = {
        messaging_product: "whatsapp",
        to: to,
        type: mediaType,
        [mediaType]: {
            link: mediaUrl,
            caption: caption,
        },
    };

    return callWhatsappAPI(phoneNumberId, accessToken, payload);
}
