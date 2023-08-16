import { Injectable } from '@nestjs/common';

@Injectable()
export class IdGenerationService {

    private id: number;

    constructor() {
        this.id = 0;
    }

    nextId(): string {
        this.id++;
        return this.id.toString();
    }
}
