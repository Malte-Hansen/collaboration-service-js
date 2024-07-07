export const CHAT_MESSAGE_EVENT = 'chat_message';

export type ChatMessage = {
  userId: string;
  msg: string;
  timestamp: string;
};
