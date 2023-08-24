export const OBJECT_GRABBED_EVENT = "object_grabbed";

export type ObjectGrabbedMessage = {
    objectId: string,
    nonce: number
};