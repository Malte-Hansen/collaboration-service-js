export const MOUSE_PING_UPDATE_EVENT = 'mouse_ping_update';

export type MousePingUpdateMessage = {
  modelId: string;
  isApplication: boolean;
  position: number[];
};
