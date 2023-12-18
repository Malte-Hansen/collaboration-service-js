import { Color } from 'src/util/color';

export const USER_CONNECTED_EVENT = 'user_connected';

export type UserConnectedMessage = {
  id: string;
  name: string;
  deviceId: string | undefined;
  color: Color;
  position: number[];
  quaternion: number[];
};
