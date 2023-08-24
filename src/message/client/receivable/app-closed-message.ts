export const APP_CLOSED_EVENT = 'app_closed';

export type AppClosedMessage = {
    appId: string,
    nonce: number
}