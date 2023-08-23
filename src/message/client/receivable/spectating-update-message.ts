export const SPECTATING_UPDATE_EVENT = 'spectating_update';


export type SpectatingUpdateMessage = {
    userId: string,
    spectating: boolean,
    spectatedUser: string
};