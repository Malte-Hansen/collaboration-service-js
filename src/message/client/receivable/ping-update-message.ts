export const PING_UPDATE_EVENT = 'ping_update';

export type PingUpdateMessage = {
  controllerId: number;
  pinging: boolean;
};
