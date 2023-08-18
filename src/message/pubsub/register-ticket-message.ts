export const REGISTER_TICKET_EVENT = 'register-ticket';

export type RegisterTicketMessage = {
    ticketId: string
    roomId: string,
    userId: string,
    validUntil: number
}
