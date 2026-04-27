import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Section } from '../layout/Section/Section';

describe('Section', () => {
  afterEach(cleanup);

  it('can keep its panel mounted while collapsed', () => {
    render(
      <Section title="Layers" keepMounted>
        <div data-testid="panel-content">Layer controls</div>
      </Section>,
    );

    fireEvent.click(screen.getByRole('button', { name: /layers/i }));

    expect(screen.getByTestId('panel-content')).toBeInTheDocument();
    expect(screen.getByTestId('panel-content').parentElement).toHaveAttribute('hidden');
  });
});
