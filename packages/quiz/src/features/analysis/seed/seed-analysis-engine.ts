import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type QuestionRule } from "../analysis-engine-rpc.js";

type ArtistTypeData = {
  [key: string]:
    | Array<{
        question: { id: number; content: string };
        IdealAnswers: number | Array<number> | string;
        primary: boolean;
      }>
    | undefined;
};

/**
 * Creates the Artist Type Analysis Engine payload from seed data
 * This data can be used by external seed scripts to insert into the database
 */
export const getSeedAnalysisEnginePayload = (): {
  name: string;
  description: string;
  version: any; // Will be overridden by seed script with quiz version
  slug: string;
  scoringConfig: {
    primaryPointWeight: number;
    secondaryPointWeight: number;
    distanceGamma: number;
    beta: number;
    scoreMultiplier: number;
    primaryPointValue: number;
    secondaryPointValue: number;
    primaryDistanceFalloff: number;
    secondaryDistanceFalloff: number;
  };
  endings: Array<{
    endingId: string;
    name: string;
    shortName: string;
    fullName: string;
    questionRules: Array<QuestionRule>;
    category: string;
  }>;
  metadata: {
    totalQuestions: number;
    totalEndings: number;
    categories: Array<string>;
    description: string;
  };
  isActive: boolean;
} => {
  const dataDir = join(dirname(fileURLToPath(import.meta.url)), "data", "artist-types-engine-data");

  const loadJsonData = (filename: string): ArtistTypeData => {
    const filePath = join(dataDir, filename);
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content) as ArtistTypeData;
  };

  const visionaryData = loadJsonData("01_visionary.json");
  const consummateData = loadJsonData("02_consumate.json");
  const analyzerData = loadJsonData("03_analyzer.json");
  const techData = loadJsonData("04_tech.json");
  const entertainerData = loadJsonData("05_entertainer.json");
  const maverickData = loadJsonData("06_maverick.json");
  const dreamerData = loadJsonData("07_dreamer.json");
  const feelerData = loadJsonData("08_feeler.json");
  const torturedData = loadJsonData("09_tortured.json");
  const soloData = loadJsonData("10_solo.json");
  // Helper function to transform a single artist type data into an ending definition
  const transformArtistTypeToEnding = (
    artistTypeName: string,
    questionRules: Array<{
      question: { id: number; content: string };
      IdealAnswers: number | Array<number> | string;
      primary: boolean;
    }>,
  ) => {
    const questionRulesTransformed: Array<QuestionRule> = questionRules.map((rule) => ({
      questionId: rule.question.id.toString(), // Use numeric ID which corresponds to question order
      idealAnswers: Array.isArray(rule.IdealAnswers)
        ? rule.IdealAnswers
        : [typeof rule.IdealAnswers === "string" ? parseInt(rule.IdealAnswers) : rule.IdealAnswers],
      isPrimary: rule.primary,
    }));

    return {
      endingId: artistTypeName.toLowerCase().replace(/\s+/g, "-"),
      name: artistTypeName,
      shortName: artistTypeName.split(" ")[1] ?? artistTypeName, // e.g., "Visionary", "Consummate", etc.
      fullName: artistTypeName,
      questionRules: questionRulesTransformed,
      category: "artist-type",
    };
  };

  // Transform all artist types into endings
  const endings = [
    transformArtistTypeToEnding(
      "The Visionary Artist",
      visionaryData["The Visionary Artist"] ?? [],
    ),
    transformArtistTypeToEnding(
      "The Consummate Artist",
      consummateData["The Consummate Artist"] ?? [],
    ),
    transformArtistTypeToEnding("The Analyzer Artist", analyzerData["The Analyzer Artist"] ?? []),
    transformArtistTypeToEnding("The Tech Artist", techData["The Tech Artist"] ?? []),
    transformArtistTypeToEnding(
      "The Entertainer Artist",
      entertainerData["The Entertainer Artist"] ?? [],
    ),
    transformArtistTypeToEnding("The Maverick Artist", maverickData["The Maverick Artist"] ?? []),
    transformArtistTypeToEnding("The Dreamer Artist", dreamerData["The Dreamer Artist"] ?? []),
    transformArtistTypeToEnding("The Feeler Artist", feelerData["The Feeler Artist"] ?? []),
    transformArtistTypeToEnding("The Tortured Artist", torturedData["The Tortured Artist"] ?? []),
    transformArtistTypeToEnding("The Solo Artist", soloData["The Solo Artist"] ?? []),
  ];

  return {
    name: "Artist Type Analysis Engine",
    description:
      "Analyzes quiz responses to determine which of the 10 artist types best matches the respondent's creative personality and approach.",
    version: {
      semver: "1.0.0",
      comment: "Initial analysis engine with 10 artist archetypes and weighted scoring",
    },
    slug: "artist-type-quiz-v1",
    scoringConfig: {
      primaryPointWeight: 1.0, // Primary Point Weight: 1
      secondaryPointWeight: 1.0, // Secondary Point Weight: 1 (changed from 0.2)
      distanceGamma: 1.0, // Distance falloff curve (simplified)
      beta: 0.8, // Beta: 0.8 (changed from 1.4)
      scoreMultiplier: 1.0,
      primaryPointValue: 10.0, // Primary Point Value: 10
      secondaryPointValue: 5.0, // Secondary Point Value: 5
      primaryDistanceFalloff: 0.1, // Primary Distance Falloff %: 10%
      secondaryDistanceFalloff: 0.5, // Secondary Distance Falloff %: 50%
    },
    endings,
    metadata: {
      totalQuestions: 50,
      totalEndings: 10,
      categories: ["artist-type", "personality", "creative"],
      description:
        "Based on extensive research into creative personalities and artistic approaches",
    },
    isActive: true,
  };
};
