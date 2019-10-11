export type Knob = {
    readonly lower: number,
    readonly upper: number,
    readonly logarithmic: boolean,

    value: number,
};

export type KnobSet = {[name: string]: Knob};

export const patchNodes = <T extends KnobSet, U extends KnobSet>(bufferSize: number, nodeA: BaseNode<T>, nodeB: BaseNode<U>) => {
    const buffer = new Float32Array(bufferSize);
    nodeA.connectOutputBuffer(buffer);
    nodeB.connectInputBuffer(buffer);
};

export abstract class BaseNode<K extends KnobSet> {
    readonly sampleRate: number;
    readonly knobs: K; 

    protected readonly inputBuffers: Float32Array[];
    protected readonly outputBuffers: Float32Array[];

    private readonly _minInputs: number;
    private readonly _maxInputs: number;

    get minInputs(): number { return this._minInputs; }
    get maxInputs(): number { return this._maxInputs; }

    disconnect() {
        this.inputBuffers.length = 0;
        this.outputBuffers.length = 0;
    }

    connectInputBuffer(buffer: Float32Array) {
        this.inputBuffers.push(buffer);
    }

    connectOutputBuffer(buffer: Float32Array) {
        this.outputBuffers.push(buffer);
    }

    abstract update(): void;
    abstract tick(): void;

    constructor(sampleRate: number, minInputs: number, maxInputs: number, knobs: K) {
        this.sampleRate = sampleRate;
        this._minInputs = minInputs;
        this._maxInputs = maxInputs;
        this.knobs = knobs;
        this.inputBuffers = [];
        this.outputBuffers = [];
    }
}
