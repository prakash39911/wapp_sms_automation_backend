import axios from "axios";
import User from "../models/user.model";
import { IUser } from "../models/user.model";
import { Request, Response } from "express";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_API_URL = `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

export const sendWhatsappMessage = async (to: string, message: string) => {
  try {
    await axios.post(
      WHATSAPP_API_URL,
      {
        messaging_product: "whatsapp",
        to: to,
        text: { body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`Message sent to ${to}`);
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error.response.data);
  }
};

// Helper functions to interpret user replies
export const isInterested = (text: string): boolean => {
  const keywords = ["interested", "yes", "ok", "details", "price"];
  return keywords.some((kw) => text.toLowerCase().includes(kw));
};

export const isNotInterested = (text: string): boolean => {
  const keywords = ["not interested", "no", "stop", "unsubscribe"];
  return keywords.some((kw) => text.toLowerCase().includes(kw));
};

// You'll also need a function to INITIATE the conversation
// This would be called from another route, e.g., when your website form is submitted
export const startConversation = async (req: Request, res: Response) => {
  const { name, whatsappNumber } = req.body;
  let user = await User.findOne({ whatsappNumber });
  if (!user) {
    user = new User({
      name,
      whatsappNumber,
      state: "started",
      conversationHistory: [],
    });
  }
  user.state = "started";
  user.lastMessageTimestamp = new Date();

  const initialMessage =
    "So are you Offering Sleeper or Seat, Price, Private tours or Public";
  await sendWhatsappMessage(whatsappNumber, initialMessage);

  user.conversationHistory.push({
    message: initialMessage,
    from: "bot",
    timestamp: new Date(),
  });
  await user.save();
  res.status(200).json({
    message: "Conversation started. Initial message sent.",
  });
};
