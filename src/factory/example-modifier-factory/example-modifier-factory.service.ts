import { Injectable } from '@nestjs/common';
import { ExampleModifier } from 'src/modifier/example-modifier';

@Injectable()
export class ExampleModifierFactoryService {

    makeExampleModifier(): ExampleModifier {
        return new ExampleModifier();
    }
}
