export const OBJECT_CLOSED_RESPONSE_EVENT = 'object_closed';

export type ObjectClosedResponse = {
    success: boolean;
    nonce: number
};