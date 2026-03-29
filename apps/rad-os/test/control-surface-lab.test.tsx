import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ControlSurfaceLabApp } from '@/components/apps/ControlSurfaceLabApp';

describe('ControlSurfaceLabApp', () => {
  it('renders compare panes and switches scenario groups', async () => {
    const user = userEvent.setup();

    render(<ControlSurfaceLabApp windowId="control-lab" />);

    expect(screen.getByText('Legacy Reference')).toBeInTheDocument();
    expect(screen.getByText('RDNA Target')).toBeInTheDocument();
    expect(screen.getAllByText('Color Picker')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Annotations' }));

    expect(screen.getAllByText('Annotation Composer')).toHaveLength(2);
    expect(screen.queryByText('Color Picker')).not.toBeInTheDocument();
  });
});
