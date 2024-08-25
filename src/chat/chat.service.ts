import { Injectable } from '@nestjs/common';
import { ChatMessage } from 'src/message/client/receivable/chat-message';

@Injectable()
export class ChatService {
  private messages: Map<String, ChatMessage[]>;
  private mutedUser: Map<String, String[]>;

  constructor() {
    this.messages = new Map<String, ChatMessage[]>();
    this.mutedUser = new Map<String, String[]>();
  }

  /**
   * Adds the new message
   *
   * @param roomId The room where the message was sent
   * @param message The new message
   */
  addMessage(roomId: string, message: ChatMessage): void {
    if(!this.isUserMuted(roomId, message.userId)) {
      const roomMessages = this.messages.get(roomId) || [];
      this.messages.set(roomId, [...roomMessages, message]);
    }
  }

  /**
   * Removes a messsage
   *
   * @param roomId The room where the message shall be deleted
   * @param msgId Id of the message to be removed
   */
  removeMessage(roomId: string, msgId: number): void {
    //TODO: Implement msgId and remove message here
  }

  /**
   * Mute a user by adding the user to the mute list
   *
   * @param roomId The room where the user is muted
   * @param userId Id of the user to be muted
   */
  muteUser(roomId: string, userId: string): void {
    const mutedUsers = this.mutedUser.get(roomId) || [];
    this.mutedUser.set(roomId, [...mutedUsers, userId]);
  }

  /**
   * Unmute a user by removing the user from the mute list
   *
   * @param roomId The room where the user is unmuted
   * @param userId Id of the user to be unmuted
   */
  unmuteUser(roomId: string, userId: string): void {
    let mutedUsers = this.mutedUser.get(roomId) || [];
    mutedUsers = mutedUsers.filter((id) => id !== userId);
    this.mutedUser.set(roomId, mutedUsers);
  }

  /**
   * Checks if a user is muted
   * 
   * @param roomId The room where the user is checked
   * @param userId The id of the user to check
   * @returns True if the user is muted, otherwise false
   */
  isUserMuted(roomId: string, userId: string): boolean {
    return this.mutedUser.get(roomId)?.includes(userId);
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
