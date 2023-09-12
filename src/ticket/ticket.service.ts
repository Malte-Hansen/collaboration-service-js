import { Injectable } from '@nestjs/common';
import { IdGenerationService } from 'src/id-generation/id-generation.service';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { RoomService } from 'src/room/room.service';
import { Ticket } from 'src/util/ticket';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from 'ioredis';

/**
 * A service that manages drawn tickets that have not yet been used to establish the websocket
 * connection to join a room.
 *
 * When a user wants to join a room, they first draw a ticket and then use that ticket to establish
 * a websocket connection.
 */
@Injectable()
export class TicketService {

    private readonly redis: Redis;

    constructor(private readonly redisService: RedisService, private readonly roomService: RoomService,
        private readonly idGenerationService: IdGenerationService) {
        this.redis = this.redisService.getClient().duplicate();
    }

    /**
     * Time for how long a ticket is valid.
     *
     * When the user draws a ticket, they have to establish the websocket connection within this
     * period.
     */
    private readonly TICKET_EXPIRY_PERIOD_IN_SECONDS = 30;


    async drawTicket(roomId: string): Promise<Ticket> {
        const ticketId = uuidv4();
        const userId = await this.idGenerationService.nextId();
        var validUntil = new Date();
        validUntil.setSeconds(validUntil.getSeconds() + this.TICKET_EXPIRY_PERIOD_IN_SECONDS);
        const ticket: Ticket = { ticketId, roomId, userId, validUntil: validUntil.getTime() }
        this.storeTicket(ticket);
        return ticket;
    }

    async redeemTicket(ticketId: string): Promise<Ticket> {

        const ticket = await this.getTicket(ticketId);

        if (!ticket) {
            throw new Error("Ticket with id " + ticketId + " does not exist")
        }

        // Ensure that the room still exists.
        const roomId = ticket.roomId;
        if (!this.roomService.roomExists(roomId)) {
            throw new Error("Room " + roomId + " for ticket " + ticket.ticketId + " has been closed");
        }

        // Test whether the ticket is still valid.
        const expiryDate = ticket.validUntil;
        if (new Date().getTime() > expiryDate) {

            throw new Error("Ticket " + ticket.ticketId + " expired at " + new Date(expiryDate).toDateString())
        }

        return ticket;
    }

    private getTicketKey(ticketId: string): string {
        return 'ticket-' + ticketId;
    }

    private async storeTicket(ticket: Ticket): Promise<void> {
        await this.redis.set(this.getTicketKey(ticket.ticketId), JSON.stringify(ticket));
    }

    private async getTicket(ticketId: string): Promise<Ticket | null> {
        const ticket = await this.redis.get(this.getTicketKey(ticketId));
        return ticket ? JSON.parse(ticket) : null;
    }
}
