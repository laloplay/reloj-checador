export function Logo({ size = 'md', className = '' }) {
  const sizeMap = {
    xs: 'w-9 h-9 sm:w-10 sm:h-10',
    sm: 'w-12 h-12 sm:w-14 sm:h-14',
    header: 'h-auto w-32 lg:w-40 xl:w-44',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
  };
  const sizeClass = sizeMap[size] || sizeMap.md;
  return (
    <img
      src="https://i.postimg.cc/wvfqWVVS/LGO-SVG.png"
      alt="UNIFAM"
      draggable={false}
      className={`${sizeClass} select-none object-contain ${className}`}
    />
  );
}