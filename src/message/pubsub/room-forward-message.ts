// Encapsulates client-triggered synchronization messages which are forwarded between replicas
export type RoomForwardMessage<T> = {
  userId: string;
  roomId: string;
  message: T;
};
