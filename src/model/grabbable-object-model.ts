export interface GrabbableObjectModel {
  getGrabId(): string;

  getPosition(): number[];

  setPosition(position: number[]): void;

  getQuaternion(): number[];

  setQuaternion(quaternion: number[]): void;

  getScale(): number[];

  setScale(scale: number[]): void;
}
