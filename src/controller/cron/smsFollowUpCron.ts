import cron from "node-cron";
import { SMSConversation } from "../../models/sms.model";
import { sendSMS } from "../../utils/smsFunctions";

export const startSmsCronJobs = () => {
  cron.schedule("0 * * * *", async () => {
    console.log("Running scheduled SMS follow-up job...");

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    //Find Users who haven't replied to the Bait message
    const userWhoHasNotReplyedToBaitMessage = await SMSConversation.find({
      lastMessageTimestamp: { $lte: twoDaysAgo },
      state: "started",
    });

    for (const conversation of userWhoHasNotReplyedToBaitMessage) {
      conversation.state = "completed"; // Move to no_reply_1 state
      await sendSMS(
        conversation.phoneNumber,
        "Hey, just checking if you're still planning your trip? Let us know !"
      );
      conversation.lastMessageTimestamp = new Date();
      await conversation.save();
    }

    // Find users who haven't replied to the main message
    const usersForFollowUp1 = await SMSConversation.find({
      state: "awaiting_main_message_reply",
      lastMessageTimestamp: { $lte: twoDaysAgo },
    });

    for (const conversation of usersForFollowUp1) {
      conversation.state = "no_reply_1";
      await sendSMS(
        conversation.phoneNumber,
        "Hey, just checking if you're still planning your trip? Let us know if you need options — happy to help!"
      );
      conversation.lastMessageTimestamp = new Date();
      await conversation.save();
    }

    const usersForFollowUp2 = await SMSConversation.find({
      state: "no_reply_1",
      lastMessageTimestamp: { $lte: twoDaysAgo },
    });

    for (const conversation of usersForFollowUp2) {
      conversation.state = "no_reply_2";
      await sendSMS(
        conversation.phoneNumber,
        "Hi, just wanted to check if you're still interested in planning your trip with us?"
      );
      conversation.lastMessageTimestamp = new Date();
      await conversation.save();
    }

    const usersForFollowUpLast = await SMSConversation.find({
      state: "no_reply_2",
      lastMessageTimestamp: { $lte: twoDaysAgo },
    });

    for (const conversation of usersForFollowUpLast) {
      conversation.state = "completed";
      await sendSMS(
        conversation.phoneNumber,
        "Final follow-up! Let us know if you're still looking — happy to help whenever you're ready."
      );
      conversation.lastMessageTimestamp = new Date();
      await conversation.save();
    }

    // Find Users for weekly follow-up
    const usersForWeeklyFollowUp = await SMSConversation.find({
      lastMessageTimestamp: { $lte: oneWeekAgo },
      state: "not_interested",
    });

    for (const conversation of usersForWeeklyFollowUp) {
      conversation.state = "completed"; // Mark as completed or you can set to another state
      await sendSMS(
        conversation.phoneNumber,
        "Hey, just checking in! We have some new offers that might interest you. Let us know if you'd like to hear more!"
      );
      conversation.lastMessageTimestamp = new Date();
      await conversation.save();
    }
  });
};
