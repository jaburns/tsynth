import { AudioSystem } from "audioSystem";
import { SineSource } from "nodes/sineSource";
import { LowPassFilter } from "nodes/biquadFilter";
import { createSlidersForNode } from "ui";
import { copyBuffer } from "utils";
import { SquareSource } from "nodes/squareSource";
import { GainFilter } from "nodes/gainFilter";
import { SawSource } from "nodes/sawSource";
import { AddFilter } from "nodes/addFilter";
import { KnobSet, patchNodes } from "nodes/baseNode";
import { ADSRFilter } from "nodes/adsrFilter";

const BUFFER_SIZE = 512;

const goButton = document.querySelector('#go-button') as HTMLButtonElement;
const dingButton = document.querySelector('#ding-button') as HTMLButtonElement;

const dingBuffer = new Float32Array(BUFFER_SIZE);

dingButton.onmousedown = () => { dingBuffer[0] = 1; };
dingButton.onmouseup = () => { dingBuffer[0] = 0; };

goButton.onclick = () => {
    const audio = new AudioSystem(BUFFER_SIZE, 1);

    const squareSource = new SquareSource(audio.sampleRate);
    const sineSource = new SineSource(audio.sampleRate);
    const squareLPF = new LowPassFilter(audio.sampleRate);
    const sineLPF = new LowPassFilter(audio.sampleRate);
    const squareGain = new GainFilter();
    const sineGain = new GainFilter();
    const adder = new AddFilter();
    const adsr = new ADSRFilter(audio.sampleRate);

    patchNodes(BUFFER_SIZE, squareSource, squareLPF);
    patchNodes(BUFFER_SIZE, squareLPF, squareGain);
    patchNodes(BUFFER_SIZE, squareGain, adder);

    patchNodes(BUFFER_SIZE, sineSource, sineLPF);
    patchNodes(BUFFER_SIZE, sineLPF, sineGain);
    patchNodes(BUFFER_SIZE, sineGain, adder);

    adsr.connectInputBuffer(dingBuffer);
    patchNodes(BUFFER_SIZE, adder, adsr);

    const out = new Float32Array(BUFFER_SIZE);
    adsr.connectOutputBuffer(out);

    createSlidersForNode('squareSource', squareSource);
    createSlidersForNode('sineSource', sineSource);
    createSlidersForNode('squareLPF', squareLPF);
    createSlidersForNode('sineLPF', sineLPF);
    createSlidersForNode('squareGain', squareGain);
    createSlidersForNode('sineGain', sineGain);
    createSlidersForNode('adder', adder);
    createSlidersForNode('adsr', adsr);

    squareSource.update();
    sineSource.update();
    squareLPF.update();
    sineLPF.update();
    squareGain.update();
    sineGain.update();
    adder.update();
    adsr.update();

    audio.start(outBuffer => {
        squareSource.tick();
        sineSource.tick();
        squareLPF.tick();
        sineLPF.tick();
        squareGain.tick();
        sineGain.tick();
        adder.tick();
        adsr.tick();

        copyBuffer(out, outBuffer);
    });
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
