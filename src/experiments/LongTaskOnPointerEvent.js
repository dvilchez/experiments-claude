import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import './LongTaskOnPointerEvent.css';

export default function PointerPerformanceLab() {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [expensiveMs, setExpensiveMs] = useState(0);
  const [workType, setWorkType] = useState('sync');
  const [fps, setFps] = useState(60);
  const [eventCount, setEventCount] = useState(0);
  const [lastEventTime, setLastEventTime] = useState(0);
  const [avgEventDelay, setAvgEventDelay] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [longTasks, setLongTasks] = useState(0);
  
  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const eventDelays = useRef([]);
  const lastPointerTime = useRef(0);
  const drawPathRef = useRef([]);
  const eventBuffer = useRef([]);
  const rafPending = useRef(false);

  // Expensive operation simulator
  const doExpensiveWork = (ms) => {
    const start = performance.now();
    while (performance.now() - start < ms) {
      // Busy loop - blocks main thread
      Math.sqrt(Math.random());
    }
  };

  // FPS Counter
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

  // Long Tasks Observer
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          setLongTasks(prev => prev + entries.length);
        });
        observer.observe({ entryTypes: ['longtask'] });
        return () => observer.disconnect();
      } catch (e) {
        console.log('Long Tasks API not available');
      }
    }
  }, []);

  const handleExpensiveWork = () => {
    if (expensiveMs === 0) return;

    switch (workType) {
      case 'sync':
        // Blocks main thread immediately
        doExpensiveWork(expensiveMs);
        break;
      
      case 'microtask':
        // Runs before next render but after current task
        Promise.resolve().then(() => {
          doExpensiveWork(expensiveMs);
        });
        break;
      
      case 'task':
        // Defers to next task (allows render between)
        setTimeout(() => {
          doExpensiveWork(expensiveMs);
        }, 0);
        break;
      
      case 'raf':
        // Runs right before next paint
        requestAnimationFrame(() => {
          doExpensiveWork(expensiveMs);
        });
        break;
    }
  };

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Get display coordinates
    const displayX = e.clientX - rect.left;
    const displayY = e.clientY - rect.top;

    // Scale to canvas internal coordinates
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: displayX * scaleX,
      y: displayY * scaleY
    };
  };

  const processBufferedEvents = () => {
    const events = eventBuffer.current;
    if (events.length === 0) {
      rafPending.current = false;
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    events.forEach(e => {
      const now = performance.now();
      const delay = now - lastPointerTime.current;

      eventDelays.current.push(delay);
      if (eventDelays.current.length > 30) {
        eventDelays.current.shift();
      }
      const avg = eventDelays.current.reduce((a, b) => a + b, 0) / eventDelays.current.length;
      setAvgEventDelay(Math.round(avg));
      setLastEventTime(Math.round(delay));
      setEventCount(prev => prev + 1);

      lastPointerTime.current = now;

      const coalescedEvents = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];

      coalescedEvents.forEach(event => {
        const coords = getCoords(event);
        const lastPoint = drawPathRef.current[drawPathRef.current.length - 1];

        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.strokeStyle = expensiveMs > 0 ? '#ef4444' : '#3b82f6';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();

        drawPathRef.current.push(coords);
      });
    });

    if (expensiveMs > 0) {
      doExpensiveWork(expensiveMs);
    }

    eventBuffer.current = [];
    rafPending.current = false;
  };

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const coords = getCoords(e);
    drawPathRef.current = [coords];
    lastPointerTime.current = performance.now();
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;

    if (workType === 'batched') {
      eventBuffer.current.push(e);

      if (!rafPending.current) {
        rafPending.current = true;
        requestAnimationFrame(processBufferedEvents);
      }
      return;
    }

    const now = performance.now();
    const delay = now - lastPointerTime.current;

    eventDelays.current.push(delay);
    if (eventDelays.current.length > 30) {
      eventDelays.current.shift();
    }
    const avg = eventDelays.current.reduce((a, b) => a + b, 0) / eventDelays.current.length;
    setAvgEventDelay(Math.round(avg));
    setLastEventTime(Math.round(delay));
    setEventCount(prev => prev + 1);

    lastPointerTime.current = now;

    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    events.forEach(event => {
      const coords = getCoords(event);
      const lastPoint = drawPathRef.current[drawPathRef.current.length - 1];

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = expensiveMs > 0 ? '#ef4444' : '#3b82f6';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      drawPathRef.current.push(coords);
    });

    handleExpensiveWork();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    drawPathRef.current = [];
    eventBuffer.current = [];
    handleExpensiveWork();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setEventCount(0);
    setLongTasks(0);
    eventDelays.current = [];
    eventBuffer.current = [];
  };

  const getFpsColor = () => {
    if (fps >= 55) return 'text-green-600';
    if (fps >= 45) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getDelayColor = () => {
    if (avgEventDelay <= 16) return 'text-green-600';
    if (avgEventDelay <= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="pointer-lab-container">
      <div className="pointer-lab-content">
        <div className="pointer-lab-card">
          <h1 className="pointer-lab-title">
            🎨 Pointer Events Performance Lab
          </h1>
          <p className="pointer-lab-description">
            Draw on the canvas and watch how expensive operations affect performance
          </p>

          <div className="controls-grid">
            <div className="control-group">
              <label>
                Expensive Work Duration: {expensiveMs}ms
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={expensiveMs}
                onChange={(e) => setExpensiveMs(Number(e.target.value))}
              />
              <div className="range-labels">
                <span>0ms (smooth)</span>
                <span>50ms (long task)</span>
                <span>100ms (very janky)</span>
              </div>
            </div>

            <div className="control-group">
              <label>
                Work Type
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value)}
              >
                <option value="sync">Synchronous (blocks immediately)</option>
                <option value="microtask">Microtask (Promise)</option>
                <option value="task">Task (setTimeout)</option>
                <option value="raf">requestAnimationFrame</option>
                <option value="batched">Batched (multiple events per task)</option>
              </select>
              <p className="control-help">
                {workType === 'sync' && 'Blocks rendering immediately - most janky'}
                {workType === 'microtask' && 'Runs before render - still blocks'}
                {workType === 'task' && 'Allows render between - less janky'}
                {workType === 'raf' && 'Runs before paint - blocks that frame'}
                {workType === 'batched' && 'Groups events in rAF - multiple events per task'}
              </p>
            </div>
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
              <div className="metric-label">Avg Delay</div>
              <div className={`metric-value ${getDelayColor()}`}>
                {avgEventDelay}ms
              </div>
              <div className="metric-target">
                Target: &lt;16ms
              </div>
            </div>

            <div className="metric-card metric-card-green">
              <div className="metric-label">Last Event</div>
              <div className="metric-value text-gray-700">
                {lastEventTime}ms
              </div>
              <div className="metric-target">
                Time between
              </div>
            </div>

            <div className="metric-card metric-card-yellow">
              <div className="metric-label">Events</div>
              <div className="metric-value text-gray-700">
                {eventCount}
              </div>
              <div className="metric-target">
                Total fired
              </div>
            </div>

            <div className="metric-card metric-card-red">
              <div className="metric-label">Long Tasks</div>
              <div className="metric-value text-red-600">
                {longTasks}
              </div>
              <div className="metric-target">
                &gt;50ms tasks
              </div>
            </div>
          </div>

          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              width={800}
              height={500}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
            />
            {expensiveMs > 0 && (
              <div className="canvas-warning">
                ⚠️ Expensive work: {expensiveMs}ms ({workType})
              </div>
            )}
          </div>

          <button
            onClick={clearCanvas}
            className="clear-button"
          >
            <RotateCcw size={20} />
            Clear Canvas & Reset Metrics
          </button>
        </div>

        <div className="instructions-card">
          <h2 className="instructions-title">
            📊 How to Use This Lab
          </h2>
          <ol className="instructions-list">
            <li><strong>1. Start with 0ms:</strong> Draw smoothly, notice 60 FPS and low delays</li>
            <li><strong>2. Set to 20ms:</strong> Still okay, events happen every ~20ms</li>
            <li><strong>3. Set to 50ms+:</strong> Long tasks! Watch FPS drop and drawing lag</li>
            <li><strong>4. Try different work types:</strong> See how microtasks vs tasks affect rendering</li>
            <li><strong>5. Watch the metrics:</strong> Red numbers = performance problems!</li>
          </ol>
          <div className="insights-box">
            <strong className="insights-title">💡 Key Insights:</strong>
            <ul className="insights-list">
              <li>• Synchronous work blocks everything (worst)</li>
              <li>• Microtasks block rendering too (they run before render)</li>
              <li>• setTimeout allows rendering between events (better)</li>
              <li>• Long tasks (>50ms) are detected and counted</li>
              <li>• Below 60 FPS = dropped frames = janky experience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}