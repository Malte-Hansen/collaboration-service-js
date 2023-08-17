import { Room } from "src/model/room-model";
import { UserModel } from "src/model/user-model";

/**
 * A ticket that allows a user to join a room.
 *
 * The Authentication header and additional information about the user that should join a room
 * cannot be passed via the WebSocket API. To enable authentication and to initialize the user's
 * model, the user has to draw a ticket via the REST API before establishing a WebSocket connection.
 */
export class Ticket {
    /**
     * An unpredictable identifier for this ticket.
     */
    private readonly ticketId: string;
  
    private readonly roomId: string;

    private readonly userId: string;
  
    /**
     * The time until this ticket is valid.
     */
    private readonly validUntil: Date;
  
    constructor(ticketId: string, roomId: string, userId: string, validUntil: Date) {
      this.ticketId = ticketId;
      this.roomId = roomId;
      this.validUntil = validUntil;
    }
  
    getTicketId(): string {
      return this.ticketId;
    }

    getRoomId(): string {
      return this.roomId;
    }

    getValidUntil(): Date {
      return this.validUntil;
    }

    getUserId(): string {
      return this.userId;
    }
  }