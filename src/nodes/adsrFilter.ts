import { BaseNode, Knob } from "./baseNode";

type Knobs = {
    attack: Knob,
    decay: Knob,
    sustain: Knob,
    release: Knob,
};

/*

An instrument consists of a master ADSR node, and is provided as inputs:
    on()
    off()
    `

type Instrument = {
    nodeGraph:
};

 */



export class ADSRFilter extends BaseNode<Knobs> {
    private t: number = 0;
    private on: boolean = false;
    private release: boolean = false;

    constructor(sampleRate: number) {
        super(sampleRate, 2, 2, {
            attack:  { lower: 0, upper: 1, logarithmic: false, value: 0.03 },
            decay:   { lower: 0, upper: 1, logarithmic: false, value: 0.2  },
            sustain: { lower: 0, upper: 1, logarithmic: false, value: 0.5  },
            release: { lower: 0, upper: 1, logarithmic: false, value: 0.2  },
        });
    }

    update() {}

    tick() {
        const clk = this.inputBuffers[0];
        const x = this.inputBuffers[1];
        const y = this.outputBuffers[0];

        if (!this.on && clk[0] > .5) {
            this.on = true;
            this.t = 0;
        }

        if (this.on && clk[0] < .5) {
            this.on = false;
            this.release = true;
            this.t = 0;
        }

        if (this.on) {
            const attack = this.knobs.attack.value;
            const decay = this.knobs.decay.value;
            const sustain = this.knobs.sustain.value;

            for (let i = 0; i < y.length; ++i) {
                const t1 = this.t++ / this.sampleRate;
                let amp = sustain;

                if (t1 < attack) {
                    amp = t1 / attack;
                }
                else if (t1 < attack + decay) {
                    amp = 1 + ((t1 - attack) / decay) * (sustain - 1);
                }

                y[i] = x[i] * amp;
            }
        }
        else if (this.release) {
            const sustain = this.knobs.sustain.value;
            const release = this.knobs.release.value;

            for (let i = 0; i < y.length; ++i) {
                const t1 = this.t++ / this.sampleRate;
                let amp = 0;

                if (t1 < release) {
                    amp = sustain * (1 - t1 / release);
                }

                y[i] = x[i] * amp;
            }

            if (this.t / this.sampleRate > release) {
                this.release = false;
            }
        }
        else {
            for (let i = 0; i < y.length; ++i) {
                y[i] = 0;
            }
        }
    }
}
