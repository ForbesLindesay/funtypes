---
title: Funtypes API
nextjs:
  metadata:
    title: Funtypes API
    description: API reference for Funtypes
---

To use funtypes, you first construct a codec. For example:

```ts
import * as ft from "funtypes";
import * as s from "funtypes-Codecs";

export const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
  dateOfBirth: s.ParsedDateTimeString(),
});
// => ft.Codec<{ id: number; name: string; dateOfBirth: Date }>
```

This codec can be used to parse, validate and serialize values. For a simple codec like, these are all essentially equivalent, but you can also create codecs that parse and serialize to different values. For example the `s.ParsedDateTimeString()` codec serializes to an ISO8601 date time string for JSON, but parses to a JavaScript `Date` object.

```ts
export interface Codec<TParsed> {
  /**
   * Verifies that a value conforms to this runtype.
   * When given a value that does not conform to the
   * runtype, throws an exception.
   *
   * @throws ValidationError
   */
  assert(x: any): asserts x is TParsed;

  /**
   * A type guard for this runtype.
   */
  test(x: any): x is TParsed;

  /**
   * Validates the value conforms to this type, and performs
   * the `parse` action for any `ParsedValue` types.
   *
   * If the value is valid, it returns the parsed value,
   * otherwise it throws a ValidationError.
   *
   * @throws ValidationError
   */
  parse(x: any): TParsed;

  /**
   * Validates the value conforms to this type, and performs
   * the `parse` action for any `ParsedValue` types.
   *
   * Returns a `Result`, containing the parsed value or
   * error message. Does not throw!
   */
  safeParse(x: any): Result<TParsed>;

  /**
   * Validates the value conforms to this type, and performs
   * the `serialize` action for any `ParsedValue` types.
   *
   * If the value is valid, and the type supports serialize,
   * it returns the serialized value, otherwise it throws a
   * ValidationError.
   *
   * @throws ValidationError
   */
  serialize: (x: TParsed) => unknown;

  /**
   * Validates the value conforms to this type, and performs
   * the `serialize` action for any `ParsedValue` types.
   *
   * Returns a `Result`, constaining the serialized value or
   * error message. Does not throw!
   */
  safeSerialize: (x: TParsed) => Result<unknown>;

  /**
   * Add an arbitrary constraint function to a codec, and
   * optionally change its name and/or its static type.
   */
  withConstraint<
    TConstrained extends TParsed = TParsed,
  >(
    constraint: (x: TParsed) => boolean | string,
    options?: { name?: string },
  ): Codec<TConstrained>;

  /**
   * Helper function to convert an underlying Codec into
   * another static type via a type guard function.  The
   * static type of the new Codec is inferred from
   * the type of the test function.
   */
  withGuard<TConstrained extends TParsed>(
    test: (x: TParsed) => x is TConstrained,
    options?: { name?: string },
  ): Codec<TConstrained>;

  /**
   * Apply conversion functions when parsing/serializing
   * this value.
   */
  withParser<T>(
    value: ParsedValueConfig<TParsed, T>,
  ): Codec<T>;

  introspection: RuntypeIntrospection;
}
```
