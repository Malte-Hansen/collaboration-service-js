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
  
    /**
     * The room that this ticket allows a user to join.
     */
    private readonly room: Room;
  
    /**
     * The user that will join the room when this ticket is redeemed.
     */
    private readonly user: UserModel;
  
    /**
     * The time until this ticket is valid.
     */
    private readonly validUntil: Date;
  
    constructor(ticketId: string, room: Room, user: UserModel, validUntil: Date) {
      this.ticketId = ticketId;
      this.room = room;
      this.user = user;
      this.validUntil = validUntil;
    }
  
    getTicketId(): string {
      return this.ticketId;
    }

    getRoom(): Room {
      return this.room;
    }
  
    getUser(): UserModel {
      return this.user;
    }

    getValidUntil(): Date {
      return this.validUntil;
    }
  }