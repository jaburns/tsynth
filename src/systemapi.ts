type InitCallback = (sampleRate: number) => void;
type AudioCallback = (buffer: Float32Array) => void;


// interface AudioSystem {
//     get sampleRate(): number;
// };

export const startAudio = (bufferSize: number, channels: number, init: InitCallback, tick: AudioCallback): void => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext;
    const scriptNode = ctx.createScriptProcessor(bufferSize, 0, channels);

    init(ctx.sampleRate);

    scriptNode.onaudioprocess = e => {
        const outputBuffer = e.outputBuffer;
        const outputData = outputBuffer.getChannelData(0);

        tick(outputData);
    };

    scriptNode.connect(ctx.destination);
};