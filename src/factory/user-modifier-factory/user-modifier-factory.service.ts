import { Injectable } from '@nestjs/common';
import { ColorService } from 'src/color/color.service';
import { UserModifier } from 'src/modifier/user-modifier';

@Injectable()
export class UserModifierFactoryService {

    constructor(private readonly colorService: ColorService ) {}

    makeUserModifier(): UserModifier {
        return new UserModifier(this.colorService);
    }
}
