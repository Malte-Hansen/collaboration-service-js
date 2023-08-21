import { BaseModel } from "./base-model";

export class ScalableBaseModel extends BaseModel {
    private scale: number[];
  
    constructor(id: string) {
      super(id);
    }
  
    getScale(): number[] {
      return [...this.scale];
    }
  
    setScale(scale: number[]): void {
      this.scale = [...scale];
    }
  }