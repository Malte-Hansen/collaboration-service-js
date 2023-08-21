import { Color } from "src/util/color";

export class ColorModifier {

    private colors: Map<number,Color>;

    private counters: Map<number, number>;

    constructor() {
        this.colors = new Map();
        this.colors.set(0, {colorId: 0, red: 255, green: 0, blue: 0}); // red
        this.colors.set(1, {colorId: 1, red: 0, green: 167, blue: 250}); // blue
        this.colors.set(2, {colorId: 2, red: 209, green: 0, blue: 209}); // pink
        this.colors.set(3, {colorId: 3, red: 0, green: 209, blue: 188}); // turquoise
        this.colors.set(4, {colorId: 4, red: 219, green: 208, blue: 0}); // yellow
        this.colors.set(5, {colorId: 5, red: 189, green: 126, blue: 217}); // purple
        this.colors.set(6, {colorId: 6, red: 0, green: 175, blue: 206}); // ocean blue
        this.colors.set(7, {colorId: 7, red: 241, green: 141, blue: 0}); // orange

        this.counters = new Map();
        for (var i = 0; i < this.colors.size; i++) {
            this.counters.set(i, 0);
        }
    }

    nextColorId(): number {
        var minCount = Number.MAX_VALUE;
        var minCountColorId = null;
        for (var [colorId, count] of this.counters.entries()) {
            if (count < minCount) {
                minCount = count;
                minCountColorId = colorId;
            }
        }
        return minCountColorId;
    }

    assignColor(colorId: number): Color {
        const count = this.counters.get(colorId);
        this.counters.set(colorId, count + 1);
        return this.colors.get(colorId);
    }

    unassignColor(colorId: number): void {
        var count = this.counters.get(colorId);
        this.counters.set(colorId, count - 1);
    }

}