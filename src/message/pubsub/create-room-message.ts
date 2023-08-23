import { App, DetachedMenu, Landscape } from "src/payload/receivable/initial-room";

export const CREATE_ROOM_EVENT = 'create_room';

export type CreateRoomMessage = {
    roomId: string;
    initialRoom: PublishedInitialRoom,
}

export type PublishedInitialRoom = {
    landscape: PublishedLandscape,
    openApps: App[],
    detachedMenus: PublishedDetachedMenu[]
}

export type PublishedLandscape = {
    id: string,
    landscape: Landscape
}

export type PublishedDetachedMenu = {
    id: string,
    menu: DetachedMenu
}
