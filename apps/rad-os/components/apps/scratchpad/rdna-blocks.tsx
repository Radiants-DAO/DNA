'use client';

import { createReactBlockSpec } from '@blocknote/react';
import { Alert } from '@rdna/radiants/components/core';

/**
 * RDNA Alert block — renders an RDNA Alert component as an editable block.
 *
 * Insert via the slash menu ("/Alert"). Editable content sits inside
 * Alert.Content; Alert.Icon renders the variant-appropriate icon.
 */
export const alertBlock = createReactBlockSpec(
  {
    type: 'alert' as const,
    propSchema: {
      variant: {
        default: 'info' as const,
        values: ['default', 'info', 'success', 'warning', 'error'] as const,
      },
    },
    content: 'inline' as const,
  },
  {
    render: ({ block, contentRef }) => {
      const variant = block.props.variant;
      return (
        <Alert.Root variant={variant} className="my-1">
          <Alert.Icon />
          <Alert.Content className="flex-1 min-w-0">
            <div ref={contentRef} />
          </Alert.Content>
        </Alert.Root>
      );
    },
  },
);
