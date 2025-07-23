import mongoose, { Schema, Document } from "mongoose";

// Define the possible states a user can be in, based on your flowchart.
export type TConversationState =
  | "started"
  | "awaiting_main_message_reply"
  | "interested"
  | "not_interested"
  | "no_reply_1" // After Main Message
  | "no_reply_2" // After Short Message
  | "completed";

export interface IUser extends Document {
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

const UserSchema: Schema = new Schema(
  {
    whatsappNumber: { type: String, required: true, unique: true },
    name: { type: String },
    state: { type: String, required: true, default: "started" },
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

export default mongoose.model<IUser>("User", UserSchema);
