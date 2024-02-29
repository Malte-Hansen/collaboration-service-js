import { BaseModel } from './base-model';

export class ScalableBaseModel extends BaseModel {
  private scale: number[];

  constructor(id: string) {
    super(id);
    this.scale = [1, 1, 1];
  }

  getScale(): number[] {
    return [...this.scale];
  }

  setScale(scale: number[]): void {
    this.scale = [...scale];
  }
}
