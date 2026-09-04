import Image from 'next/image';

interface NexitLogoProps {
  className?: string;
  textClassName?: string;
  height?: number;
}

export default function NexitLogo({ className = '', textClassName = '', height = 36 }: NexitLogoProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Image
        src="/nexit-logo-icon.svg"
        alt=""
        height={height}
        width={height}
        priority
      />
      <span className={`font-sora font-bold tracking-wide ${textClassName}`}>
        <span className="text-nexit-orange">Nex</span>
        <span>IT</span>
      </span>
    </div>
  );
}
