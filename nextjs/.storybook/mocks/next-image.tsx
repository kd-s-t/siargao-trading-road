import React from 'react';

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

const Image = ({ src, alt, width, height, style, ...props }: ImageProps) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      style={style}
      {...props}
    />
  );
};

export default Image;

