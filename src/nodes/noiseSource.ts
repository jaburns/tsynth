import { BaseNode } from "./baseNode";

export class NoiseSource extends BaseNode<{}> {
    constructor() {
        super(0, 0, 0, {});
    }

    update() { }

    tick() {
        const y = this.outputBuffers[0];

        for (let i = 0; i < y.length; ++i) 
            y[i] = Math.random() * 2 - 1;
    }
}
