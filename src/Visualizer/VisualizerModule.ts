export class VisualizerModule {
    audioContext: AudioContext;
    analyser: AnalyserNode;
    dataArray: Uint8Array;
    playSound: AudioBufferSourceNode;
    canvas: HTMLCanvasElement;
    gl: WebGL2RenderingContext;
    prog: WebGLProgram;
    vs: WebGLShader;
    fs: WebGLShader;

    constructor(arrayBuffer: ArrayBuffer, canvas: HTMLCanvasElement) {
        this.audioContext = new AudioContext();
        this.playSound = this.audioContext.createBufferSource();
        this.audioContext.decodeAudioData(arrayBuffer).then((buffer) => {
            this.playSound.buffer = buffer;
        });
        this.analyser = this.audioContext.createAnalyser();
        this.playSound.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        this.playSound.start(this.audioContext.currentTime);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(this.dataArray);
        this.canvas = canvas;
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
            console.error('prog info-log:', this.gl.getProgramInfoLog(this.prog!));
            console.error('vert info-log: ', this.gl.getShaderInfoLog(this.vs!));
            console.error('frag info-log: ', this.gl.getShaderInfoLog(this.fs!));
        }
    }

    draw() {
        let buffer = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(buffer);
        // const max = temp[buffer.length - 1];
        // const min = temp[0];
        const max = 256;
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

        // Add some points to the position buffer
        const positions = new Float32Array(4096);
        let x = -0.75;
        positions.forEach((value, idx) => {
            if (idx % 2 === 0 && idx !== 0) {
                //OX
                x = x + 1.5 / 1024;
                positions[idx] = x;
            } else {
                //OY
                const y = Math.sqrt(0.75 * 0.75 - x * x);
                const deviation = (0.2 * buffer[idx]) / max;
                positions[idx - 1] = x - (x * deviation) / 0.75;
                positions[idx] = y - (y * deviation) / 0.75;
            }
        });

        for (let idx = 2048; idx < positions.length; idx = idx + 2) {
            positions[idx] = -positions[4096 - idx - 1];
            positions[idx - 1] = -positions[4096 - idx];
        }

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
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.POINTS, 0, positions.length / 2); // draw all 4 points
        window.requestAnimationFrame(() => this.draw());
    }
}
//     main() {
//   // Get A WebGL context
//   /** @type {HTMLCanvasElement} */
//       var canvas = document.querySelector("#canvas") as HTMLCanvasElement;;
//       if (!canvas) {
//         return;
//       }
//     var gl = canvas.getContext("webgl");
//     if (!gl) {
//       return;
//     }

//   // setup GLSL program
//   var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);

//   // look up where the vertex data needs to go.
//   var positionLocation = gl.getAttribLocation(program, "a_position");

//   // lookup uniforms
//   var resolutionLocation = gl.getUniformLocation(program, "u_resolution");
//   var colorLocation = gl.getUniformLocation(program, "u_color");
//   var translationLocation = gl.getUniformLocation(program, "u_translation");
//   var rotationLocation = gl.getUniformLocation(program, "u_rotation");

//   // Create a buffer to put positions in
//   var positionBuffer = gl.createBuffer();
//   // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
//   gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//   // Put geometry data into buffer
//   setGeometry(gl);

//   var translation = [100, 150];
//   var rotation = [0, 1];
//   var color = [Math.random(), Math.random(), Math.random(), 1];

//   drawScene();

//   function updatePosition(index) {
//     return function(event, ui) {
//       translation[index] = ui.value;
//       drawScene();
//     };
//   }

//   function updateAngle(event, ui) {
//     var angleInDegrees = 360 - ui.value;
//     var angleInRadians = angleInDegrees * Math.PI / 180;
//     rotation[0] = Math.sin(angleInRadians);
//     rotation[1] = Math.cos(angleInRadians);
//     drawScene();
//   }

//   // Draw the scene.
//   function drawScene() {
//     webglUtils.resizeCanvasToDisplaySize(gl.canvas);

//     // Tell WebGL how to convert from clip space to pixels
//     gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

//     // Clear the canvas.
//     gl.clear(gl.COLOR_BUFFER_BIT);

//     // Tell it to use our program (pair of shaders)
//     gl.useProgram(program);

//     // Turn on the attribute
//     gl.enableVertexAttribArray(positionLocation);

//     // Bind the position buffer.
//     gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

//     // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
//     var size = 2;          // 2 components per iteration
//     var type = gl.FLOAT;   // the data is 32bit floats
//     var normalize = false; // don't normalize the data
//     var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
//     var offset = 0;        // start at the beginning of the buffer
//     gl.vertexAttribPointer(
//         positionLocation, size, type, normalize, stride, offset);

//     // set the resolution
//     gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);

//     // set the color
//     gl.uniform4fv(colorLocation, color);

//     // Set the translation.
//     gl.uniform2fv(translationLocation, translation);

//     // Set the rotation.
//     gl.uniform2fv(rotationLocation, rotation);

//     // Draw the geometry.
//     var primitiveType = gl.TRIANGLES;
//     var offset = 0;
//     var count = 18;  // 6 triangles in the 'F', 3 points per triangle
//     gl.drawArrays(primitiveType, offset, count);
//   }
// }

// // Fill the buffer with the values that define a letter 'F'.
// function setGeometry(gl) {
//   gl.bufferData(
//       gl.ARRAY_BUFFER,
//       new Float32Array([
//           // left column
//           0, 0,
//           30, 0,
//           0, 150,
//           0, 150,
//           30, 0,
//           30, 150,

//           // top rung
//           30, 0,
//           100, 0,
//           30, 30,
//           30, 30,
//           100, 0,
//           100, 30,

//           // middle rung
//           30, 60,
//           67, 60,
//           30, 90,
//           30, 90,
//           67, 60,
//           67, 90,
//       ]),
//       gl.STATIC_DRAW);
// }
