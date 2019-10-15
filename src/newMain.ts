import { createInstrument, createNode, NodeInstance, getNodeDescriptor, Patch, Instrument, constructInstrument, InstrumentUpdateFunc } from "newNodes";
import { AudioSystem } from "audioSystem";

const BUFFER_SIZE = 512;

let movingNodeIndex: number = -1;
let movingNodeStartX: number = 0;
let movingNodeStartY: number = 0;

let patchingFromNodeIndex: number = -1;
let patchingFromSignalIndex: number = 0;

let liveKnobArray: number[];
let liveKnobIndex: number = -1;

const drawNode = (ctx: CanvasRenderingContext2D, node: NodeInstance, nodeIndex: number, mouseX: number, mouseY: number) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(node.x, node.y, 100, 150);
    ctx.fillStyle = '#00f';
    ctx.textAlign = 'center'
    ctx.font = '14px sans-serif';
    ctx.fillText(node.type, node.x + 50, node.y + 14, 100);

    const desc = getNodeDescriptor(node.type);

    ctx.fillStyle = '#f00';
    ctx.textAlign = 'left';

    let pos = 2;

    for (let i = 0; i < desc.knobs.length; ++i) {
        const text = `${desc.knobs[i].label}: ${node.knobValues[i]}`;
        ctx.fillText(text, node.x + 2, node.y + 14*pos, 100);
        pos++;
    }

    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';

    for (let i = 0; i < desc.inputSignals.length; ++i) {
        ctx.fillText(desc.inputSignals[i], node.x + 2, node.y + 14*pos, 100);
        pos++;
    }

    ctx.textAlign = 'right';

    for (let i = 0; i < desc.outputSignals.length; ++i) {
        ctx.fillText(desc.outputSignals[i], node.x + 100 - 2, node.y + 14*pos, 100);

        if (patchingFromNodeIndex === nodeIndex && patchingFromSignalIndex === i) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#0f0';
            ctx.beginPath();
            ctx.moveTo(node.x + 100, node.y + 14*pos - 7);
            ctx.lineTo(mouseX, mouseY);
            ctx.stroke();
        }

        pos++;
    }
};

const getNodeInputPos = (node: NodeInstance, inputIndex: number): {x:number, y:number} => {
    let pos = 2;
    const desc = getNodeDescriptor(node.type);

    for (let i = 0; i < desc.knobs.length; ++i) {
        pos++;
    }
    for (let i = 0; i < desc.inputSignals.length; ++i) {
        if (i === inputIndex) {
            return {x: node.x, y: node.y + 14*pos - 7};
        }
        pos++;
    }
    for (let i = 0; i < desc.outputSignals.length; ++i) {
        pos++;
    }

    return {x:0, y:0};
};

const getNodeOutputPos = (node: NodeInstance, outputIndex: number): {x:number, y:number} => {
    let pos = 2;
    const desc = getNodeDescriptor(node.type);

    for (let i = 0; i < desc.knobs.length; ++i) {
        pos++;
    }
    for (let i = 0; i < desc.inputSignals.length; ++i) {
        pos++;
    }
    for (let i = 0; i < desc.outputSignals.length; ++i) {
        if (i === outputIndex) {
            return {x: node.x + 100, y: node.y + 14*pos - 7};
        }
        pos++;
    }

    return {x:0, y:0};
};

const drawPatch = (ctx: CanvasRenderingContext2D, nodes: NodeInstance[], patch: Patch) => {
    const from = getNodeOutputPos(nodes[patch.fromNodeIndex], patch.fromSignalIndex);
    const to = getNodeInputPos(nodes[patch.toNodeIndex], patch.toSignalIndex);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f0';
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
};

// const SAVED = {"nodes":[{"type":"input","knobValues":[],"x":58,"y":362},{"type":"output","knobValues":[],"x":934,"y":391},{"type":"waveform","knobValues":[1],"x":304,"y":3},{"type":"waveform","knobValues":[1],"x":303,"y":163},{"type":"adder","knobValues":[],"x":665,"y":220},{"type":"gain","knobValues":[1],"x":542,"y":45},{"type":"gain","knobValues":[1],"x":542,"y":205},{"type":"lpf","knobValues":[200,1],"x":420,"y":17},{"type":"lpf","knobValues":[200,1],"x":421,"y":177},{"type":"adsr","knobValues":[0.03,0.2,0.5,0.2],"x":810,"y":308}],"patches":[{"fromNodeIndex":0,"fromSignalIndex":0,"toNodeIndex":2,"toSignalIndex":0},{"fromNodeIndex":0,"fromSignalIndex":0,"toNodeIndex":3,"toSignalIndex":0},{"fromNodeIndex":0,"fromSignalIndex":1,"toNodeIndex":2,"toSignalIndex":1},{"fromNodeIndex":0,"fromSignalIndex":1,"toNodeIndex":3,"toSignalIndex":1},{"fromNodeIndex":5,"fromSignalIndex":0,"toNodeIndex":4,"toSignalIndex":0},{"fromNodeIndex":6,"fromSignalIndex":0,"toNodeIndex":4,"toSignalIndex":1},{"fromNodeIndex":2,"fromSignalIndex":0,"toNodeIndex":7,"toSignalIndex":0},{"fromNodeIndex":7,"fromSignalIndex":0,"toNodeIndex":5,"toSignalIndex":0},{"fromNodeIndex":3,"fromSignalIndex":0,"toNodeIndex":8,"toSignalIndex":0},{"fromNodeIndex":8,"fromSignalIndex":0,"toNodeIndex":6,"toSignalIndex":0},{"fromNodeIndex":0,"fromSignalIndex":0,"toNodeIndex":9,"toSignalIndex":0},{"fromNodeIndex":4,"fromSignalIndex":0,"toNodeIndex":9,"toSignalIndex":1},{"fromNodeIndex":9,"fromSignalIndex":0,"toNodeIndex":1,"toSignalIndex":0}]}
// const SAVED = {"nodes":[{"type":"input","knobValues":[],"x":52,"y":249},{"type":"output","knobValues":[],"x":602,"y":195},{"type":"waveform","knobValues":[2],"x":228,"y":257},{"type":"adsr","knobValues":[0.03,0.2,0.5,0.2],"x":417,"y":89}],"patches":[{"fromNodeIndex":0,"fromSignalIndex":0,"toNodeIndex":2,"toSignalIndex":0},{"fromNodeIndex":0,"fromSignalIndex":0,"toNodeIndex":3,"toSignalIndex":0},{"fromNodeIndex":0,"fromSignalIndex":1,"toNodeIndex":2,"toSignalIndex":1},{"fromNodeIndex":2,"fromSignalIndex":0,"toNodeIndex":3,"toSignalIndex":1},{"fromNodeIndex":3,"fromSignalIndex":0,"toNodeIndex":1,"toSignalIndex":0}]};
const SAVED = {"nodes":[{"type":"input","knobValues":[],"x":47,"y":156},{"type":"output","knobValues":[],"x":793,"y":197},{"type":"waveform","knobValues":[1],"x":228,"y":257},{"type":"adsr","knobValues":[0.03,0.2,0.5,0.2],"x":663,"y":112},{"type":"gain","knobValues":[0.75],"x":362,"y":260},{"type":"adder","knobValues":[],"x":520,"y":255},{"type":"waveform","knobValues":[0],"x":231,"y":24},{"type":"gain","knobValues":[0.5],"x":511,"y":20},{"type":"lpf","knobValues":[1000,1],"x":371,"y":16}],"patches":[{"fromNodeIndex":0,"fromSignalIndex":0,"toNodeIndex":2,"toSignalIndex":0},{"fromNodeIndex":0,"fromSignalIndex":0,"toNodeIndex":3,"toSignalIndex":0},{"fromNodeIndex":0,"fromSignalIndex":1,"toNodeIndex":2,"toSignalIndex":1},{"fromNodeIndex":3,"fromSignalIndex":0,"toNodeIndex":1,"toSignalIndex":0},{"fromNodeIndex":2,"fromSignalIndex":0,"toNodeIndex":4,"toSignalIndex":0},{"fromNodeIndex":4,"fromSignalIndex":0,"toNodeIndex":5,"toSignalIndex":1},{"fromNodeIndex":0,"fromSignalIndex":0,"toNodeIndex":6,"toSignalIndex":0},{"fromNodeIndex":7,"fromSignalIndex":0,"toNodeIndex":5,"toSignalIndex":0},{"fromNodeIndex":5,"fromSignalIndex":0,"toNodeIndex":3,"toSignalIndex":1},{"fromNodeIndex":6,"fromSignalIndex":0,"toNodeIndex":8,"toSignalIndex":0},{"fromNodeIndex":8,"fromSignalIndex":0,"toNodeIndex":7,"toSignalIndex":0}]};

const app = (ctx: CanvasRenderingContext2D) => {
    let mouseX = 0, mouseY = 0;

//  const ins = createInstrument();
//  const outNode = createNode('output');
//  outNode.x = 500;
//  ins.nodes.push(createNode('input'));
//  ins.nodes.push(outNode);

    const ins = SAVED as Instrument;


    document.getElementById('add-adder')!.onclick = () => { ins.nodes.push(createNode('adder')); };
    document.getElementById('add-adsr')!.onclick = () => { ins.nodes.push(createNode('adsr')); };
    document.getElementById('add-gain')!.onclick = () => { ins.nodes.push(createNode('gain')); };
    document.getElementById('add-lpf')!.onclick = () => { ins.nodes.push(createNode('lpf')); };
    document.getElementById('add-waveform')!.onclick = () => { ins.nodes.push(createNode('waveform')); };

    const knobText = document.getElementById('knob-text') as HTMLInputElement;

    ctx.canvas.onmousedown = e => {
        const x = e.offsetX;
        const y = e.offsetY;

        topFor: for (let i = 0; i < ins.nodes.length; ++i) {
            const node = ins.nodes[i];
            if (x >= node.x && x <= node.x + 100 && y >= node.y && y <= node.y + 150) {
                if (y < node.y + 14) {
                    movingNodeIndex = i;
                    movingNodeStartX = x - node.x;
                    movingNodeStartY = y - node.y;
                    break topFor;
                }

                const desc = getNodeDescriptor(node.type);
                let pos = 2;

                for (let j = 0; j < desc.knobs.length; ++j) {
                    if (y < node.y + 14*pos) {
                        document.getElementById('knob-label')!.innerText = desc.knobs[j].label;
                        knobText.value = node.knobValues[j].toString();
                        liveKnobArray = node.knobValues;
                        liveKnobIndex = j;
                        break topFor;
                    }
                    pos++;
                }

                for (let j = 0; j < desc.inputSignals.length; ++j) {
                    if (y < node.y + 14*pos) {
                        if (patchingFromNodeIndex >= 0) {
                            ins.patches.push({
                                fromNodeIndex: patchingFromNodeIndex,
                                fromSignalIndex: patchingFromSignalIndex,
                                toNodeIndex: i,
                                toSignalIndex: j
                            });
                            patchingFromNodeIndex = -1;
                        }
                        else {
                            for (let k = 0; k < ins.patches.length; ++k) {
                                if (ins.patches[k].toNodeIndex === i && ins.patches[k].toSignalIndex === j) {
                                    ins.patches.splice(k, 1);
                                    break;
                                }
                            }
                        }
                        break topFor;
                    }
                    pos++;
                }

                for (let j = 0; j < desc.outputSignals.length; ++j) {
                    if (y < node.y + 14*pos) {
                        patchingFromNodeIndex = i;
                        patchingFromSignalIndex = j;
                        break topFor;
                    }
                    pos++;
                }
            }
        }
    };

    ctx.canvas.onmousemove = e => {
        const x = e.offsetX;
        const y = e.offsetY;

        mouseX = x;
        mouseY = y;

        if (movingNodeIndex >= 0) {
            ins.nodes[movingNodeIndex].x = x - movingNodeStartX;
            ins.nodes[movingNodeIndex].y = y - movingNodeStartY;
        }
    };

    ctx.canvas.onmouseup = ctx.canvas.onmouseout = ctx.canvas.onmouseleave = e => {
        movingNodeIndex = -1;
    };

    document.getElementById('save-button')!.onclick = () => {
        console.log(JSON.stringify(ins));
    };

    knobText.onkeyup = () => {
        if (liveKnobIndex < 0) return;

        const num = parseFloat(knobText.value);
        if (!isNaN(num)) {
            liveKnobArray[liveKnobIndex] = num;
        }
    };

    const audio = new AudioSystem(BUFFER_SIZE, 1);
    const inputSync = new Float32Array(BUFFER_SIZE);
    const inputFreq = new Float32Array(BUFFER_SIZE);

    let update: InstrumentUpdateFunc | null = null;

    for (let i = 0; i < BUFFER_SIZE; ++i) {
        inputFreq[i] = 440;
        inputSync[i] = 0;
    }

    document.getElementById('note-button')!.onmousedown = () => {
        for (let i = 0; i < BUFFER_SIZE; ++i) {
            inputSync[i] = 1;
        }
    };
    
    document.getElementById('note-button')!.onmouseup = () => {
        for (let i = 0; i < BUFFER_SIZE; ++i) {
            inputSync[i] = 0;
        }
    };

    audio.start(outBuff => {
        if (update) {
            update(inputSync, inputFreq, outBuff);
        }
    });

    document.getElementById('compile-button')!.onclick = () => {
        update = constructInstrument(audio.sampleRate, BUFFER_SIZE, ins);
    };

    const draw = () => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = 0; i < ins.nodes.length; ++i) {
            drawNode(ctx, ins.nodes[i], i, mouseX, mouseY);
        }

        for (let i = 0; i < ins.patches.length; ++i) {
            drawPatch(ctx, ins.nodes, ins.patches[i]);
        }

        requestAnimationFrame(draw);
    };

    draw();
};


export const main = () => {
    const goButton = document.getElementById('go-button')!;

    goButton.onclick = () => {
        goButton.parentElement!.removeChild(goButton);

        const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;

        app(ctx);
    };
};