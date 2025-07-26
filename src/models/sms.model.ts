import { Schema, model, Document } from "mongoose";

export type TConversationState =
  | "started"
  | "awaiting_main_message_reply"
  | "interested"
  | "not_interested"
  | "no_reply_1"
  | "no_reply_2"
  | "completed";

export interface IConversation extends Document {
  phoneNumber: string;
  name: string;
  state: TConversationState;
  lastMessageTimestamp: Date;
}

const smsConversationSchema = new Schema<IConversation>({
  phoneNumber: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  state: { type: String, required: true, default: "started" },
  lastMessageTimestamp: { type: Date, default: Date.now },
});

export const SMSConversation = model<IConversation>(
  "SMSConversation",
  smsConversationSchema
);
