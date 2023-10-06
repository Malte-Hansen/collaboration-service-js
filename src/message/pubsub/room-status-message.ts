// Encapsulates server-triggered room events which are exchanged between replicas
export type RoomStatusMessage<T> = {
    roomId: string,
    message: T
}