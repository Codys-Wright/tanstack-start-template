import { AnalysisConfig, type AnalysisEngine } from "@features/quiz/domain";
import { Badge, Button, Card, Input, Label, Tabs } from "@shadcn";
import { formatHex, parse } from "culori";
import { ConfigProvider, Effect } from "effect";
import { RotateCcwIcon, SettingsIcon } from "lucide-react";
import React from "react";

// Type for the analysis config overrides
export type AnalysisConfigOverrides = {
  // Point values for ideal answers
  primaryPointValue: number;
  secondaryPointValue: number;

  // Point weight multipliers
  primaryPointWeight: number;
  secondaryPointWeight: number;

  // Distance falloff for each type
  primaryDistanceFalloff: number;
  secondaryDistanceFalloff: number;

  // Beta for visual separation
  beta: number;

  // Minimum point values (floor for scoring)
  primaryMinPoints: number;
  secondaryMinPoints: number;

  // UI toggles
  idealAnswerOverlay: boolean;
  progressBarColors: boolean;

  // Artist type colors (CSS variable values)
  artistColors?: {
    visionary?: string;
    consummate?: string;
    analyzer?: string;
    tech?: string;
    entertainer?: string;
    maverick?: string;
    dreamer?: string;
    feeler?: string;
    tortured?: string;
    solo?: string;
  };
};

// Get actual defaults from the analysis service
const getServiceDefaults = (): Partial<AnalysisConfigOverrides> => {
  try {
    // Use ConfigProvider.fromMap with empty map to get defaults
    const mockConfigProvider = ConfigProvider.fromMap(new Map());
    const resolvedConfig = Effect.runSync(
      Effect.withConfigProvider(AnalysisConfig, mockConfigProvider),
    );
    return {
      primaryPointValue: Number(resolvedConfig.primaryPointValue),
      secondaryPointValue: Number(resolvedConfig.secondaryPointValue),
      primaryPointWeight: Number(resolvedConfig.primaryPointWeight),
      secondaryPointWeight: Number(resolvedConfig.secondaryPointWeight),
      primaryDistanceFalloff: Number(resolvedConfig.primaryDistanceFalloff),
      secondaryDistanceFalloff: Number(resolvedConfig.secondaryDistanceFalloff),
      beta: Number(resolvedConfig.beta),
      primaryMinPoints: Number(resolvedConfig.primaryMinPoints),
      secondaryMinPoints: Number(resolvedConfig.secondaryMinPoints),
    };
  } catch {
    // If we can't get service defaults, return empty object
    return {};
  }
};

// Get combined defaults from engine scoring config and service config
const getCombinedDefaults = (engine?: AnalysisEngine): Partial<AnalysisConfigOverrides> => {
  const serviceDefaults = getServiceDefaults();

  if (engine?.scoringConfig === undefined) {
    return serviceDefaults;
  }

  // Engine scoring config takes precedence over service defaults
  const scoringConfig = engine.scoringConfig;
  const result: Partial<AnalysisConfigOverrides> = {
    primaryPointValue: scoringConfig.primaryPointValue,
    secondaryPointValue: scoringConfig.secondaryPointValue,
    primaryPointWeight: scoringConfig.primaryPointWeight,
    secondaryPointWeight: scoringConfig.secondaryPointWeight,
    primaryDistanceFalloff: scoringConfig.primaryDistanceFalloff,
    secondaryDistanceFalloff: scoringConfig.secondaryDistanceFalloff,
    beta: scoringConfig.beta,
  };

  // Add service defaults for fields not in scoring config, only if they exist
  if (serviceDefaults.primaryMinPoints !== undefined) {
    result.primaryMinPoints = serviceDefaults.primaryMinPoints;
  }
  if (serviceDefaults.secondaryMinPoints !== undefined) {
    result.secondaryMinPoints = serviceDefaults.secondaryMinPoints;
  }

  return result;
};

// Empty default config - let Effect config handle defaults
const defaultConfig: Partial<AnalysisConfigOverrides> = {};

// Artist type names in order
const artistTypes = [
  "visionary",
  "consummate",
  "analyzer",
  "tech",
  "entertainer",
  "maverick",
  "dreamer",
  "feeler",
  "tortured",
  "solo",
] as const;

// Function to convert oklch to hex
const oklchToHex = (oklchValue: string): string => {
  try {
    const color = parse(oklchValue);
    if (color !== undefined) {
      const hex = formatHex(color);
      return hex;
    }
    return "#000000";
  } catch {
    return "#000000";
  }
};

// Function to get current CSS variable values
const getCurrentArtistColors = () => {
  // Return empty object during SSR
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {};
  }

  const colors: Record<string, string> = {};
  artistTypes.forEach((type) => {
    const cssVar = `--artist-${type}`;
    const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    if (value !== "") {
      colors[type] = oklchToHex(value);
    }
  });
  return colors;
};

// Function to update CSS variable values
const updateArtistColor = (type: string, value: string) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  const cssVar = `--artist-${type}`;
  document.documentElement.style.setProperty(cssVar, value);
};

type DevPanelProps = {
  config: Partial<AnalysisConfigOverrides>;
  engine?: AnalysisEngine;
  isVisible: boolean;
  onConfigChange: (config: Partial<AnalysisConfigOverrides>) => void;
  onToggleVisibility: () => void;
};

const NumberInput: React.FC<{
  description?: string;
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}> = ({ description, label, max, min, onChange, step = 0.1, value }) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    {description !== undefined && <p className="text-xs text-muted-foreground">{description}</p>}
    <Input
      type="number"
      value={value}
      onChange={(e) => {
        const numValue = parseFloat(e.target.value);
        onChange(isNaN(numValue) ? 0 : numValue);
      }}
      min={min}
      max={max}
      step={step}
      className="h-8"
    />
  </div>
);

const ArtistColorPicker: React.FC<{
  onChange: (value: string) => void;
  type: string;
  value: string;
}> = ({ onChange, type, value }) => {
  const displayName = type.charAt(0).toUpperCase() + type.slice(1);
  const [localValue, setLocalValue] = React.useState(value);
  const debounceRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Update local value when prop value changes
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange function
  const debouncedOnChange = React.useCallback(
    (newValue: string) => {
      setLocalValue(newValue);

      // Clear existing timeout
      if (debounceRef.current !== undefined) {
        clearTimeout(debounceRef.current);
      }

      // Set new timeout
      debounceRef.current = setTimeout(() => {
        onChange(newValue);
      }, 300); // 300ms delay
    },
    [onChange],
  );

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current !== undefined) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{displayName}</Label>
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded border border-border"
          style={{ backgroundColor: localValue }}
        />
        <input
          type="color"
          value={localValue}
          onChange={(e) => {
            debouncedOnChange(e.target.value);
          }}
          className="w-12 h-8 rounded border border-border cursor-pointer"
        />
      </div>
    </div>
  );
};

export const DevPanel: React.FC<DevPanelProps> = ({
  config,
  engine,
  isVisible,
  onConfigChange,
  onToggleVisibility,
}) => {
  const combinedDefaults = getCombinedDefaults(engine);
  const [currentColors, setCurrentColors] = React.useState<Record<string, string>>({});

  // Load colors after hydration
  React.useEffect(() => {
    setCurrentColors(getCurrentArtistColors());
  }, []);

  const updateConfig = (updates: Partial<AnalysisConfigOverrides>) => {
    const newConfig = {
      ...config,
      ...updates,
    };
    onConfigChange(newConfig);
  };

  const resetToDefaults = () => {
    onConfigChange(defaultConfig);
  };

  const handleColorChange = (type: string, value: string) => {
    updateArtistColor(type, value);
    setCurrentColors((prev) => ({ ...prev, [type]: value }));
    updateConfig({
      artistColors: {
        ...config.artistColors,
        [type]: value,
      },
    });
  };

  if (!isVisible) {
    return (
      <Button
        className="fixed bottom-4 left-4 z-50"
        size="sm"
        variant="outline"
        onClick={() => {
          onToggleVisibility();
        }}
      >
        <SettingsIcon className="h-4 w-4 mr-2" />
        Dev Panel
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 w-96 max-h-[80vh] overflow-hidden z-50 shadow-lg">
      <Card.Header className="pb-2">
        <div className="flex items-center justify-between">
          <Card.Title className="text-sm flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Analysis Dev Panel
          </Card.Title>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              title="Reset to defaults"
              variant="ghost"
              onClick={() => {
                resetToDefaults();
              }}
            >
              <RotateCcwIcon className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onToggleVisibility();
              }}
            >
              ×
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            Live Preview
          </Badge>
          <Badge variant="outline" className="text-xs">
            Ctrl+D to toggle
          </Badge>
        </div>
      </Card.Header>
      <Card.Content className="pt-0 max-h-[60vh] overflow-hidden">
        <Tabs defaultValue="analysis" className="h-full">
          <Tabs.List className="grid w-full grid-cols-2">
            <Tabs.Trigger value="analysis">Analysis</Tabs.Trigger>
            <Tabs.Trigger value="ui">UI</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="analysis" className="mt-4 max-h-[50vh] overflow-y-auto">
            <div className="space-y-4">
              <NumberInput
                description="Base points awarded for perfect primary ideal answers"
                label="Primary Point Value"
                max={50}
                min={1}
                onChange={(value) => {
                  updateConfig({ primaryPointValue: value });
                }}
                step={1}
                value={config.primaryPointValue ?? combinedDefaults.primaryPointValue ?? 0}
              />
              <NumberInput
                description="Base points awarded for perfect secondary ideal answers"
                label="Secondary Point Value"
                max={50}
                min={1}
                onChange={(value) => {
                  updateConfig({ secondaryPointValue: value });
                }}
                step={1}
                value={config.secondaryPointValue ?? combinedDefaults.secondaryPointValue ?? 0}
              />
              <NumberInput
                description="Multiplier for primary questions (most important questions)"
                label="Primary Point Weight"
                max={3}
                min={0.1}
                onChange={(value) => {
                  updateConfig({ primaryPointWeight: value });
                }}
                step={0.1}
                value={config.primaryPointWeight ?? combinedDefaults.primaryPointWeight ?? 0}
              />
              <NumberInput
                description="Multiplier for secondary questions (supporting questions)"
                label="Secondary Point Weight"
                max={3}
                min={0.1}
                onChange={(value) => {
                  updateConfig({ secondaryPointWeight: value });
                }}
                step={0.1}
                value={config.secondaryPointWeight ?? combinedDefaults.secondaryPointWeight ?? 0}
              />
              <NumberInput
                description="Percentage of points lost per step away from ideal answers. 0% = only exact matches get points, 100% = lose all points after 1 step"
                label="Primary Distance Falloff (%)"
                max={100}
                min={0}
                onChange={(value) => {
                  updateConfig({ primaryDistanceFalloff: value / 100 });
                }}
                step={5}
                value={Math.round(
                  (config.primaryDistanceFalloff ?? combinedDefaults.primaryDistanceFalloff ?? 0) *
                    100,
                )}
              />
              <NumberInput
                description="Percentage of points lost per step away from ideal answers. 0% = only exact matches get points, 100% = lose all points after 1 step"
                label="Secondary Distance Falloff (%)"
                max={100}
                min={0}
                onChange={(value) => {
                  updateConfig({ secondaryDistanceFalloff: value / 100 });
                }}
                step={5}
                value={Math.round(
                  (config.secondaryDistanceFalloff ??
                    combinedDefaults.secondaryDistanceFalloff ??
                    0) * 100,
                )}
              />
              <NumberInput
                description="Higher number separates the high percentages from the lower ones on the graph visually to reveal a more distinct winner"
                label="Beta"
                max={5}
                min={0.1}
                onChange={(value) => {
                  updateConfig({ beta: value });
                }}
                step={0.1}
                value={config.beta ?? combinedDefaults.beta ?? 0}
              />
              <NumberInput
                description="Minimum points that can be awarded for primary questions (floor value, can be negative)"
                label="Primary Min Points"
                max={10}
                min={-10}
                onChange={(value) => {
                  updateConfig({ primaryMinPoints: value });
                }}
                step={0.5}
                value={config.primaryMinPoints ?? combinedDefaults.primaryMinPoints ?? 0}
              />
              <NumberInput
                description="Minimum points that can be awarded for secondary questions (floor value, can be negative)"
                label="Secondary Min Points"
                max={10}
                min={-10}
                onChange={(value) => {
                  updateConfig({ secondaryMinPoints: value });
                }}
                step={0.5}
                value={config.secondaryMinPoints ?? combinedDefaults.secondaryMinPoints ?? 0}
              />
            </div>
          </Tabs.Content>

          <Tabs.Content value="ui" className="mt-4 max-h-[50vh] overflow-y-auto">
            <div className="space-y-4">
              {/* UI Toggles Section */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-medium mb-3">UI Controls</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Ideal Answer Overlay</Label>
                      <p className="text-xs text-muted-foreground">
                        Show ideal answer dots and bars on question cards
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={(config.idealAnswerOverlay ?? true) ? "default" : "outline"}
                      onClick={() => {
                        updateConfig({ idealAnswerOverlay: !(config.idealAnswerOverlay ?? true) });
                      }}
                    >
                      {(config.idealAnswerOverlay ?? true) ? "ON" : "OFF"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Progress Bar Colors</Label>
                      <p className="text-xs text-muted-foreground">
                        Color progress bar segments by artist type
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={(config.progressBarColors ?? true) ? "default" : "outline"}
                      onClick={() => {
                        updateConfig({ progressBarColors: !(config.progressBarColors ?? true) });
                      }}
                    >
                      {(config.progressBarColors ?? true) ? "ON" : "OFF"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Artist Type Colors Section */}
              <div>
                <h4 className="text-sm font-medium mb-3">Artist Type Colors</h4>
                <div className="space-y-3">
                  {artistTypes.map((type) => (
                    <ArtistColorPicker
                      key={type}
                      type={type}
                      value={currentColors[type] ?? "#000000"}
                      onChange={(value) => {
                        handleColorChange(type, value);
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Tabs.Content>
        </Tabs>
      </Card.Content>
    </Card>
  );
};
