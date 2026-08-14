"use client";

import NextImage, { type ImageProps as NextImageProps } from "next/image";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const FALLBACK_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23F5F5F5'/%3E%3Cpath d='M170 160h60v60h-60z' fill='%23E5E5EA'/%3E%3Cpath d='M155 220l30-30 20 20 30-40 40 50H155z' fill='%23D1D1D6'/%3E%3C/svg%3E";

export interface ImageProps extends Omit<NextImageProps, "src"> {
  src?: string | null;
  fallback?: string;
  aspectRatio?: "1/1" | "4/3" | "3/4" | "16/9";
  containerClassName?: string;
}

const aspectRatioClasses: Record<string, string> = {
  "1/1": "aspect-square",
  "4/3": "aspect-[4/3]",
  "3/4": "aspect-[3/4]",
  "16/9": "aspect-video",
};

function shouldUnoptimize(src: string): boolean {
  return src.includes("placehold.co") || src.startsWith("data:");
}

export function Image({
  src,
  alt,
  fallback = FALLBACK_SRC,
  aspectRatio,
  containerClassName,
  className,
  fill,
  ...props
}: ImageProps) {
  const [imgSrc, setImgSrc] = useState<string>(src ?? fallback);
  const [hasError, setHasError] = useState(!src);

  useEffect(() => {
    if (src) {
      setImgSrc(src);
      setHasError(false);
    } else {
      setImgSrc(fallback);
      setHasError(true);
    }
  }, [src, fallback]);

  const unoptimized = shouldUnoptimize(imgSrc);

  if (aspectRatio) {
    return (
      <div
        className={cn(
          "relative overflow-hidden",
          aspectRatioClasses[aspectRatio],
          containerClassName
        )}
      >
        <NextImage
          {...props}
          src={hasError ? fallback : imgSrc}
          alt={alt}
          fill
          unoptimized={unoptimized}
          className={cn("object-cover", className)}
          onError={() => {
            setHasError(true);
            setImgSrc(fallback);
          }}
          placeholder="blur"
          blurDataURL={FALLBACK_SRC}
        />
      </div>
    );
  }

  if (fill) {
    return (
      <NextImage
        {...props}
        src={hasError ? fallback : imgSrc}
        alt={alt}
        fill
        unoptimized={unoptimized}
        className={cn("object-cover", className)}
        onError={() => {
          setHasError(true);
          setImgSrc(fallback);
        }}
        placeholder="blur"
        blurDataURL={FALLBACK_SRC}
      />
    );
  }

  return (
    <NextImage
      {...props}
      src={hasError ? fallback : imgSrc}
      alt={alt}
      unoptimized={unoptimized}
      className={className}
      onError={() => {
        setHasError(true);
        setImgSrc(fallback);
      }}
      placeholder="blur"
      blurDataURL={FALLBACK_SRC}
    />
  );
}
