import { Injectable } from '@nestjs/common';
import { IdGenerationService } from 'src/id-generation/id-generation.service';
import { UserModifier } from 'src/modifier/user-modifier';

@Injectable()
export class UserModifierFactoryService {

    constructor(private readonly idGenerationService: IdGenerationService) {}

    makeUserModifier(): UserModifier {
        return new UserModifier(this.idGenerationService);
    }
}
