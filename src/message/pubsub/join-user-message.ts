export const JOIN_USER_CHANNEL = 'join-user';

export type JoinUserMessage = {
    roomId: string,
    userId: string,
    userName: string
}