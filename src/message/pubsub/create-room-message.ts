import { InitialRoomPayload } from "src/payload/receivable/initial-room";

export const CREATE_ROOM_EVENT = 'create-room';

export type CreateRoomMessage = {
    roomId: string;
    initialRoom: InitialRoomPayload,
    landscapeId: string
}