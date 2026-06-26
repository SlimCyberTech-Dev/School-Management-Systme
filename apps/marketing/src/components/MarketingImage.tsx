type MarketingImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
};

export function MarketingImage({ src, alt, priority = false, className = "" }: MarketingImageProps) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-muted ring-1 ring-border ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="h-full w-full object-cover object-center"
      />
    </div>
  );
}
