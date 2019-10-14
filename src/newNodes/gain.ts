import { NodeDef, UpdateFunc } from "newNodes";

export const GainDef: NodeDef = {
    descriptor: ({
        inputSignals: ['input'],
        outputSignals: ['output'],
        knobs: [
            { label: 'gain', lower: -2, upper: 2, logarithmic: false, default: 1 }
        ],
    }),

    construct: (sampleRate: number, knobValues: number[]): UpdateFunc =>
        (xs: Float32Array[], ys: Float32Array[]) => {
            const x = xs[0];
            const y = ys[0];
            const gain = knobValues[0];

            for (let i = 0; i < y.length; ++i) {
                y[i] = gain * x[i];
            }
        },
};
