import { PublishedDetachedMenu } from 'src/message/pubsub/create-room-message';
import { App, Landscape } from 'src/payload/receivable/initial-room';
import { HighlightingObject } from '../sendable/initial-landscape-message';

export const SYNC_ROOM_STATE_EVENT = 'sync_room_state';

export type SyncRoomStateMessage = {
  landscape: Landscape;
  openApps: App[];
  detachedMenus: PublishedDetachedMenu[];
  highlightedExternCommunicationLinks: HighlightingObject[];
};
