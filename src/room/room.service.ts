import { Injectable } from '@nestjs/common';
import { RoomFactoryService } from 'src/factory/room-factory/room-factory.service';
import { Room } from 'src/model/room-model';

@Injectable()
export class RoomService {

    constructor(private readonly roomFactoryService: RoomFactoryService) {
        this.rooms = new Map();
    }

    private rooms: Map<string,Room>;

    createRoom(roomId: string): Room {
        const roomName = "Room " + roomId;
        const room = this.roomFactoryService.makeRoom(roomId, roomName);
        this.rooms.set(roomId, room);
        console.log('Created room ', roomId);
        return room;
    }

    deleteRoom(roomId: string): void {
        this.rooms.delete(roomId)
    }

    lookupRoom(roomId: string): Room {
        if (!this.rooms.has(roomId)) {
            throw new Error("Room not found: " + roomId)
        }
        return this.rooms.get(roomId);
    }

    roomExists(roomId: string): boolean {
        return this.rooms.has(roomId)
    }

    getRooms(): Room[] {
        return Array.from(this.rooms.values());
    }

    // TODO deleteRoomIfEmpty
}
