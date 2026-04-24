type Status = 'pending' | 'signed' | 'paid' | 'voided';

const CONFIG: Record<Status, { label: string; className: string }> = {
  pending:  { label: 'Pending',  className: 'bg-amber-100 text-amber-800' },
  signed:   { label: 'Signed',   className: 'bg-blue-100 text-blue-800' },
  paid:     { label: 'Paid',     className: 'bg-emerald-100 text-emerald-800' },
  voided:   { label: 'Voided',   className: 'bg-gray-200 text-gray-500 line-through' },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className} ${className}`}>
      {cfg.label}
    </span>
  );
}
