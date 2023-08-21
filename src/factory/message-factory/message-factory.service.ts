import { Injectable } from '@nestjs/common';
import { SelfConnectedMessage } from 'src/message/client/sendable/self-connected-message';
import { Room } from 'src/model/room-model';
import { UserModel } from 'src/model/user-model';
import { Controller } from 'src/util/controller';
import { User, OtherUser } from 'src/util/user';

@Injectable()
export class MessageFactoryService {

    makeSelfConnectedMessage(room: Room, userModel: UserModel): SelfConnectedMessage {
        const user: User = {
            id: userModel.getId(),
            name: userModel.getUserName(),
            color: userModel.getColor()
        };
        var otherUsers: OtherUser[] = [];
        for (var otherModel of room.getUserModifier().getUsers()) {
            if (otherModel.getId() == userModel.getId()) continue;
            const otherControllers: Controller[] = [];
            for (var controllerModel of otherModel.getControllers()) {
                if (controllerModel) {
                    const otherController: Controller = {
                        controllerId: controllerModel.getControllerId(),
                        assetUrl: controllerModel.getAssetUrl(),
                        position: controllerModel.getPosition(),
                        quaternion: controllerModel.getQuaternion(),
                        intersection: controllerModel.getIntersection()
                    }
                    otherControllers.push(otherController);
                }
            }
            const otherUser: OtherUser = {
                id: otherModel.getId(),
                name: otherModel.getUserName(),
                color: otherModel.getColor(),
                position: otherModel.getPosition(),
                quaternion: otherModel.getQuaternion(),
                controllers: otherControllers
            }
            otherUsers.push(otherUser);
        }
        const message: SelfConnectedMessage = {
            self: user,
            users: otherUsers
        }
        return message;
    }
}
