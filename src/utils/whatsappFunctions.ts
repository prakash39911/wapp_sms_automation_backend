import axios from "axios";

export const sendWhatsappMessage = async (to: string, message: string) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: {
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Message Successfully sent to ${to}`);
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error.response.data);
  }
};
