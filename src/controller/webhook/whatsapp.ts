import { Request, Response } from "express";
import { WhatsappConversation } from "../../models/whatsapp.model";
import dotenv from "dotenv";
import { aiWillDecideIfInterestedOrNot } from "../../utils/geminiFunctions";
import { mainMessage } from "../../data/data";
import { sendWhatsappMessage } from "../../utils/whatsappFunctions";

dotenv.config();

const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN;

export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("Whatsapp WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      return res.status(403).send("Forbidden");
    }
  }
  return res.status(400).send("Bad Request");
};

// To handle incoming messages from users
export const handleIncomingMessage = async (req: Request, res: Response) => {
  const body = req.body;
  // console.log(
  //   "WebHook received from Whatsapp Cloud--",
  //   JSON.stringify(req.body, null, 2)
  // );

  // Basic check for a valid WhatsApp message structure
  if (
    body.object === "whatsapp_business_account" &&
    body.entry &&
    body.entry[0].changes
  ) {
    const change = body.entry[0].changes[0];
    if (change.value.messages) {
      const msg = change.value.messages[0];
      const from = "+" + msg.from; // User's WhatsApp number
      const text = msg.text.body;

      console.log(`Received message from ${from}: ${text}`);

      let conversation = await WhatsappConversation.findOne({
        whatsappNumber: from,
      });

      if (!conversation) {
        // This flow assumes the conversation is initiated by you.
        // If a user messages you first out of the blue, you can decide how to handle it.
        // For now, let's assume users are created when your website form is submitted.
        console.log(`Received message from unknown user: ${from}`);
        return res.sendStatus(200);
      }

      // Update conversation history and timestamp
      conversation.conversationHistory.push({
        message: text,
        from: "user",
        timestamp: new Date(),
      });
      conversation.lastMessageTimestamp = new Date();

      // STATE MACHINE LOGIC
      switch (conversation.state) {
        case "bait_message_sent":
          // This state is after you sent the "Sleeper or Seat..." message.
          // Now you check their reply.
          // For simplicity, we assume any reply means "Yes we are offer"
          conversation.state = "awaiting_main_message_reply";
          await sendWhatsappMessage(from, mainMessage);
          break;

        case "awaiting_main_message_reply":
          const isInterestedReply = await aiWillDecideIfInterestedOrNot(
            text,
            mainMessage
          );
          // Analyze their reply to the main message
          if (isInterestedReply === "true") {
            conversation.state = "interested";
            await sendWhatsappMessage(
              from,
              "Awesome! 🎉\nWe will connect you to our travel expert shortly. Expect a call from our team soon 📞"
            );
            // Here you would also trigger a notification to your team!
            // (e.g., send an email, Slack message, etc.)
          } else {
            conversation.state = "not_interested";
            await sendWhatsappMessage(
              from,
              "No worries 😊\nFeel free to message us anytime if you need help with travel in the future. Have a great day!"
            );
          }
          break;

        default: {
          conversation.state = "interested";
          await sendWhatsappMessage(
            from,
            "Awesome! We will connect you to our travel expert shortly. Expect a call from our team soon"
          );
        }
        // Other states are handled by the cron job, not by user replies.
      }
      await conversation.save();
    }
  }
  res.sendStatus(200);
};
