export class VolumeMeter {
  frameId: number = -1;
  canvas: HTMLCanvasElement;
  color: string;
  border: string;

  constructor(
    track: MediaStreamTrack,
    canvas: HTMLCanvasElement,
    color: string,
    border: string
  ) {
    this.canvas = canvas;
    this.color = color;
    this.border = border;

    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) {
      return;
    }

    const audioCtx = new AudioContext();

    let analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;

    let source = audioCtx.createMediaStreamTrackSource(track);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const frequencies = new Uint8Array(bufferLength);

    const draw = () => {
      analyser.getByteFrequencyData(frequencies);

      const boundingBox = canvas.getBoundingClientRect();
      const canvasHeight = Math.floor(boundingBox.height);
      const canvasWidth = Math.floor(boundingBox.width);

      canvas.height = canvasHeight;
      canvas.width = canvasWidth;

      canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

      let barWidth = (canvasWidth / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = frequencies[i] / 2;

        if (this.border) {
          canvasCtx.fillStyle = "#999";
          canvasCtx.fillRect(
            x - 1,
            canvasHeight - barHeight - 1,
            barWidth + 1,
            barHeight + 1
          );
        }
        canvasCtx.fillStyle = this.color;
        canvasCtx.fillRect(x, canvasHeight - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
      this.frameId = requestAnimationFrame(draw);
    };

    this.frameId = requestAnimationFrame(draw);
  }

  close() {
    cancelAnimationFrame(this.frameId);

    // Clear canvas
    const canvasCtx = this.canvas.getContext("2d");
    if (canvasCtx) {
      const boundingBox = this.canvas.getBoundingClientRect();
      canvasCtx.clearRect(0, 0, boundingBox.width, boundingBox.height);
    }
  }
}
