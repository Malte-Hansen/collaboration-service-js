import { Injectable } from '@nestjs/common';
import { Example } from './example.model';

@Injectable()
export class ExampleService {

    private example: Example;

    constructor() {
        this.example = new Example();
    }

    updateExample(value: number): void {
        this.example.setValue(value);
        console.log("Example was updatet to value ", value);
    }
}
