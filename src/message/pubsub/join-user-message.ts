export const JOIN_USER_EVENT = 'join-user';

export type JoinUserMessage = {
    roomId: string,
    userId: string,
    userName: string
}