import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { RoomService } from './room/room.service';
import { TicketService } from './ticket/ticket.service';
import { RoomListRecord } from './payload/sendable/room-list';
import { Room } from './model/room-model';
import { InitialRoomPayload } from './payload/receivable/initial-room';
import { RoomCreatedResponse } from './payload/sendable/room-created';
import { JoinLobbyPayload } from './payload/receivable/join-lobby';
import { LobbyJoinedResponse } from './payload/sendable/lobby-joined';
import { PubsubService } from './pubsub/pubsub.service';
import { IdGenerationService } from './id-generation/id-generation.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly roomService: RoomService, private readonly ticketService: TicketService,
    private readonly pubsubService: PubsubService, private readonly idGenerationService: IdGenerationService) {}

  /**
   * Gets the IDs of all rooms.
   */
  @Get("/rooms")
  listRooms(): RoomListRecord[] {
    const roomListRecords: RoomListRecord[] = this.roomService.getRooms().map((room: Room) => ({
      roomId: room.getRoomId(),
      roomName: room.getName(),
    }));

    return roomListRecords;
  }

  /**
   * Creates a new room with the given initial landscape, applications and detached menus.
   *
   * @param body The initial room layout.
   * @return The ID of the newly created room.
   */
  @Post("/room")
  async addRoom(@Body() body: InitialRoomPayload): Promise<RoomCreatedResponse> {

    const roomId = await this.idGenerationService.nextId();
    
    //const room = this.roomService.createRoom();

    //room.getExampleModifier().updateExample(body.example.value);

    this.pubsubService.publishCreateRoom({
      roomId: roomId,
      initialRoom: body
    });

    const roomCreatedResponse: RoomCreatedResponse = {roomId: roomId};

    return roomCreatedResponse;
  }

  /**
   * Adds a user to the lobby of the room with the given ID.
   *
   * @param roomId The ID of the room whose lobby to add the new user to.
   * @return A ticket ID that can be used to establish a websocket connection.
   */
  @Post("/room/:roomId/lobby")
  async joinLobby(@Param('roomId') roomId: string, @Body() body: JoinLobbyPayload): Promise<LobbyJoinedResponse> {
    const room = this.roomService.lookupRoom(roomId);

    // Initialize user model.
    //const userModel = room.getUserModifier().makeUserModel(body.userName);
    // TODO set missing properties

    const userId = await this.idGenerationService.nextId();


    const ticket = this.ticketService.drawTicket(roomId, userId);

    // Add ticket
    this.pubsubService.publishRegisterTicket({
      ticketId: ticket.getTicketId(),
      roomId: ticket.getRoomId(),
      userId: userId,
      validUntil: ticket.getValidUntil().getTime()
    });
    
    const lobbyJoinedResponse: LobbyJoinedResponse = 
      { ticketId: ticket.getTicketId(), validUntil: ticket.getValidUntil().getTime()};
    
      return lobbyJoinedResponse;
  }
}
