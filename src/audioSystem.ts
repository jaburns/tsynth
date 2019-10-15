export type AudioCallback = (buffer: Float32Array) => void;

export class AudioSystem {
    private readonly ctx: AudioContext;
    private readonly node: ScriptProcessorNode;

    constructor(bufferSize: number, channels: number) {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        this.ctx = new Ctx as AudioContext;

        this.node = this.ctx.createScriptProcessor(bufferSize, 0, channels);
    }

    get sampleRate(): number {
        return this.ctx.sampleRate;
    }

    start(tick: AudioCallback) {
        this.node.onaudioprocess = e => {
            const outputBuffer = e.outputBuffer;
            const outputData = outputBuffer.getChannelData(0);

            // TODO stereo

            tick(outputData);
        };

        this.node.connect(this.ctx.destination);
    }
}