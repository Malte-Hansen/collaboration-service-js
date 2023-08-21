import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { IdGenerationService } from 'src/id-generation/id-generation.service';
import { PubsubService } from 'src/pubsub/pubsub.service';
import { RoomService } from 'src/room/room.service';
import { Ticket } from 'src/util/ticket';
import { v4 as uuidv4 } from 'uuid';

/**
 * A service that manages drawn tickets that have not yet been used to establish the websocket
 * connection to join a room.
 *
 * When a user wants to join a room, they first draw a ticket and then use that ticket to establish
 * a websocket connection.
 */
@Injectable()
export class TicketService {

    constructor(private readonly roomService: RoomService, 
        @Inject(forwardRef(() => PubsubService)) private readonly pubsubService: PubsubService, 
        private readonly idGenerationService: IdGenerationService) {}

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
        const ticket: Ticket = {ticketId, roomId, userId, validUntil: validUntil.getTime()}
        this.pubsubService.storeTicket(ticket);
        return ticket;
    }

    async redeemTicket(ticketId: string): Promise<Ticket> {

        const ticket = await this.pubsubService.getTicket(ticketId);

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
}
