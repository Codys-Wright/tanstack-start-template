import { Atom } from "@effect-atom/atom-react";
import * as Hydration from "@effect-atom/atom/Hydration";
import * as Registry from "@effect-atom/atom/Registry";
import type * as Schema from "effect/Schema";

export interface TypedSerializable<A, I> {
  readonly [Atom.SerializableTypeId]: {
    readonly key: string;
    readonly encode: (value: A) => I;
    readonly decode: (value: I) => A;
  };
}

export const serializable: {
  <R extends Atom.Atom<any>, I>(options: {
    readonly key: string;
    readonly schema: Schema.Schema<Atom.Type<R>, I>;
  }): (self: R) => R & TypedSerializable<Atom.Type<R>, I>;
  <R extends Atom.Atom<any>, I>(
    self: R,
    options: {
      readonly key: string;
      readonly schema: Schema.Schema<Atom.Type<R>, I>;
    }
  ): R & TypedSerializable<Atom.Type<R>, I>;
} = Atom.serializable as any;

/**
 * Dehydrates a single atom value for SSR hydration.
 * Creates a proper DehydratedAtom that can be used with HydrationBoundary.
 */
export const dehydrate = <A, I>(
  atom: Atom.Atom<A> & TypedSerializable<A, I>,
  value: A
): Hydration.DehydratedAtom => {
  const registry = Registry.make();
  // Mount the atom first so it's tracked
  registry.mount(atom);
  // Set the value - need to cast since atom might not be writable
  (registry as any).set(atom, value);
  const dehydrated = Hydration.dehydrate(registry);
  return dehydrated[0]!;
};

/**
 * Dehydrates multiple atoms from a registry for SSR hydration.
 */
export const dehydrateRegistry = (
  registry: Registry.Registry,
  options?: { readonly encodeInitialAs?: "ignore" | "promise" | "value-only" }
): Array<Hydration.DehydratedAtom> => {
  return Hydration.dehydrate(registry, options);
};

/**
 * Converts dehydrated atoms to their value representation.
 */
export const dehydratedToValues = Hydration.toValues;
