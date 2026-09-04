import Image from 'next/image';

interface NexitLogoProps {
  className?: string;
  /** Use the white-wordmark variant — for dark backgrounds such as the app header. */
  variant?: 'dark' | 'light';
  /** Rendered height in px. Width scales automatically (logo aspect ratio ≈ 3.12:1). */
  height?: number;
}

const ASPECT = 720 / 231;

export default function NexitLogo({
  className = '',
  variant = 'dark',
  height = 34,
}: NexitLogoProps) {
  return (
    <Image
      src={variant === 'light' ? '/nexit-logo-light.png' : '/nexit-logo.png'}
      alt="NexIT Solutions"
      height={height}
      width={Math.round(height * ASPECT)}
      className={className}
      priority
    />
  );
}
