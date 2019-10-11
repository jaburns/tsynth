import { BaseNode, Knob } from "./baseNode";

type Knobs = {
    frequency: Knob,
};

export class SawSource extends BaseNode<Knobs> {
    private t: number = 0;
    private omega: number = 1;

    constructor(sampleRate: number) {
        super(sampleRate, 0, 0, {
            frequency: {lower: 20, upper: 20000, logarithmic: true, value: 440},
        });
    }

    update() {
        const newOmega = this.knobs.frequency.value / this.sampleRate;
        this.t *= this.omega / newOmega;
        this.omega = newOmega;
    }

    tick() {
        const y = this.outputBuffers[0];

        for (let i = 0; i < y.length; ++i) {
            const omegaT = this.omega * this.t++;
            const t1 = omegaT - Math.floor(omegaT);

            y[i] = 1 - t1 - t1;
        }
    }
}
