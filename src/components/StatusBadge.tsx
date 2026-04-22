type Status = 'pending' | 'signed' | 'paid';

const CONFIG: Record<Status, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800',
  },
  signed: {
    label: 'Signed',
    className: 'bg-blue-100 text-blue-800',
  },
  paid: {
    label: 'Paid',
    className: 'bg-emerald-100 text-emerald-800',
  },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const cfg = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.className} ${className}`}
    >
      {cfg.label}
    </span>
  );
}
