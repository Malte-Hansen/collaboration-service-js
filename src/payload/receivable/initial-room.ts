export type InitialRoomPayload = {
  roomId: string;
  landscape: Landscape;
  openApps: App[];
  detachedMenus: DetachedMenu[];
};

// TODO missing properties

export type Landscape = {
  landscapeToken: string;
  timestamp: number;
};

export type App = {
  id: string;
  position: number[];
  quaternion: number[];
  openComponents: string[];
  scale: number[];
};

export type DetachedMenu = {
  entityId: string;
  entityType: string;
  userId: string;
  position: number[];
  quaternion: number[];
  scale: number[];
};
