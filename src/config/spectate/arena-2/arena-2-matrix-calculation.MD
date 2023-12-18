import { DEG2RAD } from 'three/src/math/MathUtils';
import * as THREE from 'three';

export type YawPitchRoll = {
  yaw: number;
  pitch: number;
  roll: number;
};

export type ProjectorAngles = {
  left: number;
  right: number;
  up: number;
  down: number;
};

// Quaternion which actually getting used for synchronization and shifting the projection according to usability
export type ProjectorQuaternion = {
  synchronizationQuaternion: THREE.Quaternion;
  domeTiltQuaternion: THREE.Quaternion;
};
/**
 * This class constists of all needed graphical information.
 * Here, lay down also all manipulation and information-restructure functions
 * to keep typesafety and a clear structure while processing the synchronization.
 */
export default class ProjectorConfiguration {
  id: string;
  yawPitchRoll: YawPitchRoll;
  projectorAngles: ProjectorAngles;
  projectorQuaternion: ProjectorQuaternion = {
    synchronizationQuaternion: new THREE.Quaternion(),
    domeTiltQuaternion: new THREE.Quaternion(),
  };

  // domeTilt for moving the projection into center of dome
  private domeTilt: number = 45;

  constructor(
    id: string,
    yawPitchRoll: YawPitchRoll,
    projectorAngles: ProjectorAngles,
  ) {
    // projectorAngles: ProjectorAngles // yawPitchRoll: YawPitchRoll, // id: string,
    this.id = id;
    this.yawPitchRoll = yawPitchRoll;
    this.projectorAngles = projectorAngles;
  }

  setProjectorConfigurations(projectorConfiguration: ProjectorConfiguration) {
    this.setProjectorQuaternion(projectorConfiguration.yawPitchRoll);
    this.setProjectorAngle(projectorConfiguration.projectorAngles);
  }

  // Considers dome tilt and shifts the projection to the dome center
  getDomeTiltQuaternion() {
    // 360° whole globe, 180° half globe after horizontal cut, 90° half of half globe with vertical cut.
    // Horizontal cut, then vertical cut of half globe = angle from border to dometop center
    const shiftedAngle = 360 / 2 / 2 - this.domeTilt;

    // after setting up rotation axes via synchronisation,
    // we can use positive pitch to shift synchronized projection to the center of the globe.
    const domeTiltQuaternion = new THREE.Quaternion(
      0,
      0,
      0,
      0,
    ).setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      shiftedAngle * THREE.MathUtils.DEG2RAD,
    );

    return domeTiltQuaternion;
  }

  // Sets projector yaw, pitch and roll angles of the device.
  // Device detection same as projector angle
  setProjectorQuaternion(yawPitchRoll: YawPitchRoll) {
    this.projectorQuaternion = {
      synchronizationQuaternion: new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          -yawPitchRoll.pitch * DEG2RAD, // NEGATIVE Pitch
          yawPitchRoll.yaw * DEG2RAD, // Yaw
          yawPitchRoll.roll * DEG2RAD, // Roll
          'ZXY',
        ),
      ),
      domeTiltQuaternion: this.getDomeTiltQuaternion(),
    };
  }

  // Sets the projector angles of the device: Detection of device via payload at start of synchronization
  // Could implement a test case for this, but need to save the mpcdi informations for that in frontend?!
  setProjectorAngle(projectorAngles: ProjectorAngles) {
    this.projectorAngles = projectorAngles;
  }
}
