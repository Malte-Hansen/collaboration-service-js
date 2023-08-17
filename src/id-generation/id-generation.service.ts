import { Injectable } from '@nestjs/common';
import { PubsubService } from 'src/pubsub/pubsub.service';

@Injectable()
export class IdGenerationService {

    constructor(private readonly pubsubService: PubsubService) {}

    async nextId(): Promise<string> {
        return (await this.pubsubService.getUniqueId()).toString();
    }
}
