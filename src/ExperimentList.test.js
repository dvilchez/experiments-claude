import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExperimentList from './ExperimentList';

describe('ExperimentList', () => {
  test('should display available experiments as clickable links', () => {
    render(
      <BrowserRouter>
        <ExperimentList />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /experiments/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /counter/i })).toBeInTheDocument();
  });
});
