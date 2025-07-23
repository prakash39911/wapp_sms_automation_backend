import cron from "node-cron";
import User, { IUser } from "../../models/user.model";
import { sendWhatsappMessage } from "../whatsapp.controller";

// This function will be called from app.ts to start the jobs
export const startCronJobs = () => {
  // Run this job every hour
  cron.schedule("0 * * * *", async () => {
    console.log("Running scheduled follow-up job...");

    const twoDaysAgo = new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000);

    // Find users who haven't replied to the main message
    const usersForFollowUp1 = await User.find({
      state: "awaiting_main_message_reply",
      lastMessageTimestamp: { $lte: twoDaysAgo },
    });

    for (const user of usersForFollowUp1) {
      user.state = "no_reply_1";
      await sendWhatsappMessage(user.whatsappNumber, "Are you there?"); // Or your "Short Message"
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
        "[Your Just Check Message Here]"
      );
      user.lastMessageTimestamp = new Date();
      await user.save();
    }

    // Find users for weekly follow-up
    // (You would need a more complex logic for this, e.g., checking for a 'last_follow_up_date' field)
    const notInterestedUsers = await User.find({
      state: "not_interested" /* and other conditions */,
    });
    for (const user of notInterestedUsers) {
      await sendWhatsappMessage(
        user.whatsappNumber,
        "[Your Weekly Follow up Message]"
      );
      // Update user to prevent sending again next hour
    }
  });
};
