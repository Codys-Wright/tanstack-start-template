'use client';

import * as React from 'react';
import type * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import * as EffectString from 'effect/String';

import { cn } from '../../lib/utils.js';
import { Input } from './input.js';
import { Label } from './label.js';
import { Select } from './select.js';
import { Textarea } from './textarea.js';

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn('grid gap-2', className)} {...props} />
    </FormItemContext.Provider>
  );
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={Boolean(error)}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={Boolean(error)}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? '') : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  );
}

// ============================================================================
// Standalone Field Components (for use without react-hook-form)
// ============================================================================

const SimpleFormControl: React.FC<React.ComponentProps<'div'>> = ({ children, ...props }) => {
  return (
    <div className="flex flex-col gap-1.5" {...props}>
      {children}
    </div>
  );
};

const FieldError: React.FC<
  Omit<React.ComponentProps<'span'>, 'children'> & {
    error?: string | null | undefined;
  }
> = ({ className, error = null, ...props }) => {
  if (error === null || EffectString.isEmpty(error)) return null;

  return (
    <span className={cn('text-sm text-red-500 dark:text-red-400', className)} {...props}>
      {error}
    </span>
  );
};

const FieldDescription: React.FC<
  Omit<React.ComponentProps<'p'>, 'children'> & {
    description: string;
  }
> = ({ className, description, ...props }) => {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props}>
      {description}
    </p>
  );
};

type FieldInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: React.ReactNode;
  name: string;
  error?: string | null | undefined;
  controlClassName?: string;
  description?: string;
};

const FieldInput: React.FC<FieldInputProps> = ({
  className,
  controlClassName,
  description,
  error,
  label,
  name,
  required,
  ...inputProps
}) => {
  return (
    <SimpleFormControl className={controlClassName}>
      <Label htmlFor={name} required={required === true}>
        {label}
      </Label>
      {description && <FieldDescription description={description} />}
      <Input id={name} name={name} required={required} className={className} {...inputProps} />
      <FieldError error={error} />
    </SimpleFormControl>
  );
};

type FieldTextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & {
  label: React.ReactNode;
  name: string;
  error?: string | null | undefined;
  controlClassName?: string;
};

const FieldTextarea: React.FC<FieldTextareaProps> = ({
  className,
  controlClassName,
  error,
  label,
  name,
  required,
  ...textareaProps
}) => {
  return (
    <SimpleFormControl className={controlClassName}>
      <Label htmlFor={name} required={required === true}>
        {label}
      </Label>
      <Textarea
        id={name}
        name={name}
        required={required}
        className={className}
        {...textareaProps}
      />
      <FieldError error={error} />
    </SimpleFormControl>
  );
};

type FieldSelectOption = {
  label: React.ReactNode;
  value: string | number;
};

type FieldSelectProps = Omit<
  React.ComponentProps<typeof Select>,
  'children' | 'id' | 'placeholder'
> & {
  label: React.ReactNode;
  name: string;
  error?: string | null | undefined;
  controlClassName?: string;
  options: ReadonlyArray<FieldSelectOption>;
  noOptionsText?: string;
  required?: boolean;
  placeholder: string;
  loading?: boolean;
};

const FieldSelect: React.FC<FieldSelectProps> = ({
  controlClassName,
  disabled = false,
  error,
  label,
  loading = false,
  name,
  noOptionsText,
  options: userOptions,
  placeholder,
  required,
  ...restSelectProps
}) => {
  const finalOptions: Array<FieldSelectOption> = [];

  finalOptions.push({ label: placeholder, value: '' });
  // eslint-disable-next-line no-restricted-syntax
  finalOptions.push(...userOptions);

  const hasUserOptions = userOptions.length > 0;
  const showNoOptionsMessageAndDisable = !loading && !hasUserOptions && Boolean(noOptionsText);

  return (
    <SimpleFormControl className={controlClassName}>
      <Label htmlFor={name} required={required === true}>
        {label}
      </Label>

      <Select disabled={disabled || loading || showNoOptionsMessageAndDisable} {...restSelectProps}>
        <Select.Trigger>
          <Select.Value placeholder={loading ? 'Loading...' : 'Select an option'} />
        </Select.Trigger>
        <Select.Content>
          {!hasUserOptions && noOptionsText !== undefined ? (
            <Select.Item value="" disabled>
              {noOptionsText}
            </Select.Item>
          ) : (
            finalOptions.map((option) => (
              <Select.Item key={option.value} value={globalThis.String(option.value)}>
                {option.label}
              </Select.Item>
            ))
          )}
        </Select.Content>
      </Select>
      <FieldError error={error} />
    </SimpleFormControl>
  );
};

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  // Standalone field components
  FieldInput,
  FieldTextarea,
  FieldSelect,
  FieldError,
  FieldDescription,
};
