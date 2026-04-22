import React from 'react';

interface StatusBadgeProps {
  status: 'Completed' | 'In Progress' | 'Not Started';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const styles = {
    'Completed': 'bg-green-100 text-green-700',
    'In Progress': 'bg-amber-100 text-amber-700',
    'Not Started': 'bg-gray-100 text-gray-600',
  };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${styles[status]}`}>
      {status}
    </span>
  );
};
