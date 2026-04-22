interface NexitLogoProps {
  className?: string;
  textClassName?: string;
}

export default function NexitLogo({ className = '', textClassName = '' }: NexitLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon mark */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#F47B20" />
        <path
          d="M8 24V8l8 10.5L24 8v16"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M8 16h16"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
      {/* Wordmark */}
      <span className={`font-sora font-bold tracking-wide ${textClassName}`}>
        <span className="text-nexit-orange">Nex</span>
        <span>IT</span>
      </span>
    </div>
  );
}
