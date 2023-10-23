// Encapsulates client-triggered synchronization messages which are broadcasted to the clients
export type ForwardedMessage<T> = {
  userId: string;
  originalMessage: T;
};
