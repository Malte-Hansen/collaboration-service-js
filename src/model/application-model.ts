import { GrabbableObjectModel } from "./grabbable-object-model";
import { ScalableBaseModel } from "./scalable-base-model";

export class ApplicationModel extends ScalableBaseModel implements GrabbableObjectModel {
    private openComponents: string[] = [];
  
    constructor(id: string) {
      super(id);
    }
  
    openComponent(id: string): void {
      this.openComponents.push(id);
    }
  
    closeComponent(id: string): void {
      const index = this.openComponents.indexOf(id);
      if (index !== -1) {
        this.openComponents.splice(index, 1);
      }
    }
  
    closeAllComponents(): void {
      this.openComponents = [];
    }
  
    getOpenComponents(): string[] {
      return [...this.openComponents];
    }
  
    getGrabId(): string {
      return this.getId();
    }
  }