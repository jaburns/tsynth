import { GainDef } from "./gain";
import { AdderDef } from "./adder";
import { ADSRDef } from "./adsr";
import { LPFDef } from "./lpf";
import { WaveformDef } from "./waveform";
import { copyBuffer } from "utils";

export type NodeType = 
    'input' |
    'output' |
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
    x: number,
    y: number,
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

export const createNode = (type: NodeType): NodeInstance => ({
    type,
    knobValues: getNodeDescriptor(type).knobs.map(x => x.default),
    x: 10,
    y: 10,
});

const inputDescriptor: NodeDescriptor = {
    inputSignals: [],
    knobs: [],
    outputSignals: ['sync', 'frequency'],
};

const outputDescriptor: NodeDescriptor = {
    inputSignals: ['output'],
    knobs: [],
    outputSignals: [],
};

export const getNodeDescriptor = (type: NodeType): NodeDescriptor => {
    switch (type) {
        case 'input':    return inputDescriptor;
        case 'output':   return outputDescriptor;
        case 'output':   return AdderDef.descriptor;
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
        instance: x,
        inputs: [] as Float32Array[],
        outputs: [] as Float32Array[],
        depth: NaN,
    }));

    instrument.patches.forEach(p => {
        if (nodes[p.fromNodeIndex].instance.type === "input") {
            if (p.fromSignalIndex === 0) { //sync
                nodes[p.toNodeIndex].inputs[p.toSignalIndex] = inpSync;
            } else { // frequency
                nodes[p.toNodeIndex].inputs[p.toSignalIndex] = inpFreq;
            }
        }
        else if (nodes[p.toNodeIndex].instance.type === "output") {
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

    const getNodeSources = (instrument: Instrument, node: NodeInstance): NodeInstance[] =>
        instrument.patches
            .filter(x => x.toNodeIndex === instrument.nodes.indexOf(node))
            .map(x => instrument.nodes[x.fromNodeIndex]);

    const setNodeDepth = (node: NodeInstance, depth: number) => {
        nodes.filter(x => x.instance === node)[0].depth = depth;
    };

    let walkingDepth = 0;
    let walkingNodes = instrument.nodes.filter(x => x.type === 'output');

    while (walkingNodes.length > 0) {
        let newWalkingNodes = [] as NodeInstance[];

        walkingNodes.forEach(n => {
            setNodeDepth(n, walkingDepth)
            newWalkingNodes = newWalkingNodes.concat(getNodeSources(instrument, n));
        });

        walkingNodes = newWalkingNodes;
    }

    nodes.sort((a, b) => b.depth - a.depth);

    const updates = nodes.map(x => x.instance.type === 'input' || x.instance.type === 'output' ? null : constructNode(sampleRate, x.instance));

    return (inSync, inFreq, outputBuffer) => {
        copyBuffer(inSync, inpSync);
        copyBuffer(inFreq, inpFreq);

        for (let i = 0; i < nodes.length; ++i) {
            if (updates[i] !== null) {
                updates[i]!(nodes[i].inputs, nodes[i].outputs);
            }
        }

        copyBuffer(out, outputBuffer);
    };
};
