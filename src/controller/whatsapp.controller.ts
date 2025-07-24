import axios from "axios";
import User from "../models/user.model";
import { Request, Response } from "express";

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
    "Hi👋, thanks for reaching out to Sahil Travels!\nAre you looking for Sleeper or Seater? Private tour or Public? Let us know your travel dates too ✈️";
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
