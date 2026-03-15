import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page for signed-out users', () => {
  render(<App />);
  expect(screen.getByText(/sign in to careflow/i)).toBeInTheDocument();
});
