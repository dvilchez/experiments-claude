import { Link } from 'react-router-dom';
import './ExperimentList.css';

function ExperimentList() {
  const experiments = [
    {
      name: 'Counter',
      path: '/experiment/counter',
      imageUrl: 'https://picsum.photos/seed/counter/300/200'
    },
        {
      name: 'Long task on pointer events',
      path: '/experiment/longtaskonpointerevents',
      imageUrl: 'https://picsum.photos/seed/longtaskonpointerevents/300/200'
    },
    {
      name: 'Canvas 2D vs WebGL Whiteboard',
      path: '/experiment/whiteboardcomparison',
      imageUrl: 'https://picsum.photos/seed/whiteboardcomparison/300/200'
    }
  ];

  return (
    <div className="experiment-list-container">
      <h1>Experiments</h1>
      <div className="experiment-grid">
        {experiments.map((experiment) => (
          <Link
            key={experiment.name}
            to={experiment.path}
            className="experiment-box"
          >
            <h2 className="experiment-name">{experiment.name}</h2>
            <img
              src={experiment.imageUrl}
              alt={experiment.name}
              className="experiment-image"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ExperimentList;
