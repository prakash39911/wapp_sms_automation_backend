import cron from "node-cron";
import User, { IUser } from "../../models/user.model";
import { sendWhatsappMessage } from "../whatsapp.controller";

// This function will be called from index.ts to start the jobs
export const startCronJobs = () => {
  // Run this job every hour
  cron.schedule("*/3 * * * *", async () => {
    console.log("Running scheduled follow-up job...");

    const twoDaysAgo = new Date(new Date().getTime() - 2 * 60 * 1000);
    const oneWeekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find users who haven't replied to the Bait message
    const userWhoHasNotReplyedToBaitMessage = await User.find({
      state: "started",
      lastMessageTimestamp: { $lte: twoDaysAgo },
    });

    for (const user of userWhoHasNotReplyedToBaitMessage) {
      user.state = "completed"; // Move to no_reply_1 state
      await sendWhatsappMessage(
        user.whatsappNumber,
        "Hey,\n just checking if you're still planning your trip? 😊\nLet us know !"
      );
      user.lastMessageTimestamp = new Date();
      await user.save();
    }

    // Find users who haven't replied to the main message
    const usersForFollowUp1 = await User.find({
      state: "awaiting_main_message_reply",
      lastMessageTimestamp: { $lte: twoDaysAgo },
    });

    for (const user of usersForFollowUp1) {
      user.state = "no_reply_1";
      await sendWhatsappMessage(
        user.whatsappNumber,
        "Hey,\n just checking if you're still planning your trip? 😊\nLet us know if you need options — happy to help!"
      ); // Or your "Short Message"
      user.lastMessageTimestamp = new Date();
      await user.save();
    }

    // Find users who haven't replied to the first follow-up
    const usersForFollowUp2 = await User.find({
      state: "no_reply_1",
      lastMessageTimestamp: { $lte: twoDaysAgo },
    });

    for (const user of usersForFollowUp2) {
      user.state = "no_reply_2";
      await sendWhatsappMessage(
        user.whatsappNumber,
        "Hi,\n just wanted to check if you're still interested in planning your trip with us?"
      );
      user.lastMessageTimestamp = new Date();
      await user.save();
    }

    const usersForFollowUpLast = await User.find({
      state: "no_reply_2",
      lastMessageTimestamp: { $lte: twoDaysAgo },
    });

    for (const user of usersForFollowUpLast) {
      user.state = "completed"; // Mark as completed or you can set to another state
      await sendWhatsappMessage(
        user.whatsappNumber,
        "Final follow-up! 😊\nLet us know if you're still looking — happy to help whenever you're ready."
      );
      user.lastMessageTimestamp = new Date();
      await user.save();
    }
    // Find users for weekly follow-up
    const notInterestedUsers = await User.find({
      state: "not_interested",
      lastMessageTimestamp: { $lte: oneWeekAgo },
    });

    for (const user of notInterestedUsers) {
      user.state = "completed"; // Or another state if you want to keep track
      await sendWhatsappMessage(
        user.whatsappNumber,
        "Planning a trip soon, {{1}}?\nWe can help you get the best seats and rates! Ping us anytime ✈️🚆"
      );
      await user.save();
    }
  });
};
