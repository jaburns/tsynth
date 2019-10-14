import { GainDef } from "./gain";
import { AdderDef } from "./adder";
import { ADSRDef } from "./adsr";
import { LPFDef } from "./lpf";
import { WaveformDef } from "./waveform";
import { copyBuffer } from "utils";

export type NodeType = 
    'adder' |
    'adsr' |
    'lpf' |
    'gain' |
    'waveform' ;

export type KnobDescriptor = {
    readonly label: string,
    readonly lower: number,
    readonly upper: number,
    readonly default: number,

    readonly logarithmic?: boolean,
    readonly integral?: boolean,
};

export type NodeDescriptor = {
    readonly inputSignals: ReadonlyArray<string>,
    readonly outputSignals: ReadonlyArray<string>,
    readonly knobs: ReadonlyArray<KnobDescriptor>,
};

export type UpdateFunc = (inputs: Float32Array[], outputs: Float32Array[]) => void;

export type NodeConstructor = (sampleRate: number, knobValues: number[]) => UpdateFunc;

export type NodeDef = {
    readonly descriptor: NodeDescriptor,
    readonly construct: NodeConstructor,
};

export type NodeInstance = {
    readonly type: NodeType,
    readonly knobValues: number[],
};

export type Patch = {
    readonly fromNodeIndex: number;
    readonly fromSignalIndex: number;
    readonly toNodeIndex: number;
    readonly toSignalIndex: number;
};

export type Instrument = {
    readonly nodes: NodeInstance[],
    readonly patches: Patch[],
};

export const createInstrument = (): Instrument => ({
    nodes: [],
    patches: [],
});

export const getNodeDescriptor = (type: NodeType): NodeDescriptor => {
    switch (type) {
        case 'adder':    return AdderDef.descriptor;
        case 'adsr':     return ADSRDef.descriptor;
        case 'lpf':      return LPFDef.descriptor;
        case 'gain':     return GainDef.descriptor;
        case 'waveform': return WaveformDef.descriptor;
    }
    throw new Error('Node descriptor missing for provided type');
};

export const constructNode = (sampleRate: number, node: NodeInstance): UpdateFunc => {
    switch (node.type) {
        case 'adder':    return AdderDef.construct(sampleRate, node.knobValues);
        case 'adsr':     return ADSRDef.construct(sampleRate, node.knobValues);
        case 'lpf':      return LPFDef.construct(sampleRate, node.knobValues);
        case 'gain':     return GainDef.construct(sampleRate, node.knobValues);
        case 'waveform': return WaveformDef.construct(sampleRate, node.knobValues);
    }
    throw new Error('Node constructor missing for provided type');
};

export type InstrumentUpdateFunc = (inputSync: Float32Array, inputFreq: Float32Array, outputBuffer: Float32Array) => void;

export const constructInstrument = (sampleRate: number, bufferSize: number, instrument: Instrument): InstrumentUpdateFunc => {
    const inpSync = new Float32Array(bufferSize);
    const inpFreq = new Float32Array(bufferSize);
    const out = new Float32Array(bufferSize);

    const nodes = instrument.nodes.map(x => ({
        inputs: [] as Float32Array[],
        outputs: [] as Float32Array[],
        update: constructNode(sampleRate, x),
        depth: NaN,
    }));

    instrument.patches.forEach(p => {
        if (p.fromNodeIndex === -2) {
            nodes[p.toNodeIndex].inputs[p.toSignalIndex] =  inpSync;
        }
        else if (p.fromNodeIndex === -1) {
            nodes[p.toNodeIndex].inputs[p.toSignalIndex] =  inpFreq;
            nodes[p.toNodeIndex].depth = 0;
        }
        else if (p.toNodeIndex < 0) {
            nodes[p.fromNodeIndex].outputs[p.fromSignalIndex] = out;
        }
        else if (nodes[p.fromNodeIndex].outputs[p.fromSignalIndex]) {
            nodes[p.toNodeIndex].inputs[p.toSignalIndex] = nodes[p.fromNodeIndex].outputs[p.fromSignalIndex];
        }
        else {
            const buff = new Float32Array(bufferSize);
            nodes[p.fromNodeIndex].outputs[p.fromSignalIndex] = buff;
            nodes[p.toNodeIndex].inputs[p.toSignalIndex] =  buff;
        }
    });

    for (;;) {
        let depthsAssigned = 0;

        for (let i = 0; i < nodes.length; ++i) {
            if (!isNaN(nodes[i].depth)) {
                depthsAssigned++;
            }
        }

        if (depthsAssigned === nodes.length) {
            break;
        }

        for (let i = 0; i < instrument.patches.length; ++i) {
            if (!isNaN(nodes[instrument.patches[i].fromNodeIndex].depth)) {
                nodes[instrument.patches[i].toNodeIndex].depth = 
                    nodes[instrument.patches[i].fromNodeIndex].depth + 1;
            }
        }
    }

    nodes.sort((a, b) => a.depth - b.depth);

    return (inSync, inFreq, outputBuffer) => {
        copyBuffer(inSync, inpSync);
        copyBuffer(inFreq, inpFreq);

        for (let i = 0; i < nodes.length; ++i) {
            nodes[i].update(nodes[i].inputs, nodes[i].outputs);
        }

        copyBuffer(out, outputBuffer);
    };
};
