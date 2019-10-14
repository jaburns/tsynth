import { UpdateFunc, NodeDef } from "newNodes";

export const AdderDef : NodeDef = {
    descriptor: ({
        inputSignals: ['a', 'b'],
        outputSignals: ['output'],
        knobs: [],
    }),

    construct: (sampleRate: number, knobValues: number[]): UpdateFunc =>
        (xs: Float32Array[], ys: Float32Array[]) => {
            const x0 = xs[0];
            const x1 = xs[1];
            const y = ys[0];

            for (let i = 0; i < y.length; ++i) {
                y[i] = x0[i] + x1[i];
            }
        },
};
