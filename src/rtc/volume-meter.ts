export class VolumeMeter {
  frameId: number = -1;
  canvas: HTMLCanvasElement;
  color: string;
  border: string;
  audioCtx: AudioContext;
  canvasCtx: CanvasRenderingContext2D;
  connected: boolean = false;

  constructor(canvas: HTMLCanvasElement, color: string, border: string) {
    this.canvas = canvas;
    this.color = color;
    this.border = border;

    const canvasCtx = canvas.getContext("2d");
    if (canvasCtx === null) {
      throw new Error("Cannot create 2D canvas context");
    }
    this.canvasCtx = canvasCtx;
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Ensure audio context is running on iOS
    this.audioCtx.resume();
  }

  connect(stream: MediaStream) {
    if (this.connected) {
      return;
    }
    this.connected = true;

    let analyser = this.audioCtx.createAnalyser();
    analyser.fftSize = 256;

    // let source = this.audioCtx.createMediaStreamTrackSource(track);
    let source = this.audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const frequencies = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(frequencies);

      const boundingBox = this.canvas.getBoundingClientRect();
      const canvasHeight = Math.floor(boundingBox.height);
      const canvasWidth = Math.floor(boundingBox.width);

      this.canvas.height = canvasHeight;
      this.canvas.width = canvasWidth;

      this.canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      let barWidth = (canvasWidth / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = frequencies[i] / 2;

        if (this.border) {
          this.canvasCtx.fillStyle = "#999";
          this.canvasCtx.fillRect(
            x - 1,
            canvasHeight - barHeight - 1,
            barWidth + 1,
            barHeight + 1
          );
        }
        this.canvasCtx.fillStyle = this.color;
        this.canvasCtx.fillRect(
          x,
          canvasHeight - barHeight,
          barWidth,
          barHeight
        );

        x += barWidth + 1;
      }
      this.frameId = requestAnimationFrame(draw);
    };

    this.frameId = requestAnimationFrame(draw);
  }

  close() {
    cancelAnimationFrame(this.frameId);

    // Stop audio processing
    this.audioCtx.close();

    // Clear canvas
    const boundingBox = this.canvas.getBoundingClientRect();
    this.canvasCtx.clearRect(0, 0, boundingBox.width, boundingBox.height);
  }
}
