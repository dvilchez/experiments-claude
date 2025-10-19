import { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import './WhiteboardComparison.css';

function WhiteboardComparison() {
  const [renderMode, setRenderMode] = useState('canvas');
  const [isDrawing, setIsDrawing] = useState(false);
  const [fps, setFps] = useState(60);
  const [drawCalls, setDrawCalls] = useState(0);
  const canvasRef = useRef(null);
  const pathRef = useRef([]);
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const drawCallCount = useRef(0);
  const glProgramRef = useRef(null);
  const glBufferRef = useRef(null);
  const allLinesRef = useRef([]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (renderMode === 'canvas') {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } else {
        const gl = canvas.getContext('webgl');
        if (gl) {
          gl.clearColor(1, 1, 1, 1);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
      }
    } catch (e) {

    }

    drawCallCount.current = 0;
    setDrawCalls(0);
    pathRef.current = [];
    allLinesRef.current = [];
  }, [renderMode, setDrawCalls]);

  useEffect(() => {
    let animationId;
    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastFrameTime.current;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / elapsed);
        setFps(currentFps);
        frameCount.current = 0;
        lastFrameTime.current = now;
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    measureFPS();
    return () => cancelAnimationFrame(animationId);
  }, []);

  useEffect(() => {
    if (renderMode === 'webgl') {
      initWebGL();
    }
    clearCanvas();
  }, [renderMode, clearCanvas]);

  const initWebGL = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const vertexShaderSource = `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      void main() {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec4 u_color;
      void main() {
        gl_FragColor = u_color;
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    glProgramRef.current = {
      program,
      positionLocation: gl.getAttribLocation(program, 'a_position'),
      resolutionLocation: gl.getUniformLocation(program, 'u_resolution'),
      colorLocation: gl.getUniformLocation(program, 'u_color')
    };

    glBufferRef.current = gl.createBuffer();

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const drawLineCanvas2D = (from, to) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.stroke();

    drawCallCount.current++;
  };

  const drawLineWebGL = (from, to) => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext('webgl');
    if (!gl || !glProgramRef.current) return;

    allLinesRef.current.push({ from, to });

    const { program, positionLocation, resolutionLocation, colorLocation } = glProgramRef.current;

    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform4f(colorLocation, 0.231, 0.510, 0.965, 1);

    allLinesRef.current.forEach(line => {
      const positions = new Float32Array([
        line.from.x, line.from.y,
        line.to.x, line.to.y
      ]);

      gl.bindBuffer(gl.ARRAY_BUFFER, glBufferRef.current);
      gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.LINES, 0, 2);
    });

    drawCallCount.current++;
  };

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const coords = getCoords(e);
    pathRef.current = [coords];
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;

    const coords = getCoords(e);
    const lastPoint = pathRef.current[pathRef.current.length - 1];

    if (renderMode === 'canvas') {
      drawLineCanvas2D(lastPoint, coords);
    } else {
      drawLineWebGL(lastPoint, coords);
    }

    pathRef.current.push(coords);
    setDrawCalls(drawCallCount.current);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    pathRef.current = [];
  };

  const getFpsColor = () => {
    if (fps >= 55) return 'metric-good';
    if (fps >= 45) return 'metric-warning';
    return 'metric-bad';
  };

  return (
    <div className="whiteboard-container">
      <div className="whiteboard-content">
        <div className="whiteboard-card">
          <h1 className="whiteboard-title">
            Canvas 2D vs WebGL Whiteboard Comparison
          </h1>
          <p className="whiteboard-description">
            Draw on the canvas and compare performance between Canvas 2D API and WebGL
          </p>

          <div className="controls-section">
            <label htmlFor="render-mode" className="control-label">
              Rendering Mode:
              <select
                id="render-mode"
                value={renderMode}
                onChange={(e) => setRenderMode(e.target.value)}
                className="mode-select"
              >
                <option value="canvas">Canvas 2D API</option>
                <option value="webgl">WebGL</option>
              </select>
            </label>
          </div>

          <div className="metrics-grid">
            <div className="metric-card metric-card-blue">
              <div className="metric-label">FPS</div>
              <div className={`metric-value ${getFpsColor()}`}>
                {fps}
              </div>
              <div className="metric-target">
                Target: 60
              </div>
            </div>

            <div className="metric-card metric-card-purple">
              <div className="metric-label">Draw Calls</div>
              <div className="metric-value">
                {drawCalls}
              </div>
              <div className="metric-target">
                Total segments
              </div>
            </div>

            <div className="metric-card metric-card-green">
              <div className="metric-label">Mode</div>
              <div className="metric-value metric-mode">
                {renderMode === 'canvas' ? '2D' : 'GL'}
              </div>
              <div className="metric-target">
                {renderMode === 'canvas' ? 'Canvas API' : 'WebGL API'}
              </div>
            </div>
          </div>

          <div className="canvas-wrapper">
            <canvas
              key={renderMode}
              ref={canvasRef}
              width={800}
              height={500}
              role="img"
              aria-label="Whiteboard drawing canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="drawing-canvas"
            />
          </div>

          <button onClick={clearCanvas} className="clear-button">
            <RotateCcw size={20} />
            Clear Canvas
          </button>
        </div>

        <div className="info-card">
          <h2 className="info-title">
            About This Comparison
          </h2>
          <div className="info-section">
            <h3 className="info-subtitle">Canvas 2D API</h3>
            <ul className="info-list">
              <li>High-level drawing API</li>
              <li>Easy to use for 2D graphics</li>
              <li>Good for simple drawings</li>
              <li>CPU-based rendering</li>
            </ul>
          </div>
          <div className="info-section">
            <h3 className="info-subtitle">WebGL</h3>
            <ul className="info-list">
              <li>Low-level GPU API</li>
              <li>Requires shaders and buffers</li>
              <li>Better for complex scenes</li>
              <li>GPU-accelerated rendering</li>
            </ul>
          </div>
          <div className="info-section">
            <h3 className="info-subtitle">When to Use Each</h3>
            <ul className="info-list">
              <li><strong>Canvas 2D:</strong> Simple 2D graphics, charts, basic animations</li>
              <li><strong>WebGL:</strong> Complex 3D graphics, games, large datasets, particle systems</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WhiteboardComparison;
