import { Injectable } from '@nestjs/common';
import { IdGenerationService } from 'src/id-generation/id-generation.service';
import { UserModifier } from 'src/modifier/user-modifier';

@Injectable()
export class UserModifierFactoryService {

    constructor() {}

    makeUserModifier(): UserModifier {
        return new UserModifier();
    }
}
