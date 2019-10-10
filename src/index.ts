import { NoiseNode, LowPassFilterNode, copyBuffer } from "filters";
import { Simple1DNoise } from "noise1";
import { startAudio } from "systemapi";

document.createElement('input');

const button = document.querySelector('button') as HTMLButtonElement;

const BUFFER_SIZE = 512;

button.onclick = () => {
    let noiseNode: NoiseNode;
    let filterNode: LowPassFilterNode;

    const buf0 = new Float32Array(BUFFER_SIZE);
    const buf1 = new Float32Array(BUFFER_SIZE);

    startAudio(BUFFER_SIZE, 1, 
        sampleRate => {
            noiseNode = new NoiseNode;
            filterNode = new LowPassFilterNode(sampleRate);

            noiseNode.bindBuffers([], [buf0]);
            filterNode.bindBuffers([buf0], [buf1]);
        },
        output => {
            noiseNode.tick();
            filterNode.tick();
            copyBuffer(buf1, output);
        }
    );

    let elem = document.getElementById('cutoff') as HTMLInputElement;
    elem.oninput = elem.onchange = e => {
        filterNode.knobs.frequency.value = Math.exp(parseFloat(elem.value));
        filterNode.update();
    };

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