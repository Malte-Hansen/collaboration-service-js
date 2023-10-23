export type Controller = {
  controllerId: number;
  assetUrl: string;
  position: number[];
  quaternion: number[];
  intersection: number[];
};

export type ControllerPose = {
  position: number[];
  quaternion: number[];
  intersection: number[];
};
