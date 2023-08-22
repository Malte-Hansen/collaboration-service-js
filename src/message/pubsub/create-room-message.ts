import { App, DetachedMenu, Landscape } from "src/payload/receivable/initial-room";

export const CREATE_ROOM_EVENT = 'create-room';

export type CreateRoomMessage = {
    roomId: string;
    initialRoom: PublishedInitialRoom,
    landscapeId: string
}

export type PublishedInitialRoom = {
    landscape: Landscape,
    openApps: App[],
    detachedMenus: PublishedDetachedMenu[]
}

export type PublishedDetachedMenu = {
    id: string,
    menu: DetachedMenu
};