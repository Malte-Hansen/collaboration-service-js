export const CHAT_MESSAGE_EVENT = 'chat_message';

export type ChatMessage = {
  msgId: number;
  userId: string;
  msg: string;
  userName: string;
  timestamp: string;
  isEvent: boolean;
  eventType: string;
  eventData: any[];
};
