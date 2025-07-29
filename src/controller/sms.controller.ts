import { Request, Response } from "express";
import { twilioClient } from "../config/twilio";
import { SMSConversation } from "../models/sms.model";
import { sendSMS } from "../utils/smsFunctions";

export async function handleSendSMS(req: Request, res: Response) {
  const { to, message } = req.body;

  if (!to || !message) {
    return res
      .status(400)
      .json({ error: "To and message fields are required." });
  }

  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    console.log("SMS sent successfully:", response.body);
    return res.status(200).json({ success: true, sid: response.sid });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return res.status(500).json({ error: "Failed to send SMS." });
  }
}

// messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,

export async function handleStartConversation(req: Request, res: Response) {
  const { phoneNumber, name } = req.body;

  if (!phoneNumber || !name) {
    return res
      .status(400)
      .json({ error: "Phone number and name are required." });
  }

  try {
    let conversation = await SMSConversation.findOne({ phoneNumber });

    if (!conversation) {
      conversation = new SMSConversation({
        name,
        phoneNumber,
        state: "started",
      });
    }
    conversation.state = "started";
    conversation.lastMessageTimestamp = new Date();

    // Send the bait message
    await sendSMS(phoneNumber, "Hi! This is a Bait Message!");
    await conversation.save();

    res.status(200).json({
      message: "Conversation Started, Bait message sent successfully",
    });
  } catch (error) {
    console.error("Error while starting SMS conversation", error);
    res.status(500).send("Failed to start conversation");
  }
}
