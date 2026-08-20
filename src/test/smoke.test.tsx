import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

function TestPage() {
  return (
    <main>
      <h1>Story Feature</h1>
      <p>测试环境已经就绪。</p>
    </main>
  );
}

describe('test baseline', () => {
  it('renders a React component in jsdom', () => {
    render(<TestPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Story Feature',
      }),
    ).toBeInTheDocument();

    expect(screen.getByText('测试环境已经就绪。')).toBeInTheDocument();
  });
});
