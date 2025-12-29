import { makeFormOptions } from '@core/client';
import { useAtomSet } from '@effect-atom/atom-react';
import { UpsertQuizPayload } from '../domain/schema.js';
import { useForm } from '@tanstack/react-form';
import { Button, FieldInput, FieldTextarea } from '@shadcn';
import * as Schema from 'effect/Schema';
import React from 'react';
import { upsertQuizAtom } from '../client/atoms.js';

// 1) UpsertQuiz Component - Handles creating new quizzes
//    This form allows users to create new quizzes with title, subtitle, description, version, and metadata
export const UpsertQuizForm: React.FC = () => {
  // Get the upsert function from our quizzes atoms with promise mode for async operations
  const upsert = useAtomSet(upsertQuizAtom, {
    mode: 'promise',
  });

  // Set up the form using TanStack Form with our domain schema validation
  const form = useForm({
    // Use makeFormOptions to integrate Effect Schema validation with TanStack Form
    ...makeFormOptions({
      defaultValues: {
        title: '',
      },
      schema: UpsertQuizPayload, // Use our domain schema for validation
      validator: 'onSubmit', // Only validate when form is submitted
    }),
    // Handle form submission with Effect-based async operation
    onSubmit: async ({ value }) => {
      // Decode the form values using our schema to ensure type safety
      const decoded = Schema.decodeSync(UpsertQuizPayload)(value);
      // Call the upsert atom to create/update the quiz
      await upsert(decoded);
      // Reset form to initial state after successful submission
      form.reset();
    },
  });

  return (
    <section className="bg-card p-6 rounded-lg border border-border shadow-sm">
      <h2 className="text-lg font-semibold text-foreground mb-4">Add New Quiz</h2>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          // Use void to explicitly indicate we're not awaiting the form submission
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        {/* Title field - Required input for quiz title */}
        <form.Field name="title">
          {(fieldApi) => (
            <FieldInput
              name={fieldApi.name}
              label="Title"
              value={fieldApi.state.value}
              onChange={(event) => {
                fieldApi.handleChange(event.currentTarget.value);
              }}
            />
          )}
        </form.Field>

        {/* Subtitle field - Optional input for quiz subtitle */}
        <form.Field name="subtitle">
          {(fieldApi) => (
            <FieldInput
              name={fieldApi.name}
              label="Subtitle"
              value={fieldApi.state.value ?? ''}
              onChange={(event) => {
                const value = event.currentTarget.value;
                fieldApi.handleChange(value || undefined);
              }}
            />
          )}
        </form.Field>

        {/* Description field - Optional textarea for quiz description */}
        <form.Field name="description">
          {(fieldApi) => (
            <FieldTextarea
              name={fieldApi.name}
              label="Description"
              value={fieldApi.state.value ?? ''}
              onChange={(event) => {
                const value = event.currentTarget.value;
                fieldApi.handleChange(value || undefined);
              }}
              rows={3}
            />
          )}
        </form.Field>

        {/* Version field - Semantic versioning input */}
        <form.Field name="version">
          {(fieldApi) => (
            <FieldInput
              name={fieldApi.name}
              label="Version"
              value={fieldApi.state.value?.semver ?? '1.0.0'}
              onChange={(event) => {
                const value = event.currentTarget.value;
                fieldApi.handleChange(value ? { semver: value, comment: null } : undefined);
              }}
              placeholder="e.g., 1.0.0"
            />
          )}
        </form.Field>

        {/* Submit button with loading state management */}
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" loading={isSubmitting} className="w-full">
              {isSubmitting ? 'Submitting...' : 'Save Changes'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </section>
  );
};
