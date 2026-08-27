export function WpImage({ src, alt = "", className = "", ...props }) {
  if (!src) return <span className={`image-placeholder ${className}`} />;
  return <img className={className} src={src} alt={alt} loading="lazy" decoding="async" {...props} />;
}
