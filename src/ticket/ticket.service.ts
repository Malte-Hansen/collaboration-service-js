import { Injectable } from '@nestjs/common';
import { IdGenerationService } from 'src/id-generation/id-generation.service';
import { Room } from 'src/model/room-model';
import { UserModel } from 'src/model/user-model';
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

    constructor(private readonly roomService: RoomService) {
        this.tickets = new Map();
    }

  /**
   * Time for how long a ticket is valid.
   *
   * When the user draws a ticket, they have to establish the websocket connection within this
   * period.
   */
    private readonly TICKET_EXPIRY_PERIOD_IN_SECONDS = 30; 

  /**
   * The tickets that have not yet been redeemed.
   */
    private tickets: Map<string,Ticket>;

    registerTicket(ticket: Ticket) {
        this.tickets.set(ticket.getTicketId(), ticket);
    }

    unregisterTicket(ticketId: string) {
        this.tickets.delete(ticketId);
    }

    drawTicket(roomId: string, userId: string): Ticket {
        const ticketId = uuidv4();
        var validUntil = new Date();
        validUntil.setSeconds(validUntil.getSeconds() + this.TICKET_EXPIRY_PERIOD_IN_SECONDS);
        const ticket = new Ticket(ticketId, roomId, userId, validUntil);
        return ticket;
    }

    redeemTicket(ticketId: string): Ticket {
        // Ensure that the ticket exists.
        if (!this.tickets.has(ticketId)) {
            throw new Error("Invalid ticket: " + ticketId);
        }

        // Get and remove the ticket.
        const ticket = this.tickets.get(ticketId);
        //this.tickets.delete(ticketId);

        // Ensure that the room still exists.
        const roomId = ticket.getRoomId();
        if (!this.roomService.roomExists(roomId)) {
            throw new Error("Room " + roomId + " for ticket " + ticketId + " has been closed");
        }

        // Test whether the ticket is still valid.
        const expiryDate = ticket.getValidUntil();
        if (new Date() > expiryDate) {

            throw new Error("Ticket " + ticketId + " expired at " + expiryDate.toDateString())
        }

        return ticket;
    }
}
