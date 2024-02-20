import { PublishedDetachedMenu } from 'src/message/pubsub/create-room-message';
import { App, Landscape } from 'src/payload/receivable/initial-room';

export const SYNC_ROOM_STATE_EVENT = 'sync_room_state';

export type SyncRoomStateMessage = {
  landscape: Landscape;
  openApps: App[];
  detachedMenus: PublishedDetachedMenu[];
};
