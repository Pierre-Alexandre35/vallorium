import clsx from 'clsx';
import React from 'react';
import { ComponentProps } from 'src/types';
import { Typography } from '../typography';

type P = {
  title: string;
  backgroundImage?: string;
  /**
   * @default 'title-3'
   */
  titleComponent?: ComponentProps<typeof Typography, 'component'>;
  /**
   * @default component="body-1" class="text-black-80"
   */
  contentProps?: ComponentProps<typeof Typography>;
};

export const Card: React.FC<
  React.PropsWithChildren<P & React.HTMLAttributes<HTMLDivElement>>
> = ({
  children,
  title,
  backgroundImage,
  titleComponent = 'title-3',
  contentProps,
  content,
  ...rest
}) => {
  return (
    <div
      {...rest}
      className={clsx(
        'relative bg-white-5 rounded-large overflow-hidden shadow-l-light',
        'min-h-[200px] block',
        'w-[400px]', // Set fixed width here, adjust as needed
        rest.className,
      )}
      style={{
        backgroundImage: backgroundImage
          ? `linear-gradient(
              to bottom right,
              rgba(255, 255, 255, 0.2) 20%,  /* Lighter and more transparent on the top left */
              rgba(0, 0, 0, 0.7) 80% /* Darker on the bottom right */
            ), url(${backgroundImage})`
          : undefined,
        backgroundSize: 'cover', // Ensures the image covers the whole card
        backgroundPosition: 'center', // Centers the background image
      }}
    >
      {/* Content */}
      <div className="relative px-l py-m z-20">
        <Typography
          component={titleComponent}
          className="!text-white drop-shadow-lg"
        >
          {title}
        </Typography>
        <Typography
          component="body-1"
          className="text-white drop-shadow-lg"
          {...contentProps}
        >
          {children}
        </Typography>
      </div>
    </div>
  );
};
