import {
  TConversationState,
  WhatsappConversation,
} from "../models/whatsapp.model";
import { sendWhatsappMessage } from "./whatsappFunctions";

export async function processFollowUp(
  state: TConversationState,
  dateFilter: Date,
  newMessage: string,
  newState: TConversationState
) {
  try {
    const usersToProcess = await WhatsappConversation.find({
      state: state,
      lastMessageTimestamp: { $lte: dateFilter },
    }).lean();

    if (usersToProcess.length === 0) {
      return;
    }

    const messagePromises = usersToProcess.map((user) =>
      sendWhatsappMessage(user.whatsappNumber, newMessage)
    );

    const messageResults = await Promise.allSettled(messagePromises);

    const successfulUserIds: any = [];

    messageResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successfulUserIds.push(usersToProcess[index]._id);
      } else {
        console.error(
          `Failed to send message to ${usersToProcess[index].whatsappNumber}:`,
          result.reason
        );
      }
    });

    if (successfulUserIds.length > 0) {
      await WhatsappConversation.bulkWrite([
        {
          updateMany: {
            filter: { _id: { $in: successfulUserIds } },
            update: {
              $set: { state: newState, lastMessageTimestamp: new Date() },
            },
          },
        },
      ]);
    }
  } catch (error) {
    console.error(`Error processing follow-ups for state '${state}':`, error);
  }
}
