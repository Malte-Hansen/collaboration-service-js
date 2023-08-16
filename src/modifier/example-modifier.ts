import { Example } from "src/model/example-model";

export class ExampleModifier {

    private example: Example;

    constructor() {
        this.example = new Example();
    }

    updateExample(value: number): void {
        this.example.setValue(value);
        console.log("Example was updatet to value ", value);
    }
}