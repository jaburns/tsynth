import { NodeDef, UpdateFunc } from "newNodes";

export enum WaveShape {
    Noise = 0,
    Sine = 1,
    Square = 2,
    Saw = 3,
};

export const WaveformDef: NodeDef = {
    descriptor: ({
        inputSignals: ['sync', 'frequency'],
        outputSignals: ['output'],
        knobs: [
            { label: 'shape', lower: 0, upper: 3, integral: true, default: WaveShape.Sine },
        ]
    }),

    construct: (sampleRate: number, knobValues: number[]): UpdateFunc => {
        let t: number = 0;
        let omega: number = 0;
        let on: boolean = false;

        switch (knobValues[0]) {
            case WaveShape.Sine: return (xs: Float32Array[], ys: Float32Array[]) => {
                const f = xs[1];
                const y = ys[0];

                if (xs[0][0] > .5) {
                    if (!on) {
                        on = true;
                        t = 0;
                    }
                }
                else if (xs[0][0] < .5) {
                    on = false;
                }

                for (let i = 0; i < y.length; ++i) {
                    const newOmega = 2 * Math.PI * f[i] / sampleRate;
                    t *= omega / newOmega;
                    omega = newOmega;

                    y[i] = Math.sin(omega * t++);
                }
            };

            case WaveShape.Square: return (xs: Float32Array[], ys: Float32Array[]) => {
                const f = xs[1];
                const y = ys[0];

                if (xs[0][0] > .5) {
                    if (!on) {
                        on = true;
                        t = 0;
                    }
                }
                else if (xs[0][0] < .5) {
                    on = false;
                }

                for (let i = 0; i < y.length; ++i) {
                    const newOmega = f[i] / sampleRate;
                    t *= omega / newOmega;
                    omega = newOmega;

                    const omegaT = omega * t++;
                    const t1 = omegaT - Math.floor(omegaT);

                    y[i] = t1 < .5 ? 1 : -1;
                }
            };

            case WaveShape.Saw: return (xs: Float32Array[], ys: Float32Array[]) => {
                const f = xs[1];
                const y = ys[0];

                if (xs[0][0] > .5) {
                    if (!on) {
                        on = true;
                        t = 0;
                    }
                }
                else if (xs[0][0] < .5) {
                    on = false;
                }

                for (let i = 0; i < y.length; ++i) {
                    const newOmega = f[i] / sampleRate;
                    t *= omega / newOmega;
                    omega = newOmega;

                    const omegaT = this.omega * this.t++;
                    const t1 = omegaT - Math.floor(omegaT);

                    y[i] = 1 - t1 - t1;
                }
            };
        }

        // Noise
        return (xs: Float32Array[], ys: Float32Array[]) => {
            const y = ys[0];

            for (let i = 0; i < y.length; ++i) {
                y[i] = Math.random() * 2 - 1;
            }
        };
    },
};
