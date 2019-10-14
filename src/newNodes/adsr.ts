import { NodeDef, UpdateFunc } from "newNodes";

const JUMP_LERP_TIME = 0.003; // Seconds.
// TODO Assert bufferLength > JUMP_LERP_TIME * sampleRate

export const ADSRDef : NodeDef = {
    descriptor: ({
        inputSignals: ['sync', 'input'],
        outputSignals: ['output'],
        knobs: [
            { label: 'attack',  lower: 0, upper: 1, logarithmic: false, default: 0.03 },
            { label: 'decay',   lower: 0, upper: 1, logarithmic: false, default: 0.2  },
            { label: 'sustain', lower: 0, upper: 1, logarithmic: false, default: 0.5  },
            { label: 'release', lower: 0, upper: 1, logarithmic: false, default: 0.2  }
        ]
    }),

    construct: (sampleRate: number, knobValues: number[]): UpdateFunc => {
        const attack = knobValues[0];
        const decay = knobValues[1];
        const sustain = knobValues[2];
        const release = knobValues[3];

        let t: number = 0;
        let on: boolean = false;
        let releasing: boolean = false;
        let lastAmp: number = 0;

        return (xs: Float32Array[], ys: Float32Array[]) => {
            const clk = xs[0];
            const x = xs[1];
            const y = ys[0];

            let lerpStartAmp = 0;

            if (!on && clk[0] > .5) {
                lerpStartAmp = lastAmp;
                on = true;
                t = 0;
            }

            if (on && clk[0] < .5) {
                lerpStartAmp = lastAmp;
                on = false;
                releasing = true;
                t = 0;
            }

            let amp = 0;

            if (on) {
                for (let i = 0; i < y.length; ++i) {
                    const t1 = t++ / sampleRate;
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
            else if (releasing) {
                for (let i = 0; i < y.length; ++i) {
                    const t1 = t++ / sampleRate;
                    amp = 0;

                    if (t1 < release) {
                        amp = sustain * (1 - t1 / release);
                    }

                    if (t1 < JUMP_LERP_TIME) {
                        amp = lerpStartAmp + (amp - lerpStartAmp) * t1 / JUMP_LERP_TIME;
                    }

                    y[i] = x[i] * amp;
                }

                if (t / sampleRate > release) {
                    releasing = false;
                }
            }
            else {
                amp = 0;

                for (let i = 0; i < y.length; ++i) {
                    y[i] = 0;
                }
            }

            lastAmp = amp;
        };
    },
};
