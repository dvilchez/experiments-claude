import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import ExperimentList from './ExperimentList';
import Counter from './experiments/Counter';

function App() {
  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <div className="App">
        <Routes>
          <Route path="/" element={<ExperimentList />} />
          <Route path="/experiment/counter" element={<Counter />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
