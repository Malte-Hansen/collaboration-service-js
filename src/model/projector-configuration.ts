/**
 * Model for projectorconfiguration of Synchronization feature.
 * Data for the ARENA2's projectors lay in ressources.
 */
export default class ProjectorConfiguration {
  id: string;
  yawPitchRoll: YawPitchRoll;
  projectorAngles: ProjectorAngles;

  getId() {
    return this.id;
  }

  setId(id: string) {
    this.id = id;
  }

  setYawPitchRoll(yawPitchRoll: YawPitchRoll) {
    this.yawPitchRoll = yawPitchRoll;
  }

  getYawPitchRoll() {
    return this.yawPitchRoll;
  }

  setProjectorAngles(projectorAngles: ProjectorAngles) {
    this.projectorAngles = projectorAngles;
  }

  getProjectorAngles() {
    return this.projectorAngles;
  }
}

/**
 * Projector's Euler's angles: yaw pitch roll
 */
class YawPitchRoll {
  yaw: number;
  pitch: number;
  roll: number;

  public YawPitchRoll() {}

  getYaw() {
    return this.yaw;
  }

  setYaw(yaw: number) {
    this.yaw = yaw;
  }

  getPitch() {
    return this.pitch;
  }

  setPitch(pitch: number) {
    this.pitch = pitch;
  }

  getRoll() {
    return this.roll;
  }

  setRoll(roll: number) {
    this.roll = roll;
  }
}

/**
 * Angles how the projector is set up at the dome.
 */
export class ProjectorAngles {
  upAngle: number;
  downAngle: number;
  leftAngle: number;
  rightAngle: number;

  public ProjectorAngles() {}

  getUpAngle() {
    return this.upAngle;
  }

  setUpAngle(up: number) {
    this.upAngle = up;
  }

  getDownAngle() {
    return this.downAngle;
  }

  setDownAngle(down: number) {
    this.downAngle = down;
  }

  getLeftAngle() {
    return this.leftAngle;
  }

  setLeftAngle(left: number) {
    this.leftAngle = left;
  }

  getRightAngle() {
    return this.rightAngle;
  }

  setRightAngle(right: number) {
    this.rightAngle = right;
  }
}
