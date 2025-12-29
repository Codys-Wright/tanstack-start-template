'use client';
import { artistColors, getArtistColorHex } from '@quiz';
import { cn } from '@ui/shadcn';
import { AnimatePresence, motion } from 'motion/react';
import React, { useRef } from 'react';

type BackgroundWrapperProps = {
  children: React.ReactNode;
  className?: string;
  showBeams?: boolean;
  showGrids?: boolean;
};

export const BackgroundWrapper: React.FC<BackgroundWrapperProps> = ({
  children,
  className = '',
  showBeams = true,
  showGrids = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={parentRef}
      className={cn(
        'relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 min-w-screen',
        className,
      )}
    >
      {showGrids && <BackgroundGrids />}
      {showBeams && (
        <>
          <CollisionMechanism
            beamOptions={{
              initialX: '-25vw',
              translateX: '80vw',
              translateY: '120vh',
              duration: 7,
              repeatDelay: 3,
            }}
            containerRef={containerRef}
            parentRef={parentRef}
          />
          <CollisionMechanism
            beamOptions={{
              initialX: '-12vw',
              translateX: '100vw',
              translateY: '120vh',
              duration: 4,
              repeatDelay: 3,
            }}
            containerRef={containerRef}
            parentRef={parentRef}
          />
          <CollisionMechanism
            beamOptions={{
              initialX: '12vw',
              translateX: '120vw',
              translateY: '120vh',
              duration: 5,
              repeatDelay: 3,
            }}
            containerRef={containerRef}
            parentRef={parentRef}
          />
          <CollisionMechanism
            containerRef={containerRef}
            parentRef={parentRef}
            beamOptions={{
              initialX: '25vw',
              translateX: '140vw',
              translateY: '120vh',
              duration: 6,
              repeatDelay: 3,
            }}
          />
        </>
      )}
      {children}
    </div>
  );
};

const BackgroundGrids = () => {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 grid h-full w-full -rotate-45 transform select-none grid-cols-2 gap-10 md:grid-cols-4">
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full bg-gradient-to-b from-transparent via-neutral-100 to-transparent dark:via-neutral-800">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
      <div className="relative h-full w-full">
        <GridLineVertical className="left-0" />
        <GridLineVertical className="left-auto right-0" />
      </div>
    </div>
  );
};

const CollisionMechanism = React.forwardRef<
  HTMLDivElement,
  {
    containerRef: React.RefObject<HTMLDivElement | null>;
    parentRef: React.RefObject<HTMLDivElement | null>;
    beamOptions?: {
      initialX?: number | string;
      translateX?: number | string;
      initialY?: number | string;
      translateY?: number | string;
      rotate?: number;
      className?: string;
      duration?: number;
      delay?: number;
      repeatDelay?: number;
    };
  }
>(({ beamOptions = {}, containerRef, parentRef }, _ref) => {
  const beamRef = useRef<HTMLDivElement>(null);
  const [collision, setCollision] = React.useState<{
    detected: boolean;
    coordinates: { x: number; y: number } | null;
  }>({ detected: false, coordinates: null });
  const [beamKey, setBeamKey] = React.useState(0);
  const [cycleCollisionDetected, setCycleCollisionDetected] = React.useState(false);
  const [colorChoices, setColorChoices] = React.useState<Array<string>>(['#6366f1']);
  const pickRandomColor = () => colorChoices[Math.floor(Math.random() * colorChoices.length)];

  React.useEffect(() => {
    const choices = Object.keys(artistColors).map((artistType) =>
      getArtistColorHex(artistType as any),
    );
    setColorChoices(choices);
  }, []);
  const [currentColorHex, setCurrentColorHex] = React.useState<string>('#6366f1');

  React.useEffect(() => {
    setCurrentColorHex(getArtistColorHex('Visionary'));
  }, []);

  React.useEffect(() => {
    const checkCollision = () => {
      const beam = beamRef.current;
      const container = containerRef.current;
      const parent = parentRef.current;

      if (beam !== null && container !== null && parent !== null && !cycleCollisionDetected) {
        const beamRect = beam.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();

        const horizontallyOverlapping =
          beamRect.right >= containerRect.left && beamRect.left <= containerRect.right;
        const nearTopEdge = Math.abs(beamRect.bottom - containerRect.top) <= 6;

        if (horizontallyOverlapping && nearTopEdge) {
          const relativeX = beamRect.left - parentRect.left + beamRect.width / 2;
          const relativeY = containerRect.top - parentRect.top;

          setCollision({
            detected: true,
            coordinates: { x: relativeX, y: relativeY },
          });
          const color = pickRandomColor();
          if (color !== undefined) {
            setCurrentColorHex(color);
          }
          setCycleCollisionDetected(true);
          beam.style.opacity = '0';
        }
      }
    };

    const animationInterval = setInterval(checkCollision, 50);

    return () => {
      clearInterval(animationInterval);
    };
  }, [cycleCollisionDetected, containerRef]);

  React.useEffect(() => {
    if (collision.detected && collision.coordinates !== null) {
      const RESET_MS = 1400;
      const reset = () => {
        setCollision({ detected: false, coordinates: null });
        setCycleCollisionDetected(false);
        const beam = beamRef.current;
        if (beam !== null) {
          beam.style.opacity = '1';
        }
        setBeamKey((prevKey) => prevKey + 1);
      };
      const id = setTimeout(reset, RESET_MS);
      return () => {
        clearTimeout(id);
      };
    }
    return undefined;
  }, [collision]);

  return (
    <>
      <motion.div
        key={beamKey}
        ref={beamRef}
        animate="animate"
        initial={{
          translateY: beamOptions.initialY ?? '-20vh',
          translateX: beamOptions.initialX ?? '0px',
          rotate: beamOptions.rotate ?? -45,
        }}
        variants={{
          animate: {
            translateY: beamOptions.translateY ?? '120vh',
            translateX: beamOptions.translateX ?? '100vw',
            rotate: beamOptions.rotate ?? -45,
          },
        }}
        transition={{
          duration: beamOptions.duration ?? 8,
          repeat: Infinity,
          repeatType: 'loop',
          ease: 'linear',
          delay: beamOptions.delay ?? 0,
          repeatDelay: beamOptions.repeatDelay ?? 0,
        }}
        className={cn(
          'absolute left-96 top-20 m-auto h-14 w-px rounded-full',
          beamOptions.className,
        )}
        style={{
          background: `linear-gradient(to top, ${currentColorHex}, transparent)`,
        }}
      />
      <AnimatePresence>
        {collision.detected && collision.coordinates !== null && (
          <Explosion
            key={`${collision.coordinates.x}-${collision.coordinates.y}`}
            className=""
            colorHex={currentColorHex}
            style={{
              left: `${collision.coordinates.x + 20}px`,
              top: `${collision.coordinates.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
});

CollisionMechanism.displayName = 'CollisionMechanism';

const Explosion = ({
  colorHex = '#FB8500',
  ...props
}: React.HTMLProps<HTMLDivElement> & { colorHex?: string }) => {
  const spans = Array.from({ length: 20 }, (_, index) => ({
    id: index,
    initialX: 0,
    initialY: 0,
    directionX: Math.floor(Math.random() * 80 - 40),
    directionY: Math.floor(Math.random() * -50 - 10),
  }));

  return (
    <div {...props} className={cn('absolute z-50 h-2 w-2', props.className)}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute -inset-x-10 top-0 m-auto h-[4px] w-10 rounded-full blur-sm"
        style={{
          background: `linear-gradient(to right, transparent, ${colorHex}, transparent)`,
        }}
      ></motion.div>
      {spans.map((span) => (
        <motion.span
          key={span.id}
          initial={{ x: span.initialX, y: span.initialY, opacity: 1 }}
          animate={{ x: span.directionX, y: span.directionY, opacity: 0 }}
          transition={{ duration: Math.random() * 1.5 + 0.5, ease: 'easeOut' }}
          className="absolute h-1 w-1 rounded-full"
          style={{ backgroundColor: colorHex }}
        />
      ))}
    </div>
  );
};

const GridLineVertical = ({ className, offset }: { className?: string; offset?: string }) => {
  return (
    <div
      style={
        {
          '--background': '#ffffff',
          '--color': 'rgba(0, 0, 0, 0.2)',
          '--height': '5px',
          '--width': '1px',
          '--fade-stop': '90%',
          '--offset': offset ?? '150px',
          '--color-dark': 'rgba(255, 255, 255, 0.3)',
          maskComposite: 'exclude',
        } as React.CSSProperties
      }
      className={cn(
        'absolute top-[calc(var(--offset)/2*-1)] h-[calc(100%+var(--offset))] w-[var(--width)]',
        'bg-[linear-gradient(to_bottom,var(--color),var(--color)_50%,transparent_0,transparent)]',
        '[background-size:var(--width)_var(--height)]',
        '[mask:linear-gradient(to_top,var(--background)_var(--fade-stop),transparent),_linear-gradient(to_bottom,var(--background)_var(--fade-stop),transparent),_linear-gradient(black,black)]',
        '[mask-composite:exclude]',
        'z-30',
        'dark:bg-[linear-gradient(to_bottom,var(--color-dark),var(--color-dark)_50%,transparent_0,transparent)]',
        className,
      )}
    ></div>
  );
};
