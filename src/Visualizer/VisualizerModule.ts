export class VisualizerModule {
    audioContext: AudioContext | null;
    analyser: AnalyserNode | null;
    dataArray: Uint8Array | null;
    playSound: AudioBufferSourceNode | null;
    canvas: HTMLCanvasElement | null;
    gl: WebGL2RenderingContext | null;
    prog: WebGLProgram | null;
    vs: WebGLShader | null;
    fs: WebGLShader | null;
    arrayBuffer: ArrayBuffer | null;
    duration: number;

    constructor() {
        this.analyser = null;
        this.dataArray = null;
        this.canvas = null;
        this.gl = null;
        this.prog = null;
        this.audioContext = null;
        this.playSound = null;
        this.vs = null;
        this.fs = null;
        this.arrayBuffer = null;
        this.duration = 0;
    }

    setup(arrayBuffer: ArrayBuffer, canvas: HTMLCanvasElement) {
        this.arrayBuffer = arrayBuffer;
        this.audioContext = new AudioContext();
        this.playSound = this.audioContext.createBufferSource();
        this.audioContext.decodeAudioData(arrayBuffer).then((buffer) => {
            this.playSound!.buffer = buffer;
            this.duration = this.playSound!.buffer.duration;
        });
        this.analyser = this.audioContext.createAnalyser();
        this.playSound.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.playSound.start(this.audioContext.currentTime);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.canvas = canvas;
        this.analyser.getByteFrequencyData(this.dataArray);
        this.gl = this.canvas.getContext('webgl2')!;
        this.prog = this.gl.createProgram()!;

        const vertexShaderSource = `#version 300 es
            uniform float u_PointSize;
            in vec2 a_Position;
            in vec4 a_Color;
            out vec4 v_Color;
            void main() {
              v_Color = a_Color;
              gl_Position = vec4(a_Position, 0, 1);
              gl_PointSize = u_PointSize;
            }`;
        this.vs = this.gl.createShader(this.gl.VERTEX_SHADER)!;
        this.gl.shaderSource(this.vs!, vertexShaderSource);
        this.gl.compileShader(this.vs!);

        // Compile the fragment shader
        const fragmentShaderSource = `#version 300 es
            precision highp float;
            in vec4 v_Color;
            out vec4 color;
            void main() {
              color = v_Color;
            }`;
        this.fs = this.gl.createShader(this.gl.FRAGMENT_SHADER)!;
        this.gl.shaderSource(this.fs!, fragmentShaderSource);
        this.gl.compileShader(this.fs!);

        // Link the program
        this.gl.attachShader(this.prog!, this.vs!);
        this.gl.attachShader(this.prog!, this.fs!);
        this.gl.linkProgram(this.prog!);

        if (!this.gl.getProgramParameter(this.prog!, this.gl.LINK_STATUS)) {
            // eslint-disable-next-line no-console
            console.error('prog info-log:', this.gl.getProgramInfoLog(this.prog!));
            // eslint-disable-next-line no-console
            console.error('vert info-log: ', this.gl.getShaderInfoLog(this.vs!));
            // eslint-disable-next-line no-console
            console.error('frag info-log: ', this.gl.getShaderInfoLog(this.fs!));
        }
    }

    draw() {
        // eslint-disable-next-line no-console
        if (
            !(
                this.audioContext !== null &&
                this.analyser !== null &&
                this.dataArray !== null &&
                this.playSound !== null &&
                this.canvas !== null &&
                this.gl !== null &&
                this.prog !== null &&
                this.vs !== null &&
                this.fs !== null &&
                this.arrayBuffer !== null
            )
        ) {
            return;
        }

        let buffer = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(buffer);
        // const max = temp[buffer.length - 1];
        // const min = temp[0];
        // const max = 256;
        // Use the program
        this.gl.useProgram(this.prog);
        const u_PointSize = this.gl.getUniformLocation(this.prog!, 'u_PointSize');

        // Set uniform value
        this.gl.uniform1f(u_PointSize, 5);
        // Get uniform location
        const a_PositionIndex = this.gl.getAttribLocation(this.prog!, 'a_Position');
        const a_ColorIndex = this.gl.getAttribLocation(this.prog!, 'a_Color');

        // Set up attribute buffers
        const a_PositionBuffer = this.gl.createBuffer();
        const a_ColorBuffer = this.gl.createBuffer();
        // Set up a vertex array object
        // This tells WebGL how to iterate your attribute buffers
        const vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(vao);

        // Pull 2 floats at a time out of the position buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, a_PositionBuffer);
        this.gl.enableVertexAttribArray(a_PositionIndex);
        this.gl.vertexAttribPointer(a_PositionIndex, 2, this.gl.FLOAT, false, 0, 0);

        // Pull 4 floats at a time out of the color buffer
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, a_ColorBuffer);
        this.gl.enableVertexAttribArray(a_ColorIndex);
        this.gl.vertexAttribPointer(a_ColorIndex, 4, this.gl.FLOAT, false, 0, 0);

        const xs = [-1, -0.5, 0, 0.5, 1];

        const calculate = (x: number, ys: number[]) => {
            let sum = 0;
            for (let i = 0; i < 5; i++) {
                let l = 1;
                for (let j = 0; j < 5; j++) {
                    if (j != i) {
                        l = (l * (x - xs[j])) / (xs[i] - xs[j]);
                    }
                }
                sum += ys[i] * l;
            }
            return sum;
        };

        // Add some points to the position buffer
        const positions = new Float32Array(buffer.length / 2);
        let x = -1;
        const ys = [buffer[0] / 256, buffer[125] / 256, buffer[250] / 256, buffer[375] / 256, buffer[500] / 256];
        positions.forEach((value, idx) => {
            if (buffer[idx] !== 0) {
                if (idx % 2 === 0 && idx !== 0) {
                    //OX
                    x = x + 8 / 1024;
                    positions[idx] = x;
                } else {
                    //OY
                    const y = calculate(positions[idx - 1], ys) - 0.5;
                    positions[idx] = y;
                }
            }
        });

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, a_PositionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

        // Add some points to the color buffer
        let colors = new Float32Array(2 * buffer.length);
        colors = colors.map((element, idx) => {
            // 255,222,93,255
            switch (idx % 4) {
                case 0:
                    return 255 / 255;
                case 1:
                    return 222 / 255;
                case 2:
                    return 93 / 255;
                case 3:
                    return 255 / 255;
            }
            return 0;
        });
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, a_ColorBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, colors, this.gl.STATIC_DRAW);

        // Draw the point
        this.gl.clearColor(255, 255, 255, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.POINTS, 0, positions.length / 2); //draw all 1024 dots
        window.requestAnimationFrame(() => this.draw());
    }

    clear() {
        this.gl?.clearColor(0, 0, 0, 1);
        this.gl?.clear(this.gl.COLOR_BUFFER_BIT);
        this.analyser = null;
        this.audioContext?.close();
        this.audioContext = null;
        this.playSound = null;
        this.dataArray = null;
        this.canvas = null;
        this.gl = null;
        this.prog = null;
        this.vs = null;
        this.fs = null;
        this.arrayBuffer = null;
    }
}

export const visualizerModule = new VisualizerModule();
