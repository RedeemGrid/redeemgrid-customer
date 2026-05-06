import { useState } from 'react';
import { Tag } from 'lucide-react';
import offerPlaceholder from '../assets/offer_placeholder.png';

/**
 * SafeImage Component
 * Handles image loading states, errors, and missing sources gracefully
 * with a branded Tróvea placeholder.
 */
import type { ReactNode } from 'react';

interface SafeImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  placeholder?: ReactNode;
  text?: string;
  iconSize?: number;
}

const SafeImage = ({ src, alt, className, placeholder, text = "Tróvea Deal", iconSize = 40 }: SafeImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full">
      {/* Loading Placeholder (only if src exists and is not yet loaded/errored) */}
      {!loaded && !error && src && placeholder}

      {/* Branded Fallback (if error OR missing src) */}
      {(error || !src) && (
        <div className="w-full h-full relative overflow-hidden bg-neutral-100">
          <img 
            src={offerPlaceholder} 
            alt="Tróvea Placeholder" 
            className="w-full h-full object-cover opacity-60 grayscale-[0.5]" 
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5">
            <Tag size={iconSize} strokeWidth={1} className="text-brand-primary opacity-20 mb-2" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary opacity-30">
              {text}
            </p>
          </div>
        </div>
      )}

      {/* Actual Image */}
      {src && !error && (
        <img 
          src={src} 
          alt={alt} 
          className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500 absolute inset-0`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
};

export default SafeImage;

