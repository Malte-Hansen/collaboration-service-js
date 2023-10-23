import { GrabbableObjectModel } from 'src/model/grabbable-object-model';

export class GrabModifier {
  private grabbableObjects: Map<string, GrabbableObjectModel> = new Map();

  addGrabbableObject(object: GrabbableObjectModel): void {
    this.grabbableObjects.set(object.getGrabId(), object);
  }

  removeGrabbableObject(object: GrabbableObjectModel): void {
    this.grabbableObjects.delete(object.getGrabId());
  }

  moveObject(
    objectId: string,
    position: number[],
    quaternion: number[],
    scale: number[],
  ): void {
    const object: GrabbableObjectModel | undefined =
      this.grabbableObjects.get(objectId);
    if (object) {
      object.setPosition(position);
      object.setQuaternion(quaternion);
      object.setScale(scale);
    }
  }

  getGrabbableObject(objectId: string): GrabbableObjectModel | null {
    return this.grabbableObjects.get(objectId);
  }
}
