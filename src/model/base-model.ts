export class BaseModel {
  // position data
  private xPos: number;
  private yPos: number;
  private zPos: number;
  private xQuat: number;
  private yQuat: number;
  private zQuat: number;
  private wQuat: number;

  private id: string;

  constructor(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  setId(id: string): void {
    this.id = id;
  }

  getPosition(): number[] {
    return [this.xPos, this.yPos, this.zPos];
  }

  setPosition(coordinates: number[]): void {
    this.xPos = coordinates[0];
    this.yPos = coordinates[1];
    this.zPos = coordinates[2];
  }

  setExactPosition(x: number, y: number, z: number): void {
    this.xPos = x;
    this.yPos = y;
    this.zPos = z;
  }

  setDeltaPosition(coordinates: number[]): void {
    this.xPos += coordinates[0];
    this.yPos += coordinates[1];
    this.zPos += coordinates[2];
  }

  getQuaternion(): number[] {
    return [this.xQuat, this.yQuat, this.zQuat, this.wQuat];
  }

  setQuaternion(quaternion: number[]): void {
    this.xQuat = quaternion[0];
    this.yQuat = quaternion[1];
    this.zQuat = quaternion[2];
    this.wQuat = quaternion[3];
  }

  setExactQuaternion(
    xQuat: number,
    yQuat: number,
    zQuat: number,
    wQuat: number,
  ): void {
    this.xQuat = xQuat;
    this.yQuat = yQuat;
    this.zQuat = zQuat;
    this.wQuat = wQuat;
  }
}
