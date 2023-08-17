import { InitialRoomPayload } from "src/payload/receivable/initial-room";

export type CreateRoomMessage = {
    roomId: string;
    initialRoom: InitialRoomPayload
}