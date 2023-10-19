export const MENU_DETACHED_EVENT = 'menu_detached';

export type MenuDetachedMessage = {
  detachId: string;
  entityType: string;
  position: number[];
  quaternion: number[];
  scale: number[];
  nonce: number;
};
