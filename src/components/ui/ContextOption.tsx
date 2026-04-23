import React, { memo } from 'react';

interface ContextOptionProps {
  id: string;
  label: string;
  desc: string;
  isSelected: boolean;
  onClick: () => void;
}

export const ContextOption: React.FC<ContextOptionProps> = memo(({
  id,
  label,
  desc,
  isSelected,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={isSelected}
    aria-describedby={`${id}-desc`}
    className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98] ${
      isSelected
        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
        : 'border-gray-100 hover:border-blue-200'
    }`}
  >
    <div className="font-bold text-gray-900">{label}</div>
    <div id={`${id}-desc`} className="text-sm text-gray-500">
      {desc}
    </div>
  </button>
));

ContextOption.displayName = 'ContextOption';
