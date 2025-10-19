import { Link } from 'react-router-dom';

function ExperimentList() {
  return (
    <div>
      <h1>Experiments</h1>
      <Link to="/experiment/counter">Counter</Link>
    </div>
  );
}

export default ExperimentList;
