import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WhiteboardComparison from './WhiteboardComparison';

test('renders whiteboard comparison experiment', () => {
  render(<WhiteboardComparison />);
  const titleElement = screen.getByText(/Whiteboard/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders rendering mode selector', () => {
  render(<WhiteboardComparison />);
  const selector = screen.getByLabelText(/rendering mode/i);
  expect(selector).toBeInTheDocument();
});

test('renders canvas element', () => {
  render(<WhiteboardComparison />);
  const canvas = screen.getByRole('img');
  expect(canvas).toBeInTheDocument();
  expect(canvas.tagName).toBe('CANVAS');
});

test('renders clear button', () => {
  render(<WhiteboardComparison />);
  const clearButton = screen.getByRole('button', { name: /clear/i });
  expect(clearButton).toBeInTheDocument();
});

test('allows switching between Canvas and WebGL modes', () => {
  render(<WhiteboardComparison />);
  const selector = screen.getByLabelText(/rendering mode/i);

  expect(selector.value).toBe('canvas');

  userEvent.selectOptions(selector, 'webgl');
  expect(selector.value).toBe('webgl');
});
