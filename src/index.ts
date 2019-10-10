import { NoiseNode, LowPassFilterNode, copyBuffer, Knob, BaseNode, KnobSet, SineNode } from "filters";
import { Simple1DNoise } from "noise1";
import { startAudio } from "systemapi";

document.createElement('input');

const button = document.querySelector('button') as HTMLButtonElement;

const BUFFER_SIZE = 512;


let knobs = document.getElementById('knobs') as HTMLDivElement
let knobTemplate = document.getElementById('knob-template') as HTMLTemplateElement;

let createKnobSlider = (label: string, knob: Knob, onChange: () => void) => {
    let newKnob = knobTemplate.content.cloneNode(true) as HTMLElement;
    let labelElem = newKnob.querySelector('label') as HTMLLabelElement;
    let inputElem = newKnob.querySelector('input') as HTMLInputElement;

    labelElem.innerText = label;

    if (knob.logarithmic) {
        inputElem.value =
            ((Math.log(knob.value) - Math.log(knob.lower)) /
             (Math.log(knob.upper) - Math.log(knob.lower))).toString();
    }
    else {
        inputElem.value = ((knob.value - knob.lower) / (knob.upper - knob.lower)).toString();
    }

    inputElem.oninput = inputElem.onchange = e => {
        let val = parseFloat(inputElem.value);

        if (knob.logarithmic) {
            knob.value = Math.exp(Math.log(knob.lower) + val * (Math.log(knob.upper) - Math.log(knob.lower)));
            console.log(knob.lower, knob.upper, knob.value, val);
        } else {
            knob.value = knob.lower + val * (knob.upper - knob.lower);
        }

        onChange();
    };

    knobs.append(newKnob);
    knobs.append(document.createElement('br'));
};

const createSlidersForNode = <T extends KnobSet>(name: string, node: BaseNode<T>) => {
    for(let k in node.knobs) {
        createKnobSlider(name+' '+k, (node.knobs as any)[k], () => node.update());
    }
}

button.onclick = () => {
    let noiseNode: NoiseNode;
    let filterNode: LowPassFilterNode;

    const buf0 = new Float32Array(BUFFER_SIZE);
    const buf1 = new Float32Array(BUFFER_SIZE);

    startAudio(BUFFER_SIZE, 1, 
        sampleRate => {
            noiseNode = new SineNode(sampleRate);
            filterNode = new LowPassFilterNode(sampleRate);

            noiseNode.bindBuffers([], [buf0]);
            filterNode.bindBuffers([buf0], [buf1]);

            createSlidersForNode('sine', noiseNode);
            createSlidersForNode('filter', filterNode);
        },
        output => {
            noiseNode.tick();
            filterNode.tick();
            copyBuffer(buf1, output);
        }
    );


//  let noise = Simple1DNoise();
//  let noiseT = 0;
//  setInterval(() => {
//      noise.setScale(0.01);
//      noise.setAmplitude(1);
//      let rand = noise.getVal(noiseT++);
//      filterNode.knobs.frequency.value = 175 + (400 - 175) * rand;
//      filterNode.update();
//  }, 10);
};
