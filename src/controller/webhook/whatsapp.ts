import { Request, Response } from "express";
import User from "../../models/user.model";
import {
  isInterested,
  isNotInterested,
  sendWhatsappMessage,
} from "../whatsapp.controller";

// To handle the initial verification request from Meta
export const verifyWebhook = (req: Request, res: Response) => {
  // ... (logic from Meta's documentation)
};

// To handle incoming messages from users
export const handleIncomingMessage = async (req: Request, res: Response) => {
  const body = req.body;

  // Basic check for a valid WhatsApp message structure
  if (
    body.object === "whatsapp_business_account" &&
    body.entry &&
    body.entry[0].changes
  ) {
    const change = body.entry[0].changes[0];
    if (change.value.messages) {
      const msg = change.value.messages[0];
      const from = msg.from; // User's WhatsApp number
      const text = msg.text.body;

      let user = await User.findOne({ whatsappNumber: from });

      if (!user) {
        // This flow assumes the conversation is initiated by you.
        // If a user messages you first out of the blue, you can decide how to handle it.
        // For now, let's assume users are created when your website form is submitted.
        console.log(`Received message from unknown user: ${from}`);
        return res.sendStatus(200);
      }

      // Update conversation history and timestamp
      user.conversationHistory.push({
        message: text,
        from: "user",
        timestamp: new Date(),
      });
      user.lastMessageTimestamp = new Date();

      // STATE MACHINE LOGIC
      switch (user.state) {
        case "started":
          // This state is after you sent the "Sleeper or Seat..." message.
          // Now you check their reply.
          // For simplicity, we assume any reply means "Yes we are offer"
          user.state = "awaiting_main_message_reply";
          await sendWhatsappMessage(
            from,
            "Great! Here is our main offer... [Your Main Message Here]"
          );
          break;

        case "awaiting_main_message_reply":
          // Analyze their reply to the main message
          if (isInterested(text)) {
            user.state = "interested";
            await sendWhatsappMessage(from, "Ok great we will Connect you.");
            // Here you would also trigger a notification to your team!
            // (e.g., send an email, Slack message, etc.)
          } else if (isNotInterested(text)) {
            user.state = "not_interested";
            await sendWhatsappMessage(from, "[Your Future Message Here]");
          } else {
            // If the reply is ambiguous, you might ask for clarification or do nothing.
          }
          break;
        // Other states are handled by the cron job, not by user replies.
      }
      await user.save();
    }
  }
  res.sendStatus(200);
};
