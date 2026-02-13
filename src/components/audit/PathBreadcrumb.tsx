interface PathBreadcrumbProps {
  path: string;
}

export default function PathBreadcrumb({ path }: PathBreadcrumbProps) {
  // Remove proxy/ or implementation/ prefix
  const cleanPath = path.replace(/^(proxy|implementation)\//, '');
  
  return (
    <span className="text-[#CCCCCC] opacity-70" title={cleanPath}>
      {cleanPath}
    </span>
  );
} 