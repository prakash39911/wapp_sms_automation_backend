import { Request, Response } from "express";
import { twilioClient } from "../../config/twilio";
import { SMSConversation } from "../../models/sms.model";
import { sendSMS } from "../../utils/smsFunctions";
import { aiWillDecideIfInterestedOrNot } from "../../utils/geminiFunctions";

// Webhook for incoming Twilio messages
export async function handleIncomingSMS(req: Request, res: Response) {
  const from = req.body.From;
  const body = req.body.Body.toLowerCase();

  console.log("Incoming SMS from:", from);
  console.log("SMS Message body:", body);

  const conversation = await SMSConversation.findOne({ phoneNumber: from });

  if (!conversation) {
    console.log(`SMS Received from unknown user: ${from}`);
    return res.sendStatus(200);
  }

  conversation.lastMessageTimestamp = new Date();

  //State machine logic

  switch (conversation.state) {
    case "started":
      conversation.state = "awaiting_main_message_reply";
      await sendSMS(
        from,
        "Great! We have multiple options available.Prices will vary based on your route and travel date. Would you prefer a tour?"
      );
      break;

    case "awaiting_main_message_reply":
      const isInterestedReply = await aiWillDecideIfInterestedOrNot(
        body,
        "Great! We have multiple options available.Prices will vary based on your route and travel date. Would you prefer a tour?"
      );

      if (isInterestedReply === "true") {
        conversation.state = "interested";
        await sendSMS(
          from,
          "Awesome! We will connect you to our travel expert shortly. Expect a call from our team soon"
        );
      } else {
        conversation.state = "not_interested";
        await sendSMS(
          from,
          "No worries. Feel free to message us anytime if you need help with travel in the future. Have a great day!"
        );
      }
      break;
  }

  await conversation.save();
  res.sendStatus(200);
}
