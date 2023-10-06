// Encapsulates responses to clients which are matched with a Nonce
export type ResponseMessage<T> = {
    nonce: number,
    response: T
  }