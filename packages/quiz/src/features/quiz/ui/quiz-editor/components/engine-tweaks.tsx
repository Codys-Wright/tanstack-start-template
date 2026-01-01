'use client';

import { Button, ScrollArea, Tabs } from '@shadcn';
import { RotateCcwIcon } from 'lucide-react';
import React from 'react';
import { NumberInput } from './number-input.js';

export interface AnalysisConfig {
  primaryPointValue: number;
  secondaryPointValue: number;
  primaryPointWeight: number;
  secondaryPointWeight: number;
  primaryDistanceFalloff: number;
  secondaryDistanceFalloff: number;
  beta: number;
  disableSecondaryPoints: boolean;
  primaryMinPoints: number;
  secondaryMinPoints: number;
  minPercentageThreshold: number;
  enableQuestionBreakdown: boolean;
  maxEndingResults: number;
}

export interface EngineTweaksProps {
  analysisConfig: AnalysisConfig;
  onChange: (config: AnalysisConfig) => void;
}

export const EngineTweaks: React.FC<EngineTweaksProps> = ({ analysisConfig, onChange }) => {
  const updateConfig = (updates: Partial<AnalysisConfig>) => {
    const newConfig = {
      ...analysisConfig,
      ...updates,
    };
    onChange(newConfig);
  };

  const resetToDefaults = () => {
    onChange({
      primaryPointValue: 10.0,
      secondaryPointValue: 5.0,
      primaryPointWeight: 1.0,
      secondaryPointWeight: 1.0,
      primaryDistanceFalloff: 0.1,
      secondaryDistanceFalloff: 0.5,
      beta: 0.8,
      disableSecondaryPoints: false,
      primaryMinPoints: 0.0,
      secondaryMinPoints: 0.0,
      minPercentageThreshold: 0.0,
      enableQuestionBreakdown: true,
      maxEndingResults: 10,
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-border/50">
        <div>
          <h3 className="text-sm font-medium">Analysis Config</h3>
          <p className="text-xs text-muted-foreground mt-1">Adjust analysis parameters</p>
        </div>
        <Button size="sm" variant="ghost" onClick={resetToDefaults} title="Reset to defaults">
          <RotateCcwIcon className="h-3 w-3" />
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-4">
          {/* Analysis Configuration */}
          <Tabs defaultValue="scoring" className="w-full">
            <Tabs.List className="grid w-full grid-cols-2">
              <Tabs.Trigger value="scoring">Scoring</Tabs.Trigger>
              <Tabs.Trigger value="ui">UI</Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="scoring" className="mt-4 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  <NumberInput
                    description="Base points awarded for perfect primary ideal answers"
                    label="Primary Point Value"
                    max={50}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ primaryPointValue: value });
                    }}
                    step={1}
                    value={analysisConfig.primaryPointValue}
                  />
                  <NumberInput
                    description="Base points awarded for perfect secondary ideal answers"
                    label="Secondary Point Value"
                    max={50}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ secondaryPointValue: value });
                    }}
                    step={1}
                    value={analysisConfig.secondaryPointValue}
                  />
                  <NumberInput
                    description="Multiplier for primary questions (most important questions)"
                    label="Primary Point Weight"
                    max={3}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ primaryPointWeight: value });
                    }}
                    step={0.1}
                    value={analysisConfig.primaryPointWeight}
                  />
                  <NumberInput
                    description="Multiplier for secondary questions (supporting questions)"
                    label="Secondary Point Weight"
                    max={3}
                    min={0}
                    onChange={(value) => {
                      updateConfig({ secondaryPointWeight: value });
                    }}
                    step={0.1}
                    value={analysisConfig.secondaryPointWeight}
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
                    value={Math.round(analysisConfig.primaryDistanceFalloff * 100)}
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
                    value={Math.round(analysisConfig.secondaryDistanceFalloff * 100)}
                  />
                </div>
              </ScrollArea>
            </Tabs.Content>

            <Tabs.Content value="ui" className="mt-4 h-full">
              <ScrollArea className="h-full">
                <div className="space-y-4 pr-4">
                  <NumberInput
                    description="Higher number separates the high percentages from the lower ones on the graph visually to reveal a more distinct winner"
                    label="Beta"
                    max={5}
                    min={0.1}
                    onChange={(value) => {
                      updateConfig({ beta: value });
                    }}
                    step={0.1}
                    value={analysisConfig.beta}
                  />
                </div>
              </ScrollArea>
            </Tabs.Content>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};
