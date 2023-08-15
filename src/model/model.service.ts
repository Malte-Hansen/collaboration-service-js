import { Injectable } from '@nestjs/common';
import { ExampleService } from './example/example.service';
import { ExampleMessage } from 'src/message/example-message';

@Injectable()
export class ModelService {

    constructor(private exampleService: ExampleService) {}

    handleExampleMessage(message: ExampleMessage): void {
        this.exampleService.updateExample(message.value);
    }
}
