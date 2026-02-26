'use client';

import React from 'react';
import { Button } from '@rdna/radiants/components/core';
import { Icon } from '@/components/icons';

// ============================================================================
// Types
// ============================================================================

interface DataTableColumn<T> {
  /** Column header label */
  header: string;
  /** Key to access data (or render function) */
  accessor: keyof T | ((row: T) => React.ReactNode);
  /** Column width (CSS value or 'auto') */
  width?: string;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
}

interface DataTableAction<T> {
  /** Action label */
  label: string;
  /** Action handler */
  onClick: (row: T, index: number) => void;
  /** Icon name (optional) */
  icon?: string;
  /** Variant for styling */
  variant?: 'default' | 'danger';
  /** Conditionally show action */
  show?: (row: T) => boolean;
}

interface DataTableProps<T> {
  /** Array of data rows */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Row actions (buttons on right side) */
  actions?: DataTableAction<T>[];
  /** Unique key accessor for each row */
  keyAccessor: keyof T | ((row: T, index: number) => string);
  /** Empty state message */
  emptyMessage?: string;
  /** Header background color variant */
  headerVariant?: 'default' | 'cream' | 'yellow';
  /** Show row dividers */
  showDividers?: boolean;
  /** Compact mode (smaller padding) */
  compact?: boolean;
  /** Additional classes */
  className?: string;
}

// ============================================================================
// Styles
// ============================================================================

const headerVariantStyles = {
  default: 'bg-surface-elevated',
  cream: 'bg-surface-primary',
  yellow: 'bg-sun-yellow',
};

// ============================================================================
// Component
// ============================================================================

/**
 * DataTable component for displaying tabular data with actions
 *
 * Features:
 * - Flexible column definitions
 * - Row actions (edit, delete, etc.)
 * - Header variants
 * - Empty state
 * - Compact mode
 */
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  actions = [],
  keyAccessor,
  emptyMessage = 'No data available',
  headerVariant = 'cream',
  showDividers = true,
  compact = false,
  className = '',
}: DataTableProps<T>) {
  const getRowKey = (row: T, index: number): string => {
    if (typeof keyAccessor === 'function') {
      return keyAccessor(row, index);
    }
    return String(row[keyAccessor]);
  };

  const getCellValue = (
    row: T,
    accessor: DataTableColumn<T>['accessor']
  ): React.ReactNode => {
    if (typeof accessor === 'function') {
      return accessor(row);
    }
    return row[accessor] as React.ReactNode;
  };

  const cellPadding = compact ? 'px-2 py-1' : 'px-3 py-2';
  const fontSize = compact ? 'text-sm' : 'text-sm';

  // Empty state
  if (data.length === 0) {
    return (
      <div
        className={`
          p-8 text-center
          bg-surface-primary border border-edge-primary rounded-md
          ${className}
        `}
      >
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`
        border border-edge-primary rounded-md overflow-hidden
        bg-surface-primary
        ${className}
      `}
    >
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className={`${headerVariantStyles[headerVariant]} border-b border-edge-primary`}>
            {columns.map((column, i) => (
              <th
                key={i}
                className={`
                  ${cellPadding}
                  font-mondwest ${fontSize} text-content-primary
                  text-${column.align || 'left'}
                  ${i < columns.length - 1 && showDividers ? 'border-r border-edge-primary' : ''}
                `}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
            {actions.length > 0 && (
              <th
                className={`${cellPadding} font-mondwest ${fontSize} text-content-primary text-right`}
                style={{ width: 'auto' }}
              >
                Actions
              </th>
            )}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              className={`
                ${headerVariantStyles[headerVariant]}
                ${rowIndex < data.length - 1 ? 'border-b border-edge-primary' : ''}
                hover:bg-hover-overlay
              `}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`
                    ${cellPadding}
                    font-mondwest ${fontSize} text-content-primary
                    text-${column.align || 'left'}
                    ${colIndex < columns.length - 1 && showDividers ? 'border-r border-edge-primary' : ''}
                  `}
                >
                  {getCellValue(row, column.accessor)}
                </td>
              ))}
              {actions.length > 0 && (
                <td className={`${cellPadding} text-right`}>
                  <div className="flex items-center justify-end gap-1">
                    {actions
                      .filter((action) => !action.show || action.show(row))
                      .map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant={action.variant === 'danger' ? 'outline' : 'ghost'}
                          size="sm"
                          icon={action.icon ? <Icon name={action.icon} size={14} /> : undefined}
                          onClick={() => action.onClick(row, rowIndex)}
                          className={
                            action.variant === 'danger'
                              ? 'text-sun-red border-sun-red hover:bg-sun-red hover:text-content-inverted'
                              : ''
                          }
                        >
                          {action.label}
                        </Button>
                      ))}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
