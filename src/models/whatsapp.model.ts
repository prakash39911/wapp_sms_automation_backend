import mongoose, { Schema, Document } from "mongoose";

// Define the possible states a user can be in, based on your flowchart.
export type TConversationState =
  | "pending" //when contact is added
  | "bait_message_sent" //when bait message is sent
  | "awaiting_main_message_reply" //when awaiting main message reply
  | "interested"
  | "not_interested"
  | "no_reply_1"
  | "no_reply_2"
  | "completed";

export interface IwhatsappConversation extends Document {
  whatsappNumber: string;
  name?: string;
  state: TConversationState;
  lastMessageTimestamp: Date;
  conversationHistory: {
    message: string;
    from: "user" | "bot";
    timestamp: Date;
  }[];
}

const whatsappConversationSchema = new Schema<IwhatsappConversation>(
  {
    whatsappNumber: { type: String, required: true, unique: true, index: true },
    name: { type: String },
    state: { type: String, required: true, default: "pending" },
    lastMessageTimestamp: { type: Date, default: Date.now },
    conversationHistory: [
      {
        message: String,
        from: { type: String, enum: ["user", "bot"] },
        timestamp: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const WhatsappConversation = mongoose.model<IwhatsappConversation>(
  "WhatsappConversation",
  whatsappConversationSchema
);
