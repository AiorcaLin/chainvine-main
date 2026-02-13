interface IconProps {
  className?: string;
}

// ChainVine SVG Logo — uses currentColor for theme-adaptive rendering
export const ChainVineLogo: React.FC<IconProps & { size?: number }> = ({ className, size = 32 }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Chain link (left) */}
    <path
      d="M8 10C8 7.79 9.79 6 12 6h2a2 2 0 0 1 0 4h-2v4h2a2 2 0 0 1 0 4h-2c-2.21 0-4-1.79-4-4V10Z"
      fill="currentColor" opacity="0.85"
    />
    {/* Chain link (right) */}
    <path
      d="M24 22c0 2.21-1.79 4-4 4h-2a2 2 0 0 1 0-4h2v-4h-2a2 2 0 0 1 0-4h2c2.21 0 4 1.79 4 4v4Z"
      fill="currentColor" opacity="0.85"
    />
    {/* Vine connector */}
    <path d="M14 14c2-3 4-3 6-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    {/* Vine leaf accent */}
    <path d="M22 9c-1.5 0-3 1-3 3 2 0 3.5-1 3-3Z" fill="currentColor" opacity="0.5"/>
    {/* Shield outline (security) */}
    <path
      d="M16 2L6 7v5c0 7.73 4.66 14.15 10 16 5.34-1.85 10-8.27 10-16V7L16 2Z"
      stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" opacity="0.3"
    />
  </svg>
);

export const SecurityIcon: React.FC<IconProps> = ({ className }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M12 2L3 7V12C3 16.97 7.02 21.5 12 22C16.98 21.5 21 16.97 21 12V7L12 2ZM12 20C8.13 19.57 5 15.87 5 12V8.26L12 4.3L19 8.26V12C19 15.87 15.87 19.57 12 20Z" 
        fill="currentColor"
      />
    </svg>
  );
};

export function GasIcon() {
  return <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
}

export function CodeIcon({ className }: IconProps) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" 
      />
    </svg>
  );
}

export function AIIcon({ className }: IconProps) {
  return (
    <svg 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
      />
    </svg>
  );
}

export function ComplianceIcon() {
  return <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
}

export function ReportIcon() {
  return <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
}

export const WalletIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

export const FileIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export const FilesIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
  </svg>
);

export const SecurityAnalysisIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export const MultiChainIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    className={className}
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

