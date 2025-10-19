import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import ExperimentList from './ExperimentList';
import Counter from './experiments/Counter';
import LongTaskOnPointerEvent from './experiments/LongTaskOnPointerEvent';
import WhiteboardComparison from './experiments/WhiteboardComparison';

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <div className="App">
        <Routes>
          <Route path="/" element={<ExperimentList />} />
          <Route path="/experiment/counter" element={<Counter />} />
          <Route path="/experiment/longtaskonpointerevents" element={<LongTaskOnPointerEvent />} />
          <Route path="/experiment/whiteboardcomparison" element={<WhiteboardComparison />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
