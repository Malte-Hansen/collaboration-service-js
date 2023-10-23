import { Controller } from 'src/util/controller';

export const USER_CONTROLLER_CONNECT_EVENT = 'user_controller_connect';

export type UserControllerConnectMessage = {
  controller: Controller;
};
