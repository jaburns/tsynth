import { BaseNode, Knob } from "./baseNode";

const JUMP_LERP_TIME = 0.003; // Seconds.
// TODO Assert bufferLength > JUMP_LERP_TIME * sampleRate

type Knobs = {
    attack: Knob,
    decay: Knob,
    sustain: Knob,
    release: Knob,
};

export class ADSRFilter extends BaseNode<Knobs> {
    private t: number = 0;
    private on: boolean = false;
    private release: boolean = false;
    private lastAmp: number = 0;

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

        const attack = this.knobs.attack.value;
        const decay = this.knobs.decay.value;
        const sustain = this.knobs.sustain.value;
        const release = this.knobs.release.value;

        let lerpStartAmp = 0;

        if (!this.on && clk[0] > .5) {
            lerpStartAmp = this.lastAmp;
            this.on = true;
            this.t = 0;
        }

        if (this.on && clk[0] < .5) {
            lerpStartAmp = this.lastAmp;
            this.on = false;
            this.release = true;
            this.t = 0;
        }

        let amp = 0;

        if (this.on) {
            for (let i = 0; i < y.length; ++i) {
                const t1 = this.t++ / this.sampleRate;
                amp = sustain;

                if (t1 < attack) {
                    amp = t1 / attack;
                }
                else if (t1 < attack + decay) {
                    amp = 1 + ((t1 - attack) / decay) * (sustain - 1);
                }

                if (t1 < JUMP_LERP_TIME) {
                    amp = lerpStartAmp + (amp - lerpStartAmp) * t1 / JUMP_LERP_TIME;
                }

                y[i] = x[i] * amp;
            }
        }
        else if (this.release) {
            for (let i = 0; i < y.length; ++i) {
                const t1 = this.t++ / this.sampleRate;
                amp = 0;

                if (t1 < release) {
                    amp = sustain * (1 - t1 / release);
                }

                if (t1 < JUMP_LERP_TIME) {
                    amp = lerpStartAmp + (amp - lerpStartAmp) * t1 / JUMP_LERP_TIME;
                }

                y[i] = x[i] * amp;
            }

            if (this.t / this.sampleRate > release) {
                this.release = false;
            }
        }
        else {
            amp = 0;

            for (let i = 0; i < y.length; ++i) {
                y[i] = 0;
            }
        }

        this.lastAmp = amp;
    }
}
