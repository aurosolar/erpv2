import React from 'react';
import { LucideIcon } from 'lucide-react';

interface BentoCardProps {
  title: string;
  icon: LucideIcon;
  statusColor?: 'green' | 'yellow' | 'red' | 'gray';
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function BentoCard({ title, icon: Icon, statusColor = 'gray', children, className = '', action }: BentoCardProps) {
  const colorMap = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    gray: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  const iconColorMap = {
    green: 'text-emerald-500',
    yellow: 'text-amber-500',
    red: 'text-rose-500',
    gray: 'text-slate-500'
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${colorMap[statusColor]}`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColorMap[statusColor]}`} />
          <h3 className="font-semibold text-sm uppercase tracking-wider">{title}</h3>
        </div>
        {action && <div>{action}</div>}
      </div>
      
      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
