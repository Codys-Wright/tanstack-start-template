import { ArtistTypeGraphCard, type ArtistData } from '@quiz';
import { useEffect, useRef, useState } from 'react';
import { BackgroundWrapper } from './background-wrapper.js';

// Static initial data for SSR - deterministic values that render on the server
const INITIAL_ARTIST_DATA: Array<ArtistData> = [
  {
    artistType: 'Visionary',
    fullName: 'The Visionary Artist',
    databaseId: 'the-visionary-artist',
    percentage: 15,
    points: 450,
  },
  {
    artistType: 'Consummate',
    fullName: 'The Consummate Artist',
    databaseId: 'the-consummate-artist',
    percentage: 12,
    points: 380,
  },
  {
    artistType: 'Analyzer',
    fullName: 'The Analyzer Artist',
    databaseId: 'the-analyzer-artist',
    percentage: 11,
    points: 340,
  },
  {
    artistType: 'Tech',
    fullName: 'The Tech Artist',
    databaseId: 'the-tech-artist',
    percentage: 10,
    points: 310,
  },
  {
    artistType: 'Entertainer',
    fullName: 'The Entertainer Artist',
    databaseId: 'the-entertainer-artist',
    percentage: 10,
    points: 300,
  },
  {
    artistType: 'Maverick',
    fullName: 'The Maverick Artist',
    databaseId: 'the-maverick-artist',
    percentage: 9,
    points: 280,
  },
  {
    artistType: 'Dreamer',
    fullName: 'The Dreamer Artist',
    databaseId: 'the-dreamer-artist',
    percentage: 9,
    points: 270,
  },
  {
    artistType: 'Feeler',
    fullName: 'The Feeler Artist',
    databaseId: 'the-feeler-artist',
    percentage: 9,
    points: 260,
  },
  {
    artistType: 'Tortured',
    fullName: 'The Tortured Artist',
    databaseId: 'the-tortured-artist',
    percentage: 8,
    points: 240,
  },
  {
    artistType: 'Solo',
    fullName: 'The Solo Artist',
    databaseId: 'the-solo-artist',
    percentage: 7,
    points: 210,
  },
];

const generateFakeData = (): Array<ArtistData> => {
  const base: Array<Omit<ArtistData, 'percentage' | 'points'>> = [
    {
      artistType: 'Visionary',
      fullName: 'The Visionary Artist',
      databaseId: 'the-visionary-artist',
    },
    {
      artistType: 'Consummate',
      fullName: 'The Consummate Artist',
      databaseId: 'the-consummate-artist',
    },
    {
      artistType: 'Analyzer',
      fullName: 'The Analyzer Artist',
      databaseId: 'the-analyzer-artist',
    },
    {
      artistType: 'Tech',
      fullName: 'The Tech Artist',
      databaseId: 'the-tech-artist',
    },
    {
      artistType: 'Entertainer',
      fullName: 'The Entertainer Artist',
      databaseId: 'the-entertainer-artist',
    },
    {
      artistType: 'Maverick',
      fullName: 'The Maverick Artist',
      databaseId: 'the-maverick-artist',
    },
    {
      artistType: 'Dreamer',
      fullName: 'The Dreamer Artist',
      databaseId: 'the-dreamer-artist',
    },
    {
      artistType: 'Feeler',
      fullName: 'The Feeler Artist',
      databaseId: 'the-feeler-artist',
    },
    {
      artistType: 'Tortured',
      fullName: 'The Tortured Artist',
      databaseId: 'the-tortured-artist',
    },
    {
      artistType: 'Solo',
      fullName: 'The Solo Artist',
      databaseId: 'the-solo-artist',
    },
  ];
  const weights = base.map(() => Math.random() + 0.05);
  const sum = weights.reduce((a, b) => a + b, 0);
  const rawPercentages = weights.map((w) => (w / sum) * 100);
  const rounded = rawPercentages.map((p) => Math.round(p));
  let diff = 100 - rounded.reduce((a, b) => a + b, 0);
  for (let i = 0; diff !== 0 && i < rounded.length; i++) {
    let item = rounded[i];
    if (item !== undefined) {
      item += diff > 0 ? 1 : -1;
      diff += diff > 0 ? -1 : 1;
    }
  }
  return base.map((b, idx) => ({
    ...b,
    percentage: Math.max(0, rounded[idx] ?? 0),
    points: Math.floor(Math.random() * 1000),
  }));
};

export function HeroSectionWithBeamsAndGrid() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Start with deterministic data for SSR, then switch to random data on client
  const [fakeData, setFakeData] = useState<Array<ArtistData>>(INITIAL_ARTIST_DATA);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Generate first random data after hydration
    setFakeData(generateFakeData());
    const id = setInterval(() => {
      setFakeData(generateFakeData());
    }, 5000);
    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <BackgroundWrapper showBeams={isClient}>
      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 md:px-8 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col items-center lg:items-start text-center lg:text-left">
          <h2 className="relative z-50 mb-4 mt-4 max-w-4xl text-balance text-center text-3xl font-semibold tracking-tight text-gray-700 md:text-7xl lg:text-left dark:text-neutral-300">
            Discover your{' '}
            <div className="relative mx-auto inline-block w-max lg:mx-0 [filter:drop-shadow(0px_1px_3px_rgba(27,_37,_80,_0.14))]">
              <div className="text-black [text-shadow:0_0_rgba(0,0,0,0.1)] dark:text-white">
                <span className="">Artist Type</span>
              </div>
            </div>
          </h2>
          <p className="relative z-50 mt-4 max-w-xl text-center text-base/6 text-gray-600 lg:text-left dark:text-gray-200 italic">
            "Knowing yourself is the beginning of all wisdom." - Aristotle
          </p>
          <div className="mb-10 mt-8 flex w-full flex-col items-center justify-center gap-4 sm:flex-row md:mb-20 lg:justify-start">
            <a
              href="/quiz"
              className="group relative z-20 flex h-10 w-full cursor-pointer items-center justify-center space-x-2 rounded-lg bg-black p-px px-4 py-2 text-center text-sm font-semibold leading-6 text-white no-underline transition duration-200 sm:w-52 dark:bg-white dark:text-black"
            >
              Take the quiz
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              className="shadow-input group relative z-20 flex h-10 w-full cursor-not-allowed items-center justify-center space-x-2 rounded-lg bg-white p-px px-4 py-2 text-sm font-semibold leading-6 text-black no-underline transition duration-200 opacity-50 sm:w-52 dark:bg-neutral-800 dark:text-white"
            >
              Explore More
            </a>
          </div>
        </div>
        <div className="lg:col-span-1 w-full h-full">
          <div
            ref={containerRef}
            className="relative w-full h-full min-w-96 rounded-[32px] border border-neutral-200/50 bg-neutral-100 p-2 backdrop-blur-lg md:p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
          >
            <div>
              {/* Only render chart on client to avoid hydration mismatch */}
              {isClient && (
                <ArtistTypeGraphCard
                  data={fakeData ?? []}
                  showBarChart
                  barChartHeight="h-40"
                  className="h-full w-full"
                  contentClassName="h-full w-full"
                  transparent
                  fill
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
}
