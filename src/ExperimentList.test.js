import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ExperimentList from './ExperimentList';

describe('ExperimentList', () => {
  test('should display available experiments as boxes with images and names on top', () => {
    render(
      <BrowserRouter>
        <ExperimentList />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: /experiments/i })).toBeInTheDocument();

    const counterLink = screen.getByRole('link', { name: /counter/i });
    expect(counterLink).toBeInTheDocument();

    const counterImage = screen.getByAltText(/counter/i);
    expect(counterImage).toBeInTheDocument();
    expect(counterImage).toHaveAttribute('src');
  });
});
