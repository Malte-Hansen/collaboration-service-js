export class Example {
    
    private value: number;

    constructor() {
        this.value = 0;
    }

    getValue(): number {
        return this.value;
    }

    setValue(value: number): void {
        this.value = value;
    }
  }