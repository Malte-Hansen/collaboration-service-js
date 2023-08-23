export type MenuDetachedForwardMessage = {
    objectId: string,
    userId: string,
    entityType: string,
    detachId: string,
    position: number[],
    quaternion: number[],
    scale: number[]
}