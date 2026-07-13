import { generateText, stepCountIs, ModelMessage } from 'ai';
import { google } from '@ai-sdk/google';
import { adminTools } from './tools';

// In-memory conversational session store (keyed by phone number)
const chatHistories = new Map<string, ModelMessage[]>();
export const lastShownDeeds = new Map<string, string>();

function getHistory(phone: string): ModelMessage[] {
  if (!chatHistories.has(phone)) {
    chatHistories.set(phone, []);
  }
  return chatHistories.get(phone)!;
}

export async function processAgentMessage(
  messageText: string,
  adminProfile: any,
  audioFile?: { data: Buffer; mimeType: string }
): Promise<string> {
  const phone = adminProfile.phone || adminProfile.whatsapp || 'default';
  const lastDeedId = lastShownDeeds.get(phone) || 'None';

  const systemPrompt = `
You are the YDC Portal WhatsApp Assistant. You help local chapter presidents and system admins manage youth portal activities.
You are communicating with: ${adminProfile.full_name}
Role: ${adminProfile.role}
Unit ID: ${adminProfile.unit_id || 'Global'}

OPERATIONAL GUIDELINES:
1. Run commands exactly as requested by using the tools provided.
2. If the user is a "president", they are SCOPED to Unit ID: ${adminProfile.unit_id}. Do not let them manage, review, or fetch data from other units.
3. Be friendly, professional, and support communication in English or Urdu (Roman Urdu / Nastaliq script) as preferred by the user.
4. Explain clearly what you did after executing a tool (e.g. if you approved a deed, state that the deed was approved and mention the base reward and bonus coins).
5. If the user asks for information you don't have, or tries to do something unauthorized, politely inform them of the limitations.
6. Memory: You have conversational memory. Refer back to previously searched users, events, or numbers if requested (e.g., if the user says "adjust his coins", check the previous messages in context to see who "his" refers to).
7. Parameters & Follow-ups: If a user requests an action (e.g. creating an event) but does not provide all the required or key optional fields needed/expected for the tool (e.g., event location, start/end times, coin reward, capacity), you must NOT guess or generate values for those fields yourself. Instead, strictly reply to the user asking them to provide or confirm the missing fields. At the end of your message, you can add: "Or would you like me to fill them in with defaults / generate them myself?"

CURRENT SESSION CONTEXT:
- Last shown deed ID: ${lastDeedId}
If the user asks to "approve this", "approve", "reject this", "reject", or similar, check the "Last shown deed ID" above. If it is not "None", use this ID as the target for the approveDeed or rejectDeed tool call. If it is "None", ask the user which deed they want to approve or reject.
`;

  try {
    const tools = adminTools(adminProfile);
    const history = getHistory(phone);

    // Push the current user prompt (text or multimodal audio) into the history array
    if (audioFile) {
      console.log(`[Agent] Including voice/audio file attachment (${audioFile.mimeType}, ${audioFile.data.length} bytes)...`);
      history.push({
        role: 'user',
        content: [
          {
            type: 'file',
            data: audioFile.data,
            mediaType: audioFile.mimeType
          },
          {
            type: 'text',
            text: messageText || 'Listen to the audio message and follow instructions.'
          }
        ]
      });
    } else {
      history.push({ role: 'user', content: messageText });
    }

    console.log(`[Agent] Calling Gemini (gemini-3.1-flash-lite) with ${history.length} messages and ${Object.keys(tools).length} tools (stopWhen: 5 steps)...`);

    // Let AI SDK v7 handle the entire tool execution loop natively.
    // Tools wrapped with tool() helper will auto-execute. We use stopWhen for maximum step limit.
    const result = await generateText({
      model: google('gemini-3.1-flash-lite'),
      messages: history,
      system: systemPrompt,
      tools: tools as any,
      stopWhen: stepCountIs(5),
    });

    // Log steps for debugging
    if (result.steps && result.steps.length > 0) {
      console.log(`[Agent] SDK completed ${result.steps.length} step(s):`);
      for (let i = 0; i < result.steps.length; i++) {
        const step = result.steps[i] as any;
        if (step.toolCalls && step.toolCalls.length > 0) {
          const tc = step.toolCalls[0];
          const hasOutput = step.toolResults?.[0]?.output !== undefined;
          console.log(`  Step ${i + 1}: Tool call "${tc.toolName}" → ${hasOutput ? 'success' : 'no result'}`);
        } else if (step.text) {
          console.log(`  Step ${i + 1}: Text response (${step.text.length} chars)`);
        }
      }
    }

    // Extract final text — walk steps backward as fallback
    let textResponse = result.text;
    if (!textResponse && result.steps && result.steps.length > 0) {
      for (let i = result.steps.length - 1; i >= 0; i--) {
        if (result.steps[i].text) {
          textResponse = result.steps[i].text;
          break;
        }
      }
    }

    const finalResponse = textResponse || "I processed your request, but couldn't generate a text response.";

    // Save all intermediate tool calls, results, and assistant response to history
    history.push(...result.responseMessages);

    // Keep history size within limits (e.g., last 24 entries) to avoid context limit drift
    if (history.length > 24) {
      history.splice(0, history.length - 24);
    }

    return finalResponse;

  } catch (err: any) {
    console.error('[Agent] Error:', err.message || err);
    return `Sorry, I encountered an error while processing your request: ${err.message || err}`;
  }
}
