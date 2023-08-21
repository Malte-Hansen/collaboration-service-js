import { GrabbableObjectModel } from "src/model/grabbable-object-model";

export class GrabModifier {
    private grabbableObjects: Map<string, GrabbableObjectModel> = new Map();
    private grabbedObjectToUser: Map<string, string> = new Map();
    private userToGrabbedObjects: Map<string, string[]> = new Map();

    // TODO acquire lock via pubsub
  
    addGrabbableObject(object: GrabbableObjectModel): void {
      this.grabbableObjects.set(object.getGrabId(), object);
    }
  
    removeGrabbableObject(object: GrabbableObjectModel): void {
      this.grabbableObjects.delete(object.getGrabId());
    }
  
    grabObject(userId: string, objectId: string): boolean {
      if (!this.isGrabbed(objectId)) {
        this.grabbedObjectToUser.set(objectId, userId);
        this.getGrabbedObjectsByUser(userId).push(objectId);
        return true;
      }
      return false;
    }
  
    moveObject(userId: string, objectId: string, position: number[], quaternion: number[], scale: number[]): boolean {
      if (this.isGrabbedByUser(objectId, userId)) {
        const object: GrabbableObjectModel | undefined = this.grabbableObjects.get(objectId);
        if (object) {
          object.setPosition(position);
          object.setQuaternion(quaternion);
          object.setScale(scale);
          return true;
        }
      }
      return false;
    }
  
    releaseObject(userId: string, objectId: string): void {
      if (this.isGrabbedByUser(objectId, userId)) {
        const grabbedObjects: string[] = this.getGrabbedObjectsByUser(userId);
        const index = grabbedObjects.indexOf(objectId);
        if (index !== -1) {
          grabbedObjects.splice(index, 1);
        }
        this.grabbedObjectToUser.delete(objectId);
      }
    }
  
    isGrabbedByUser(objectId: string, userId: string): boolean {
      if (!userId) {
        return false;
      }
      return userId === this.grabbedObjectToUser.get(objectId);
    }
  
    isGrabbed(objectId: string): boolean {
      return this.grabbedObjectToUser.has(objectId);
    }
  
    releaseAllGrabbedObjectsByUser(userId: string): void {
      const grabbedObjects: string[] | undefined = this.userToGrabbedObjects.get(userId);
      if (grabbedObjects) {
        for (const objectId of grabbedObjects) {
          this.grabbedObjectToUser.delete(objectId);
        }
        this.userToGrabbedObjects.delete(userId);
      }
    }
  
    private getGrabbedObjectsByUser(userId: string): string[] {
      let objects: string[] | undefined = this.userToGrabbedObjects.get(userId);
      if (!objects) {
        objects = [];
        this.userToGrabbedObjects.set(userId, objects);
      }
      return objects;
    }
  }