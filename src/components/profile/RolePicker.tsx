'use client';

import { ROLE_OPTIONS } from '@/lib/constants';
import type { UserRole } from '@/lib/types';

type RolePickerProps = {
  value: UserRole | null;
  onChange: (role: UserRole) => void;
  className?: string;
};

export default function RolePicker({ value, onChange, className = '' }: RolePickerProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      {ROLE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`card-elevated p-4 text-left transition-all duration-150 hover:shadow-lift cursor-pointer ${
            value === opt.value
              ? 'border-primary border-2 bg-primary/5'
              : 'hover:border-primary/30'
          }`}
        >
          <div className="text-2xl mb-2" aria-hidden>
            {opt.emoji}
          </div>
          <h3 className="font-bold text-sm">{opt.label}</h3>
          <p className="text-xs text-neutral/60 mt-1">{opt.description}</p>
        </button>
      ))}
    </div>
  );
}
