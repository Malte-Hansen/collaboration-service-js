import { Injectable } from '@nestjs/common';
import { ChatMessage } from 'src/message/client/receivable/chat-message';

@Injectable()
export class ChatService {
  private messages: Map<String, ChatMessage[]>;

  constructor() {
    this.messages = new Map<String, ChatMessage[]>();
  }

  /**
   * Adds a new message
   *
   * @param message The new message
   */
  addMessage(roomId: string, message: ChatMessage): void {
    console.log("Added message" + message.msg + "with userId:" + message.userId + "to roomId:" + roomId)

    const roomMessages = this.messages.get(roomId) || [];
    this.messages.set(roomId, [...roomMessages, message]);
  }

  /**
   * Remove a messsage
   *
   * @param msgId Id of the message to be removed
   */
  removeMessage(msgId: number): void {
    //TODO: Implement msgId and remove message here
  }

  /**
   * Return all chat messages
   *
   * @returns Chat messages
   */
  getChatMessages(roomId: string): ChatMessage[] {
    return this.messages.get(roomId) || [];
  }
}
