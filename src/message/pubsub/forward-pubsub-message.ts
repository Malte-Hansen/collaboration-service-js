export type ForwardPubsubMessage<T> = {
    userId: string,
    roomId: string,
    message: T
}