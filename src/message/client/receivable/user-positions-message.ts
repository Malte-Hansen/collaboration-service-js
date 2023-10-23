import { ControllerPose } from 'src/util/controller';
import { Pose } from 'src/util/pose';

export const USER_POSITIONS_EVENT = 'user_positions';

export type UserPositionsMessage = {
  controller1: ControllerPose;
  controller2: ControllerPose;
  camera: Pose;
};
