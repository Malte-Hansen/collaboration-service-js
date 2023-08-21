import { BaseModel } from './base-model';

export class ControllerModel extends BaseModel {
  private readonly controllerId: number;
  private readonly assetUrl: string;
  private intersection: number[] | null = null;

  constructor(id: string, controllerId: number, assetUrl: string) {
    super(id);
    this.controllerId = controllerId;
    this.assetUrl = assetUrl;
  }

  getControllerId(): number {
    return this.controllerId;
  }

  getAssetUrl(): string {
    return this.assetUrl;
  }

  hasIntersection(): boolean {
    return this.intersection !== null;
  }

  getIntersection(): number[] | null {
    if (!this.hasIntersection()) {
      return null;
    }
    return [this.intersection[0], this.intersection[1], this.intersection[2]];
  }

  setIntersection(intersection: number[] | null): void {
    if (intersection == null) {
      this.intersection = null;
      return;
    }
    if (!this.hasIntersection()) {
      this.intersection = new Array(3);
    }
    this.intersection[0] = intersection[0];
    this.intersection[1] = intersection[1];
    this.intersection[2] = intersection[2];
  }
}