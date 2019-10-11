export const copyBuffer = (from: Float32Array, to: Float32Array): void => {
    for (let i = 0; i < from.length && i < to.length; ++i)
        to[i] = from[i];
};

export type SmoothNoiseGenerator = () => number;

export const createSmoothNoiseGenerator = (scale: number): SmoothNoiseGenerator => {
    const MAX_VERTICES = 256;
    const MAX_VERTICES_MASK = MAX_VERTICES -1;

    const r: number[] = [];
    let x: number = 0;

    for (let i = 0; i < MAX_VERTICES; ++i) {
        r.push(Math.random());
    }

    return () => {
        x += scale;

        const xFloor = Math.floor(x);
        const t = x - xFloor;
        const t1 = t * t * ( 3 - 2 * t );

        const xMin = xFloor & MAX_VERTICES_MASK;
        const xMax = (xMin + 1) & MAX_VERTICES_MASK;

        return r[xMin]*(1 - t1) + r[xMax]*t1;
    };
};
