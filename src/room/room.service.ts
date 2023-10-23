import { Injectable } from '@nestjs/common';
import { RoomFactoryService } from 'src/factory/room-factory/room-factory.service';
import { Room } from 'src/model/room-model';

@Injectable()
export class RoomService {
  constructor(private readonly roomFactoryService: RoomFactoryService) {
    this.rooms = new Map();
  }

  private rooms: Map<string, Room>;

  /**
   * Creates a new local room model.
   *
   * @param roomId The ID of the room
   * @param landscapeId The ID of the landscape in the room
   * @returns The room model
   */
  createRoom(roomId: string, landscapeId: string): Room {
    const roomName = 'Room ' + roomId;
    const room = this.roomFactoryService.makeRoom(
      roomId,
      roomName,
      landscapeId,
    );
    this.rooms.set(roomId, room);
    console.log('Created room ', roomId);
    return room;
  }

  /**
   * Deletes a local room model
   *
   * @param roomId The ID of the room
   */
  deleteRoom(roomId: string): void {
    this.rooms.delete(roomId);
  }

  /**
   * Looks up a local room.
   *
   * @param roomId The ID of the room
   * @returns The room model
   */
  lookupRoom(roomId: string): Room {
    return this.rooms.get(roomId);
  }

  /**
   * Checks if a specific room exists locally.
   *
   * @param roomId The ID of the room
   * @returns 'true' if the room exist locally or 'false' if not
   */
  roomExists(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  /**
   * Gets all local rooms.
   *
   * @returns A list of the room models
   */
  getRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}
