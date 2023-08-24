export const OBJECT_MOVED_EVENT = 'object_moved';

export type ObjectMovedMessage = {
    objectId: string,
    position: number[],
    quaternion: number[],
    scale: number[]
};