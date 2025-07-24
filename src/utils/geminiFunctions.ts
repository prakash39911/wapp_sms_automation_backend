import { geminiAI } from "../config/gemini";

export async function aiWillDecideIfInterestedOrNot(
  userInput: string,
  previousMessageFromUs: string // your original message sent to user
): Promise<"true" | "false"> {
  try {
    const prompt = `
You are a decision-making assistant for a travel agency's WhatsApp automation.

The following is a message sent by the travel agency:
"${previousMessageFromUs}"

And this is the user's reply:
"${userInput}"

Your job is to decide if the user is interested in the travel services being offered in the message above.
Interest includes short replies like "ok", "yes", "sounds good", etc., if they indicate acceptance or agreement.

Reply ONLY with "true" if the user seems interested.
Reply ONLY with "false" if the user is not interested or the message is irrelevant.

Return only "true" or "false".`;

    const response = await geminiAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        systemInstruction: `You are an AI working for a travel agency. Your task is to return ONLY "true" or "false" based on the user's reply to a given offer message.
"true" = user seems interested (even short or vague replies like "ok", "cool", "yes", "how much?").
"false" = not interested or irrelevant.
Don't include explanations or other words.`,
        temperature: 0.2,
      },
    });

    const answer = response?.text?.trim().toLowerCase();
    console.log("AI Filtered response:", answer);
    return answer === "true" ? "true" : "false";
  } catch (error) {
    console.log("Error while generating response:", error);
    throw error;
  }
}
