export type RoomForwardMessage<T> = {
    userId: string,
    roomId: string,
    message: T
}