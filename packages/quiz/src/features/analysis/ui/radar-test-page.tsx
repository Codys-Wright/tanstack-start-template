import React from "react";
import type { ArtistData } from "../components/artist-type/artist-type-graph-card.js";
import { ArtistTypeGraphCard } from "../components/artist-type/artist-type-graph-card.js";

// Test data for each artist type with extreme percentages
const createExtremeTestData = (
  dominantType: string,
  dominantPercentage: number,
): Array<ArtistData> => {
  const allTypes = [
    "Visionary",
    "Consummate",
    "Analyzer",
    "Tech",
    "Entertainer",
    "Maverick",
    "Dreamer",
    "Feeler",
    "Tortured",
    "Solo",
  ];

  const remainingPercentage = 100 - dominantPercentage;
  const otherTypesCount = allTypes.length - 1;
  const otherPercentage = Math.floor(remainingPercentage / otherTypesCount);
  const remainder = remainingPercentage - otherPercentage * otherTypesCount;

  return allTypes.map((type, index) => {
    let percentage = type === dominantType ? dominantPercentage : otherPercentage;

    // Add remainder to the first non-dominant type to ensure we hit exactly 100%
    if (index === 1 && type !== dominantType) {
      percentage += remainder;
    }

    return {
      artistType: type,
      percentage,
      points: Math.round(percentage * 10), // Rough point calculation
      fullName: `The ${type} Artist`,
      databaseId: `the-${type.toLowerCase()}-artist`,
    };
  });
};

// Create blended test data with multiple dominant types
const createBlendedTestData = (
  primaryType: string,
  primaryPercentage: number,
  secondaryType: string,
  secondaryPercentage: number,
): Array<ArtistData> => {
  const allTypes = [
    "Visionary",
    "Consummate",
    "Analyzer",
    "Tech",
    "Entertainer",
    "Maverick",
    "Dreamer",
    "Feeler",
    "Tortured",
    "Solo",
  ];

  const remainingPercentage = 100 - primaryPercentage - secondaryPercentage;
  const otherTypesCount = allTypes.length - 2;
  const otherPercentage = Math.floor(remainingPercentage / otherTypesCount);
  const remainder = remainingPercentage - otherPercentage * otherTypesCount;

  return allTypes.map((type, index) => {
    let percentage = 0;

    if (type === primaryType) {
      percentage = primaryPercentage;
    } else if (type === secondaryType) {
      percentage = secondaryPercentage;
    } else {
      percentage = otherPercentage;
      // Add remainder to the first non-primary/secondary type
      if (index === 2 && type !== primaryType && type !== secondaryType) {
        percentage += remainder;
      }
    }

    return {
      artistType: type,
      percentage,
      points: Math.round(percentage * 10),
      fullName: `The ${type} Artist`,
      databaseId: `the-${type.toLowerCase()}-artist`,
    };
  });
};

// Generate test data for each artist type
const testDataSets = [
  // Pure extreme cases (85% dominant)
  { name: "Visionary", data: createExtremeTestData("Visionary", 85) },
  { name: "Consummate", data: createExtremeTestData("Consummate", 85) },
  { name: "Analyzer", data: createExtremeTestData("Analyzer", 85) },
  { name: "Tech", data: createExtremeTestData("Tech", 85) },
  { name: "Entertainer", data: createExtremeTestData("Entertainer", 85) },
  { name: "Maverick", data: createExtremeTestData("Maverick", 85) },
  { name: "Dreamer", data: createExtremeTestData("Dreamer", 85) },
  { name: "Feeler", data: createExtremeTestData("Feeler", 85) },
  { name: "Tortured", data: createExtremeTestData("Tortured", 85) },
  { name: "Solo", data: createExtremeTestData("Solo", 85) },

  // Blended examples - Creative combinations
  { name: "Visionary + Analyzer", data: createBlendedTestData("Visionary", 50, "Analyzer", 30) },
  {
    name: "Maverick + Entertainer",
    data: createBlendedTestData("Maverick", 45, "Entertainer", 35),
  },
  { name: "Tech + Dreamer", data: createBlendedTestData("Tech", 40, "Dreamer", 40) },
  { name: "Consummate + Feeler", data: createBlendedTestData("Consummate", 50, "Feeler", 25) },
  { name: "Tortured + Solo", data: createBlendedTestData("Tortured", 35, "Solo", 35) },

  // Balanced blends
  { name: "Balanced Creative", data: createBlendedTestData("Visionary", 25, "Dreamer", 25) },
  { name: "Balanced Technical", data: createBlendedTestData("Analyzer", 25, "Tech", 25) },
  { name: "Balanced Social", data: createBlendedTestData("Entertainer", 25, "Feeler", 25) },

  // Three-way blends
  { name: "Triple Blend 1", data: createBlendedTestData("Visionary", 30, "Maverick", 25) },
  { name: "Triple Blend 2", data: createBlendedTestData("Analyzer", 30, "Tech", 25) },
  { name: "Triple Blend 3", data: createBlendedTestData("Dreamer", 30, "Feeler", 25) },
];

export const RadarTestPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Radar Chart Color Test</h1>
        <p className="text-muted-foreground mt-2">
          Testing radar chart color blending with various artist type distributions. Includes pure
          extreme cases (85% dominant) and blended combinations to test color mixing.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {testDataSets.map(({ data, name }) => {
          // Find the top 2 artist types for display
          const sortedData = data.sort((a, b) => b.percentage - a.percentage);
          const topTwo = sortedData.slice(0, 2);

          return (
            <div key={name} className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">{name}</h3>
                <p className="text-sm text-muted-foreground">
                  {topTwo[0]?.artistType}: {topTwo[0]?.percentage}%
                  {topTwo[1] !== undefined && `, ${topTwo[1].artistType}: ${topTwo[1].percentage}%`}
                </p>
              </div>

              <ArtistTypeGraphCard
                data={data}
                showBarChart={true}
                barChartHeight="h-32"
                barChartMaxItems={5}
                className="w-full"
              />

              <div className="text-xs text-muted-foreground space-y-1">
                <div>Top 3 types:</div>
                {data
                  .sort((a, b) => b.percentage - a.percentage)
                  .slice(0, 3)
                  .map((item, index) => (
                    <div key={item.artistType}>
                      {index + 1}. {item.artistType}: {item.percentage}%
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Expected Results:</h3>
        <ul className="text-sm space-y-1">
          <li>
            • <strong>Pure cases (85%):</strong> Should show strong colors of the dominant type
          </li>
          <li>
            • <strong>Blended cases:</strong> Should show mixed colors based on the combination
          </li>
          <li>
            • <strong>Visionary + Analyzer:</strong> Purple-blue blend
          </li>
          <li>
            • <strong>Maverick + Entertainer:</strong> Pink-orange blend
          </li>
          <li>
            • <strong>Tech + Dreamer:</strong> Cyan-purple blend
          </li>
          <li>
            • <strong>Balanced blends:</strong> Should show more neutral/mixed colors
          </li>
          <li>• Check the browser console for detailed color blending logs</li>
        </ul>
      </div>
    </div>
  );
};
