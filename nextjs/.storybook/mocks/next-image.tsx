import React from 'react';

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
};

const Image = ({ src, alt, ...props }: ImageProps) =>
  React.createElement('img', { src, alt, ...props });

export default Image;

