'use client';

import React, { useState, useRef, useEffect, useId, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  /** Available options */
  options: SelectOption[];
  /** Currently selected value */
  value?: string;
  /** Placeholder text when no value selected */
  placeholder?: string;
  /** Change handler */
  onChange?: (value: string) => void;
  /** Disabled state */
  disabled?: boolean;
  /** Error state */
  error?: boolean;
  /** Full width */
  fullWidth?: boolean;
  /** Additional classes */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Custom select/dropdown with retro styling
 */
export function Select({
  options,
  value,
  placeholder = 'Select…',
  onChange,
  disabled = false,
  error = false,
  fullWidth = false,
  className = '',
  'aria-label': ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const labelId = useId();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = options.findIndex(opt => opt.value === value);
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, options, value]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = useCallback((optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          const option = options[highlightedIndex];
          if (option && !option.disabled) {
            handleSelect(option.value);
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => {
            let next = prev + 1;
            while (next < options.length && options[next].disabled) {
              next++;
            }
            return next < options.length ? next : prev;
          });
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex(prev => {
            let next = prev - 1;
            while (next >= 0 && options[next].disabled) {
              next--;
            }
            return next >= 0 ? next : prev;
          });
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Home':
        e.preventDefault();
        if (isOpen) {
          const firstEnabled = options.findIndex(opt => !opt.disabled);
          if (firstEnabled >= 0) setHighlightedIndex(firstEnabled);
        }
        break;
      case 'End':
        e.preventDefault();
        if (isOpen) {
          for (let i = options.length - 1; i >= 0; i--) {
            if (!options[i].disabled) {
              setHighlightedIndex(i);
              break;
            }
          }
        }
        break;
    }
  }, [disabled, isOpen, highlightedIndex, options, handleSelect]);

  return (
    <div
      ref={containerRef}
      className={`relative ${fullWidth ? 'w-full' : 'w-fit'} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : labelId}
        className={`
          flex items-center justify-between gap-2
          w-full h-10 px-3
          font-alfacad text-base
          bg-white text-black
          border border-black rounded-none
          ${error ? 'ring-2 ring-accent-1' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'shadow-[4px_4px_0_0_black] -translate-y-0.5' : 'shadow-[2px_2px_0_0_black]'}
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2
        `}
      >
        <span className={selectedOption ? 'text-black' : 'text-neutral-neutral-3'}>
          {selectedOption?.label || placeholder}
        </span>
        <span className={`text-black text-xs ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
          className={`
            absolute z-50 top-full left-0 right-0 mt-1
            bg-white
            border border-black
            rounded-none
            shadow-[2px_2px_0_0_var(--color-black)]
            overflow-hidden
            max-h-60 overflow-y-auto
          `}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={option.value === value}
              aria-disabled={option.disabled}
              onClick={() => !option.disabled && handleSelect(option.value)}
              onMouseEnter={() => !option.disabled && setHighlightedIndex(index)}
              className={`
                w-full px-3 py-2
                font-alfacad text-base text-left
                ${option.value === value ? 'bg-green text-black' : 'text-black'}
                ${highlightedIndex === index && option.value !== value ? 'bg-neutral-neutral-1' : ''}
                ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Select;
