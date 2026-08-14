'use client';

import type { ReactNode } from 'react';
import { controlLabelClass, controlRowClass, toggleBtnClass, toggleGroupClass } from './tokens';

/** Small uppercase control label used beside chart toggles. */
export function ControlLabel({ children }: { children: ReactNode }) {
  return <span className={controlLabelClass}>{children}</span>;
}

export interface ToggleOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Extra classes for this pill (rare - e.g. width tweaks). */
  extra?: string;
}

/**
 * A segmented pill toggle (the standard analysis chart control). Renders an
 * optional label + a rounded group of mutually-exclusive buttons.
 */
export default function ToggleGroup<T extends string>({
  label,
  ariaLabel,
  options,
  value,
  onChange,
}: {
  label?: string;
  ariaLabel?: string;
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={controlRowClass}>
      {label ? <ControlLabel>{label}</ControlLabel> : null}
      <div className={toggleGroupClass} role="group" aria-label={ariaLabel ?? label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={toggleBtnClass(value === o.value, o.extra)}
            aria-pressed={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
