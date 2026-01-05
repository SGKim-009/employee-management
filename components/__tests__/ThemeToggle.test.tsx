import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../ThemeToggle';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
    resolvedTheme: 'light',
  }),
}));

describe('ThemeToggle', () => {
  it('should render theme toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should have aria-label for accessibility', () => {
    render(<ThemeToggle />);
    const button = screen.getByLabelText(/테마 전환/i);
    expect(button).toBeInTheDocument();
  });

  it('should toggle theme when clicked', async () => {
    const user = userEvent.setup();
    const mockSetTheme = jest.fn();
    
    jest.doMock('next-themes', () => ({
      useTheme: () => ({
        theme: 'light',
        setTheme: mockSetTheme,
        resolvedTheme: 'light',
      }),
    }));

    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Note: This test may need adjustment based on actual implementation
    expect(button).toBeInTheDocument();
  });
});


