import { GrabbableObjectModel } from "./grabbable-object-model";
import { ScalableBaseModel } from "./scalable-base-model";

export class DetachedMenuModel extends ScalableBaseModel implements GrabbableObjectModel {
    private entityType: string;
    private detachId: string;
  
    constructor(detachId: string, entityType: string, objectId: string) {
      super(objectId);
      this.detachId = detachId;
      this.entityType = entityType;
    }
  
    getDetachId(): string {
      return this.detachId;
    }
  
    setDetachId(detachId: string): void {
      this.detachId = detachId;
    }
  
    getEntityType(): string {
      return this.entityType;
    }
  
    setEntityType(entityType: string): void {
      this.entityType = entityType;
    }
  
    getGrabId(): string {
      return this.getId();
    }
  }