// Encapsulates messages between replicas which requires a newly generated unique ID
export type PublishIdMessage<T> = {
  id: string;
  message: T;
};
