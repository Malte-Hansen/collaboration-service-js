import { Body, Controller, Get, Param, Post, HttpStatus, HttpException } from '@nestjs/common';
import { RoomService } from './room/room.service';
import { TicketService } from './ticket/ticket.service';
import { RoomListRecord } from './payload/sendable/room-list';
import { Room } from './model/room-model';
import { InitialRoomPayload, Landscape } from './payload/receivable/initial-room';
import { RoomCreatedResponse } from './payload/sendable/room-created';
import { JoinLobbyPayload } from './payload/receivable/join-lobby';
import { LobbyJoinedResponse } from './payload/sendable/lobby-joined';
import { IdGenerationService } from './id-generation/id-generation.service';
import { PublishedDetachedMenu, PublishedLandscape } from './message/pubsub/create-room-message';
import { PublisherService } from './publisher/publisher.service';

@Controller()
export class AppController {
  constructor(private readonly roomService: RoomService, private readonly ticketService: TicketService,
    private readonly publisherService: PublisherService, private readonly idGenerationService: IdGenerationService) { }

  /**
   * Gets the IDs of all local rooms.
   */
  @Get("/rooms")
  listRooms(): RoomListRecord[] {
    const roomListRecords: RoomListRecord[] = this.roomService.getRooms().map((room: Room) => ({
      roomId: room.getRoomId(),
      roomName: room.getName(),
      landscapeToken: room.getLandscapeModifier().getLandscape().getLandscapeToken(),
      size: room.getUserModifier().getUsers().length
    }));

    return roomListRecords;
  }

  /**
   * Creates a new room with the given initial landscape, applications and detached menus. 
   * The room is avalailable at all replicas.
   *
   * @param body The initial room layout.
   * @return The ID of the newly created room.
   */
  @Post("/room")
  async addRoom(@Body() body: InitialRoomPayload): Promise<RoomCreatedResponse> {

    const roomId = await this.idGenerationService.nextId();
    const landscapeId = await this.idGenerationService.nextId();

    var detachedMenus: PublishedDetachedMenu[] = [];
    for (var detachMenu of body.detachedMenus) {
      var id = await this.idGenerationService.nextId();
      detachedMenus.push({
        id: id,
        menu: detachMenu
      });
    }

    var landscape: PublishedLandscape = {
      id: landscapeId,
      landscape: body.landscape
    }
    
    this.publisherService.publishCreateRoomEvent({
      roomId,
      initialRoom: {
        landscape: landscape,
        openApps: body.openApps,
        detachedMenus: detachedMenus
      }
    });

    const roomCreatedResponse: RoomCreatedResponse = { roomId: roomId };

    return roomCreatedResponse;
  }

  /**
   * Adds a user to the lobby of the room with the given ID.
   *
   * @param roomId The ID of the room whose lobby to add the new user to.
   * @return A ticket ID that can be used to establish a websocket connection with any replica.
   */
  @Post("/room/:roomId/lobby")
  async joinLobby(@Param('roomId') roomId: string, @Body() body: JoinLobbyPayload): Promise<LobbyJoinedResponse> {
    
    if (!this.roomService.lookupRoom(roomId)) {
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    const ticket = await this.ticketService.drawTicket(roomId);

    const lobbyJoinedResponse: LobbyJoinedResponse =
      { ticketId: ticket.ticketId, validUntil: ticket.validUntil };

    return lobbyJoinedResponse;
  }
}
