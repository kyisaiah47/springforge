import { cn } from "@/lib/utils";

interface OrbitalLogoProps {
  size?: number;
  className?: string;
}

export function OrbitalLogo({ size = 20, className }: OrbitalLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-current", className)}
    >
      <circle cx="32" cy="32" r="22" stroke="currentColor" strokeWidth="4" fill="none"/>
      <ellipse cx="32" cy="32" rx="28" ry="12" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.7" transform="rotate(60 32 32)"/>
      <ellipse cx="32" cy="32" rx="28" ry="12" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.5" transform="rotate(-60 32 32)"/>
      <ellipse cx="32" cy="32" rx="16" ry="8" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.4" transform="rotate(120 32 32)"/>
      <circle cx="32" cy="32" r="5" fill="currentColor"/>
      <circle cx="54" cy="32" r="4" fill="currentColor"/>
      <circle cx="10" cy="32" r="3" fill="currentColor"/>
      <circle cx="48" cy="16" r="2.5" fill="currentColor" opacity="0.8"/>
      <circle cx="16" cy="48" r="2.5" fill="currentColor" opacity="0.8"/>
      <circle cx="48" cy="48" r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="16" cy="16" r="2" fill="currentColor" opacity="0.6"/>
    </svg>
  );
}