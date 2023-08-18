export type ForwardedPubsubMessage<T> = {
    userId: string,
    roomId: string,
    message: T
}