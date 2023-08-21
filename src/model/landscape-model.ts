import { GrabbableObjectModel } from "./grabbable-object-model";
import { ScalableBaseModel } from "./scalable-base-model";

export class LandscapeModel extends ScalableBaseModel implements GrabbableObjectModel {
    private landscapeToken: string;
    private timestamp: number;
  
    constructor(id: string) {
      super(id);
    }
  
    getLandscapeToken(): string {
      return this.landscapeToken;
    }
  
    setLandscapeToken(landscapeToken: string): void {
      this.landscapeToken = landscapeToken;
    }
  
    getTimestamp(): number {
      return this.timestamp;
    }
  
    setTimestamp(timestamp: number): void {
      this.timestamp = timestamp;
    }
  
    getGrabId(): string {
      return this.landscapeToken;
    }
  }