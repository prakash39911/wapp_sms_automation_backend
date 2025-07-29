import { Request, Response } from "express";
import { twilioClient } from "../../config/twilio";
import { SMSConversation } from "../../models/sms.model";
import { replyViaSms } from "../../utils/smsFunctions";
import { aiWillDecideIfInterestedOrNot } from "../../utils/geminiFunctions";
const { MessagingResponse } = require("twilio").twiml;

//Webhook for Incoming Messages
export async function handleIncomingSMS(req: Request, res: Response) {
  const from = req.body.From;
  const smsRequest = req.body.Body;

  console.log("SMS received from--", from);
  console.log("Actual SMS--", smsRequest);

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
      replyViaSms(
        res,
        "Hi, thanks for reaching out to Sahil Travels! Are you looking for Sleeper or Seater? Private tour or Public? Let us know your travel dates too"
      );
      break;

    case "awaiting_main_message_reply":
      const isInterestedReply = await aiWillDecideIfInterestedOrNot(
        smsRequest,
        "Hi, thanks for reaching out to Sahil Travels! Are you looking for Sleeper or Seater? Private tour or Public? Let us know your travel dates too"
      );

      if (isInterestedReply === "true") {
        conversation.state = "interested";
        replyViaSms(
          res,
          "Awesome! We will connect you to our travel expert shortly. Expect a call from our team soon"
        );
      } else {
        conversation.state = "not_interested";
        replyViaSms(
          res,
          "No worries. Feel free to message us anytime if you need help with travel in the future. Have a great day!"
        );
      }
      break;

    default: {
      conversation.state = "interested";
      replyViaSms(
        res,
        "Awesome! We will connect you to our travel expert shortly. Expect a call from our team soon"
      );
    }
  }

  await conversation.save();
}
