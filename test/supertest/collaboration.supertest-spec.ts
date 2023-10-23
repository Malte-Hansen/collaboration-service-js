import * as request from 'supertest';
import { io, type Socket } from 'socket.io-client';
import { MENU_DETACHED_EVENT } from 'src/message/client/receivable/menu-detached-message';
import { DETACHED_MENU_CLOSED_EVENT } from 'src/message/client/receivable/detached-menu-closed-message';
import { OBJECT_GRABBED_RESPONSE_EVENT } from 'src/message/client/sendable/object-grabbed-response';
import { TIMESTAMP_UPDATE_TIMER_EVENT } from 'src/message/client/sendable/timestamp-update-timer-message';
import { INITIAL_LANDSCAPE_EVENT } from 'src/message/client/sendable/initial-landscape-message';
import { RoomListRecord } from 'src/payload/sendable/room-list';
import { APP_CLOSED_EVENT } from 'src/message/client/receivable/app-closed-message';
import { APP_OPENED_EVENT } from 'src/message/client/receivable/app-opened-message';
import { COMPONENT_UPDATE_EVENT } from 'src/message/client/receivable/component-update-message';
import { HEATMAP_UPDATE_EVENT } from 'src/message/client/receivable/heatmap-update-message';
import { HIGHLIGHTING_UPDATE_EVENT } from 'src/message/client/receivable/highlighting-update-message';
import { MOUSE_PING_UPDATE_EVENT } from 'src/message/client/receivable/mouse-ping-update-message';
import { OBJECT_GRABBED_EVENT } from 'src/message/client/receivable/object-grabbed-message';
import { OBJECT_MOVED_EVENT } from 'src/message/client/receivable/object-moved-message';
import { OBJECT_RELEASED_EVENT } from 'src/message/client/receivable/object-released-message';
import { PING_UPDATE_EVENT } from 'src/message/client/receivable/ping-update-message';
import { SPECTATING_UPDATE_EVENT } from 'src/message/client/receivable/spectating-update-message';
import { TIMESTAMP_UPDATE_EVENT } from 'src/message/client/receivable/timestamp-update-message';
import { USER_POSITIONS_EVENT } from 'src/message/client/receivable/user-positions-message';
import { MENU_DETACHED_RESPONSE_EVENT } from 'src/message/client/sendable/menu-detached-response';
import { OBJECT_CLOSED_RESPONSE_EVENT } from 'src/message/client/sendable/object-closed-response';
import { SELF_CONNECTED_EVENT } from 'src/message/client/sendable/self-connected-message';

// Firstly, start the app via 'npm run start'. Then, execute the tests via 'npm run test:supertest'.

// config
const host = process.env.NEST_HOST || 'localhost';
const port = process.env.NEST_PORT || '4444';
const baseURL = 'http://' + host + ':' + port;

// util
type CollaborationClient = {
  id: string;
  socket: Socket;
};

async function getRooms(): Promise<RoomListRecord[]> {
  const response = await request(baseURL).get('/rooms');
  return response.body;
}

async function createRoom(): Promise<string> {
  const payload = require('./../../test-payload/initial-room.json');
  const response = await request(baseURL).post('/room').send(payload);
  return response.body.roomId;
}

async function createClient(roomId: string): Promise<CollaborationClient> {
  const payload = require('./../../test-payload/join-lobby.json');
  const response = await request(baseURL)
    .post('/room/' + roomId + '/lobby')
    .send(payload);
  var socket = io(baseURL, {
    transports: ['websocket'],
    query: {
      ticketId: response.body.ticketId,
      userName: 'JOHNNY',
      mode: 'vr',
    },
  });
  var id: string;
  socket.on(SELF_CONNECTED_EVENT, (msg) => {
    id = msg.self.id;
  });
  await sleep(500);
  return { id, socket };
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// test
describe('room', () => {
  it('create room', async () => {
    const payload = require('./../../test-payload/initial-room.json');

    // create room
    const roomId = await createRoom();

    await sleep(500);

    // fetch rooms
    const rooms = await getRooms();

    // room was correctly created
    expect(rooms).toContainEqual({
      roomId: roomId,
      roomName: 'Room ' + roomId,
      landscapeToken: payload.landscape.landscapeToken,
      size: 0,
    });
  });

  it('delete room which was left by all clients', async () => {
    // fetch initial rooms
    const initialRooms = await getRooms();

    // create room
    const roomId = await createRoom();

    await sleep(500);

    // client joins
    const client = await createClient(roomId);

    // client leaves
    client.socket.disconnect();

    await sleep(500);

    // fetch room again
    const updatedRooms = await getRooms();

    // empty room was deleted
    expect(initialRooms).toStrictEqual(updatedRooms);
  });

  it('joining clients receive landscape', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const createRoomPayload = require('./../../test-payload/initial-room.json');
      const joinLobbyPayload = require('./../../test-payload/join-lobby.json');

      // create room
      const roomId = await createRoom();

      await sleep(500);

      // client joins
      const response = await request(baseURL)
        .post('/room/' + roomId + '/lobby')
        .send(joinLobbyPayload);
      var socket = io(baseURL, {
        transports: ['websocket'],
        query: {
          ticketId: response.body.ticketId,
          userName: 'JOHNNY',
          mode: 'vr',
        },
      });

      socket.on(INITIAL_LANDSCAPE_EVENT, (msg) => {
        // correct landscape was received
        expect(msg.landscape).toStrictEqual(createRoomPayload.landscape);
        socket.disconnect();
        resolve();
      });

      // timeout
      await sleep(500);
      socket.disconnect();
      reject(new Error('No message received'));
    });
  });
});

describe('collaboration', () => {
  // re-created for each test
  var client1: CollaborationClient;
  var client2: CollaborationClient;

  beforeEach(async () => {
    const roomId = await createRoom();
    await sleep(500);
    client1 = await createClient(roomId);
    client2 = await createClient(roomId);
  });

  afterEach(() => {
    client1.socket.disconnect();
    client2.socket.disconnect();
  });

  it('highlight component', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/highlighting-update.json');

      client2.socket.on(HIGHLIGHTING_UPDATE_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // highlight component
      client1.socket.emit(HIGHLIGHTING_UPDATE_EVENT, message);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('open component', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/component-update-open.json');

      client2.socket.on(COMPONENT_UPDATE_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // open component
      client1.socket.emit(COMPONENT_UPDATE_EVENT, message);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('mouse ping', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/mouse-ping-update.json');

      client2.socket.on(MOUSE_PING_UPDATE_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // mouse ping
      client1.socket.emit(MOUSE_PING_UPDATE_EVENT, message);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('update spectating', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/spectating-update.json');
      message.userId = client1.id;
      message.spectatedUser = client2.id;

      client2.socket.on(SPECTATING_UPDATE_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // update spectating
      client1.socket.emit(SPECTATING_UPDATE_EVENT, message);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('update heatmap', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/heatmap-update.json');

      client2.socket.on(HEATMAP_UPDATE_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // update heatmap
      client1.socket.emit(HEATMAP_UPDATE_EVENT, message);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('controller ping', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/ping-update.json');

      client2.socket.on(PING_UPDATE_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // ping
      client1.socket.emit(PING_UPDATE_EVENT, message);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('open app', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/app-opened.json');

      client2.socket.on(APP_OPENED_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // open app
      client1.socket.emit(APP_OPENED_EVENT, message);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('close component', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/component-update-close.json');

      client2.socket.on(COMPONENT_UPDATE_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // close component
      client1.socket.emit(COMPONENT_UPDATE_EVENT, message);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('update timestamp', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/timestamp-update.json');

      client2.socket.on(TIMESTAMP_UPDATE_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // update timestamp
      client1.socket.emit(TIMESTAMP_UPDATE_EVENT, message);

      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('detach menu', async () => {
    const message = require('./../../test-payload/menu-detached.json');

    var forwardedObjectId: string;
    client2.socket.on(MENU_DETACHED_EVENT, (msg) => {
      // forwarded attributes are correct
      expect(msg.userId).toStrictEqual(client1.id);
      expect(msg.detachId).toStrictEqual(message.detachId);
      expect(msg.entityType).toStrictEqual(message.entityType);
      expect(msg.position).toStrictEqual(message.position);
      expect(msg.quaternion).toStrictEqual(message.quaternion);
      expect(msg.scale).toStrictEqual(message.scale);
      forwardedObjectId = msg.objectId;
    });

    var respondedObjectId: string;
    client1.socket.on(MENU_DETACHED_RESPONSE_EVENT, (msg) => {
      // nonce is correct
      expect(msg.nonce).toStrictEqual(message.nonce);
      respondedObjectId = msg.response.objectId;
    });

    // detach menu
    client1.socket.emit(MENU_DETACHED_EVENT, message);

    await sleep(500);

    // object id is equal for both clients
    expect(forwardedObjectId).toBeDefined();
    expect(respondedObjectId).toBeDefined();
    expect(forwardedObjectId).toStrictEqual(respondedObjectId);
  });

  it('close detached menu', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const openMessage = require('./../../test-payload/menu-detached.json');
      const closeMessage = require('./../../test-payload/detached-menu-closed.json');

      var menuId: string;
      client1.socket.on(MENU_DETACHED_RESPONSE_EVENT, (msg) => {
        // nonce is correct
        expect(msg.nonce).toStrictEqual(openMessage.nonce);
        menuId = msg.response.objectId;
      });
      client1.socket.on(OBJECT_CLOSED_RESPONSE_EVENT, (msg) => {
        // nonce is correct
        expect(msg.nonce).toStrictEqual(closeMessage.nonce);
        // closing was successful
        expect(msg.response.isSuccess).toStrictEqual(true);
        resolve();
      });

      // detach menu
      client1.socket.emit(MENU_DETACHED_EVENT, openMessage);

      await sleep(500);

      // response including menu id were received
      expect(menuId).toBeDefined;
      closeMessage.menuId = menuId;

      // close menu
      client1.socket.emit(DETACHED_MENU_CLOSED_EVENT, closeMessage);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('update user position', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const message = require('./../../test-payload/user-positions.json');

      client2.socket.on(USER_POSITIONS_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: message,
        });
        resolve();
      });

      // update user position
      client1.socket.emit(USER_POSITIONS_EVENT, message);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('move object', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const grabMessage = require('./../../test-payload/object-grabbed.json');
      const moveMessage = require('./../../test-payload/object-moved.json');

      var isSuccess: boolean;
      client1.socket.on(OBJECT_GRABBED_RESPONSE_EVENT, (msg) => {
        // nonce is correct
        expect(msg.nonce).toStrictEqual(grabMessage.nonce);
        isSuccess = msg.response.isSuccess;
      });
      client2.socket.on(OBJECT_MOVED_EVENT, (msg) => {
        // forwarded message is correct
        expect(msg).toStrictEqual({
          userId: client1.id,
          originalMessage: moveMessage,
        });
        resolve();
      });

      // grab object
      client1.socket.emit(OBJECT_GRABBED_EVENT, grabMessage);

      await sleep(500);

      // grabbing was successful
      expect(isSuccess).toStrictEqual(true);

      // move object
      client1.socket.emit(OBJECT_MOVED_EVENT, moveMessage);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('object can be grabbed by one user only', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const grabMessage = require('./../../test-payload/object-grabbed.json');

      var isSuccess: boolean;
      client1.socket.on(OBJECT_GRABBED_RESPONSE_EVENT, (msg) => {
        isSuccess = msg.response.isSuccess;
      });
      client2.socket.on(OBJECT_GRABBED_RESPONSE_EVENT, (msg) => {
        // grabbding was unsuccessful
        expect(msg.response.isSuccess).toStrictEqual(false);
        resolve();
      });

      // client1 grabs object
      client1.socket.emit(OBJECT_GRABBED_EVENT, grabMessage);

      await sleep(500);

      // grabbing was successful
      expect(isSuccess).toStrictEqual(true);

      // client2 grabs object
      client2.socket.emit(OBJECT_GRABBED_EVENT, grabMessage);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('grabbed object cannot be closed', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const grabMessage = require('./../../test-payload/object-grabbed.json');
      const closeMessage = require('./../../test-payload/app-closed.json');

      var isSuccess: boolean;
      client1.socket.on(OBJECT_GRABBED_RESPONSE_EVENT, (msg) => {
        isSuccess = msg.response.isSuccess;
      });
      client2.socket.on(OBJECT_CLOSED_RESPONSE_EVENT, (msg) => {
        // closing was unsuccessful
        expect(msg.response.isSuccess).toStrictEqual(false);
        resolve();
      });

      // client1 grabs object
      client1.socket.emit(OBJECT_GRABBED_EVENT, grabMessage);

      await sleep(500);

      // grabbing was successful
      expect(isSuccess).toStrictEqual(true);

      // client2 closes object
      client2.socket.emit(APP_CLOSED_EVENT, closeMessage);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('released object can be grabbed again', async () => {
    return new Promise<void>(async (resolve, reject) => {
      const grabMessage = require('./../../test-payload/object-grabbed.json');
      const releaseMessage = require('./../../test-payload/object-released.json');

      // grab object
      client1.socket.emit(OBJECT_GRABBED_EVENT, grabMessage);

      await sleep(500);

      // release object
      client1.socket.emit(OBJECT_RELEASED_EVENT, releaseMessage);

      await sleep(500);

      client1.socket.on(OBJECT_GRABBED_RESPONSE_EVENT, (msg) => {
        // grabbing released object was successfull
        expect(msg.response.isSuccess).toStrictEqual(true);
        resolve();
      });

      // grab object again
      client1.socket.emit(OBJECT_GRABBED_EVENT, grabMessage);

      // timeout
      await sleep(500);
      reject(new Error('No message received'));
    });
  });

  it('receive regular timestamp', async () => {
    return new Promise<void>(async (resolve, reject) => {
      client1.socket.on(TIMESTAMP_UPDATE_TIMER_EVENT, () => {
        // timestamp received
        resolve();
      });

      // timeout
      await sleep(12000);
      reject(new Error('No message received'));
    });
  }, 20000);
});
