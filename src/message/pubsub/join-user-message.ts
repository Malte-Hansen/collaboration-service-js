export const JOIN_USER_EVENT = 'join-user';

export type JoinUserMessage = {
    userId: string,
    userName: string,
    colorId: number
}