import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App routing', () => {
  test('should show experiment list on home page and navigate to experiment when clicked', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /experiments/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /counter/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: /counter/i }));

    expect(screen.getByRole('heading', { name: /counter experiment/i })).toBeInTheDocument();
  });
});
