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
    const roomMessages = this.messages.get(roomId) || [];
    this.messages.set(roomId, [...roomMessages, message]);
  }

  /**
   * Remove a messsage
   *
   * @param msgId Id of the message to be removed
   */
  removeMessage(roomId: string, msgId: number): void {
    //TODO: Implement msgId and remove message here
  }

  /**
   * Removes room key from messages (and therefore deletes the messages)
   *
   * @param roomId Id of the room to be removed
   */
  removeChatRoom(roomId: string): void {
    this.messages.delete(roomId)
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
