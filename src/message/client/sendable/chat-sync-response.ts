export const CHAT_SYNC_EVENT = 'chat_synchronization';

export type ChatSynchronizeResponse = {
    userId: string;
    msg: string;
    timestamp: string;
};
