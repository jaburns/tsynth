import { BaseNode, Knob } from "./baseNode";

export class AddFilter extends BaseNode<{}> {
    constructor() {
        super(0, 1, Infinity, {});
    }

    update() {}

    tick() {
        const x = this.inputBuffers[0];
        const y = this.outputBuffers[0];

        for (let i = 0; i < y.length; ++i) {
            y[i] = x[i];
        }

        for (let j = 1; j < this.inputBuffers.length; ++j) {
            const x = this.inputBuffers[j];
            for (let i = 0; i < y.length; ++i) {
                y[i] += x[i];
            }
        }
    }
}
