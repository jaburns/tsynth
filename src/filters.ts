type Knob = {
    readonly lower: number,
    readonly upper: number,
    readonly logarithmic: boolean,

    value: number,
};

abstract class BaseNode<K extends {[name: string]: Knob}> {
    readonly sampleRate: number;
    readonly knobs: K; 

    private _inputBuffers: Float32Array[];
    private _outputBuffers: Float32Array[];

    protected get inputBuffers()  { return this._inputBuffers;  }
    protected get outputBuffers() { return this._outputBuffers; }

    bindBuffers(input: Float32Array[], output: Float32Array[]) {
        this._inputBuffers = input;
        this._outputBuffers = output;

        this.update();
    }

    abstract update(): void;
    abstract tick(): void;

    protected constructor(sampleRate: number, knobs: K) {
        this.sampleRate = sampleRate;
        this.knobs = knobs;
    }
}

type SineKnobs = {
    frequency: Knob,
};

export class SineNode extends BaseNode<SineKnobs> {
    private t: number;
    private omega: number;

    constructor(sampleRate: number) {
        super(sampleRate, {
            frequency: {lower: 0, upper: 20000, logarithmic: true, value: 440},
        });
    }

    update() {
        this.t = 0;
        this.omega = 2 * Math.PI * this.knobs.frequency.value / this.sampleRate;
    }

    tick() {
        const y = this.outputBuffers[0];

        for (let i = 0; i < y.length; ++i) {
            y[i] = .1 * Math.sin(this.omega * this.t++);
        }
    }
}

export class NoiseNode extends BaseNode<{}> {
    constructor() {
        super(0, {});
    }

    update() { }

    tick() {
        const y = this.outputBuffers[0];

        for (let i = 0; i < y.length; ++i) 
            y[i] = Math.random() * 2 - 1;
    }
}

type LowPassFilterKnobs = {
    frequency: Knob,
    bandwidth: Knob,
};

export class LowPassFilterNode extends BaseNode<LowPassFilterKnobs> {
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
        super(sampleRate, {
            frequency: {lower: 0, upper: 20000, logarithmic: true,  value: 200},
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

export const copyBuffer = (from: Float32Array, to: Float32Array): void => {
    for (let i = 0; i < from.length && i < to.length; ++i)
        to[i] = from[i];
};