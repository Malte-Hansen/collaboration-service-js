import { OtherUser, User } from 'src/util/user';

export const SELF_CONNECTED_EVENT = 'self_connected';

export type SelfConnectedMessage = {
  self: User;
  users: OtherUser[];
};
