import type { SVGProps } from 'react';

export function ChronoSimIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <title>ChronoSim Logo</title>
      <path d="M21.5 12a9.5 9.5 0 1 1-9.5-9.5" fill="hsl(var(--primary))" />
      <path d="M12 2v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="M22 12h-2" />
      <path d="m19.07 4.93-1.41 1.41" />
      <path d="M12 12v6" />
      <path d="M12 12 7.5 7.5" />
    </svg>
  );
}
