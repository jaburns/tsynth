import { NodeDef, UpdateFunc } from "newNodes";

export const LPFDef: NodeDef = {
    descriptor: ({
        inputSignals: ['input'],
        outputSignals: ['output'],
        knobs: [
            {label: 'frequency', lower: 1, upper: 20000, logarithmic: true,  default: 200},
            {label: 'bandwidth', lower: 0, upper: 10,    logarithmic: false, default: 1},
        ]
    }),

    construct: (sampleRate: number, knobValues: number[]): UpdateFunc => {
        let x1: number = 0;
        let x2: number = 0;
        let y1: number = 0;
        let y2: number = 0;

        return (xs: Float32Array[], ys: Float32Array[]) => {
            const omega = 2 * Math.PI * knobValues[0] / sampleRate;
            const sn = Math.sin(omega);
            const cs = Math.cos(omega);
            const alpha = sn * Math.sinh(Math.log(2)/2 * knobValues[1] * omega / sn);

            const b0 = (1 - cs) /2;
            const b1 = 1 - cs;
            const b2 = (1 - cs) /2;

            const a0 = 1 + alpha;
            const a1 = -2 * cs;
            const a2 = 1 - alpha;

            const c0 = b0 / a0;
            const c1 = b1 / a0;
            const c2 = b2 / a0;
            const c3 = a1 / a0;
            const c4 = a2 / a0;

            const x = xs[0];
            const y = ys[0];

            y[0] = c0*x[0] + c1*x1 + c2*x2 - c3*y1 - c4*y2;
            y[1] = c0*x[1] + c1*x[0]    + c2*x1 - c3*y[0]    - c4*y1;

            for (let i = 2; i < x.length; ++i) {
                y[i] = c0*x[i] + c1*x[i-1] + c2*x[i-2] - c3*y[i-1] - c4*y[i-2];
            }

            x1 = x[x.length - 1];
            x2 = x[x.length - 2];

            y1 = y[x.length - 1];
            y2 = y[x.length - 2];
        };
    },
};
