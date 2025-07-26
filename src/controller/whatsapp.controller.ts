import axios from "axios";
import { WhatsappConversation } from "../models/whatsapp.model";
import { Request, Response } from "express";
import { sendWhatsappMessage } from "../utils/whatsappFunctions";

// End point to Test sending a WhatsApp message
// This is just for testing purposes, We can remove it later
export const sendWappMessage = async (req: Request, res: Response) => {
  try {
    await axios.post(
      `https://graph.facebook.com/v23.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: "+918660617089",
        type: "text",
        text: {
          body: "Hello, this is a test message from your WhatsApp API!",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Message sent Successfully`);
    res.status(200).json({ message: "Message sent successfully" });
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error.response.data);
  }
};

// You'll also need a function to INITIATE the conversation
// This would be called from another route, e.g., when your website form is submitted
export const startConversation = async (req: Request, res: Response) => {
  const { name, whatsappNumber } = req.body;

  if (!name || !whatsappNumber) {
    return res
      .status(400)
      .json({ message: "Name and WhatsApp number are required" });
  }

  try {
    let conversation = await WhatsappConversation.findOne({ whatsappNumber });

    if (!conversation) {
      conversation = new WhatsappConversation({
        name,
        whatsappNumber,
        state: "awaiting_main_message_reply",
        conversationHistory: [],
      });
    }
    conversation.state = "awaiting_main_message_reply";
    conversation.lastMessageTimestamp = new Date();

    const initialMessage =
      "Hi👋, thanks for reaching out to Sahil Travels!\nAre you looking for Sleeper or Seater? Private tour or Public? Let us know your travel dates too ✈️";
    await sendWhatsappMessage(whatsappNumber, initialMessage);

    conversation.conversationHistory.push({
      message: initialMessage,
      from: "bot",
      timestamp: new Date(),
    });
    await conversation.save();

    res.status(200).json({
      message: "Conversation started. Initial message sent.",
    });
  } catch (error) {
    console.error("Error while starting whatsapp conversation", error);
    res.status(500).send("Failed to start conversation");
  }
};
