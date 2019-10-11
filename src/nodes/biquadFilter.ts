import { BaseNode, Knob } from "./baseNode";

type Knobs = {
    frequency: Knob,
    bandwidth: Knob,
};

export class LowPassFilter extends BaseNode<Knobs> {
    // https://github.com/wooters/miniDSP/blob/master/biquad.c

    private x1: number = 0;
    private x2: number = 0;
    private y1: number = 0;
    private y2: number = 0;

    private c0: number = 0;
    private c1: number = 0;
    private c2: number = 0;
    private c3: number = 0;
    private c4: number = 0;

    constructor(sampleRate: number) {
        super(sampleRate, 1, 1, {
            frequency: {lower: 1, upper: 20000, logarithmic: true,  value: 200},
            bandwidth: {lower: 0, upper: 10,    logarithmic: false, value: 1},
        });
    }

    update() {
        const omega = 2 * Math.PI * this.knobs.frequency.value / this.sampleRate;
        const sn = Math.sin(omega);
        const cs = Math.cos(omega);
        const alpha = sn * Math.sinh(Math.log(2)/2 * this.knobs.bandwidth.value * omega / sn);

        const b0 = (1 - cs) /2;
        const b1 = 1 - cs;
        const b2 = (1 - cs) /2;

        const a0 = 1 + alpha;
        const a1 = -2 * cs;
        const a2 = 1 - alpha;

        this.c0 = b0 / a0;
        this.c1 = b1 / a0;
        this.c2 = b2 / a0;
        this.c3 = a1 / a0;
        this.c4 = a2 / a0;
    }

    tick() {
        const x = this.inputBuffers[0];
        const y = this.outputBuffers[0];

        y[0] = this.c0*x[0] + this.c1*this.x1 + this.c2*this.x2 - this.c3*this.y1 - this.c4*this.y2;
        y[1] = this.c0*x[1] + this.c1*x[0]    + this.c2*this.x1 - this.c3*y[0]    - this.c4*this.y1;

        for (let i = 2; i < x.length; ++i)
            y[i] = this.c0*x[i] + this.c1*x[i-1] + this.c2*x[i-2] - this.c3*y[i-1] - this.c4*y[i-2];

        this.x1 = x[x.length - 1];
        this.x2 = x[x.length - 2];

        this.y1 = y[x.length - 1];
        this.y2 = y[x.length - 2];
    }
}
