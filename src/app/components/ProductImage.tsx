// components/ProductImage.tsx
import Image from 'next/image';
import { SyntheticEvent } from 'react';

export default function ProductImage({ 
  src, 
  alt,
  width = 300,
  height = 200,
  className = ''
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const imageUrl = src.startsWith('/uploads') 
    ? `https://ollanbackend.vercel.app${src}`
    : src;

  const handleError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/placeholder.png';
  };

  return (
    <div className={`relative ${className}`}>
      <Image
        src={imageUrl}
        alt={alt}
        width={width}
        height={height}
        className="object-contain"
        onError={handleError}
        unoptimized={process.env.NODE_ENV !== 'production'}
      />
    </div>
  );
}