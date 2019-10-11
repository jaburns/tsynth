import { BaseNode, Knob } from "./baseNode";

type Knobs = {
    gain: Knob,
};

export class GainFilter extends BaseNode<Knobs> {
    constructor() {
        super(0, 1, 1, {
            gain: {lower: -2, upper: 2, logarithmic: false, value: 1},
        });
    }

    update() {}

    tick() {
        const x = this.inputBuffers[0];
        const y = this.outputBuffers[0];
        const gain = this.knobs.gain.value;

        for (let i = 0; i < y.length; ++i) {
            y[i] = gain * x[i];
        }
    }
}
