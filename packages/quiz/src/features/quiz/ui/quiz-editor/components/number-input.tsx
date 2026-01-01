'use client';

import { Input, Label } from '@shadcn';

export interface NumberInputProps {
  description?: string;
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  description,
  label,
  max,
  min,
  onChange,
  step = 0.1,
  value,
}) => (
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
