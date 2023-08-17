export const REGISTER_TICKET_CHANNEL = 'register-ticket';

export type RegisterTicketMessage = {
    ticketId: string
    roomId: string,
    userId: string,
    validUntil: number
}
