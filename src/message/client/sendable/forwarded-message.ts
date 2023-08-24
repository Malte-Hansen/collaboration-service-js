export type ForwardedMessage<T> = {
    userId: string,
    originalMessage: T
}