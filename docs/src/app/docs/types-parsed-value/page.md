---
title: ParsedValue
nextjs:
  metadata:
    title: ParsedValue
    description: Parse and Serialize values using Funtypes Codecs
---

Using `ParsedValue` you can create a `Codec` that transforms the value when serializing and parsing. This can be useful for types that cannot be exactly represented in JSON, and it can also be useful for migrating old/outdated data. To make the types easier, you can write `SomeCodec.withParser({...options})` as a shorthand for `ft.ParsedValue({...options})`.

The options are:

```ts
export interface ParsedValueConfig<
  TUnderlying,
  TParsed,
> {
  /**
   * A name to use in error messages and when
   * ft.showType is called. You can leave this
   * out and it will default to using:
   * "ParsedValue<TUnderlying>"
   */
  name?: string;
  /**
   * A function to handle parsing the value. It
   * takes the underlying value and returns either:
   *
   * { success: true, value: TParsed }
   *
   * or
   *
   * { success: false, message: string }
   */
  parse: (value: TUnderlying) => Result<TParsed>;
  /**
   * A function to handle serializing the value. It
   * takes the TParsed value and returns either:
   *
   * { success: true, value: TUnderlying }
   *
   * or
   *
   * { success: false, message: string }
   *
   * This method is optional. If you don't provide it,
   * this type will act as equivalent to `ft.Never` when
   * serializing. That might be ok if there are other
   * codecs in the same Union as this Codec, or if you
   * never intend to call Codec.serialize.
   */
  serialize?: (
    value: TParsed,
  ) => Result<TUnderlying>;
  /**
   * An optional codec to validate the type against after
   * calling `parse` or before calling `serialize`. This is
   * also used any time `Codec.assert` or `Codec.test` is
   * called. Without this, the value returned from `parse`
   * and any value passed to `serialize` will be assumed
   * to be valid.
   */
  test?: Codec<TParsed>;
}
```

## Data that needs serialization/parsing

We can use a `ParsedValue` to handle data that can't be natively represented by JSON. For example:

```ts
import * as ft from "funtypes";

function MapCodec<TKey, TValue>(
  keyCodec: ft.Codec<TKey>,
  valueCodec: ft.Codec<TValue>,
) {
  return ft
    .Array(ft.Tuple(keyCodec, valueCodec))
    .withParser({
      name: `Map<${ft.showType(keyCodec)}, ${ft.showType(valueCodec)}>`,
      pass(values) {
        return {
          success: true,
          value: new Map(values),
        };
      },
      serialize(values) {
        return {
          success: true,
          value: Array.from(values),
        };
      },
      test: ft
        .InstanceOf(Map)
        .withConstraint<
          Map<TKey, TValue>
        >((v) => {
          for (const [key, value] of v) {
            if (!keyCodec.test(key)) {
              return `Unable to assign ${ft.showValue(key)} to ${ft.showType(keyCodec)}`;
            }
            if (!valueCodec.test(value)) {
              return `Unable to assign ${ft.showValue(value)} to ${ft.showType(valueCodec)}`;
            }
          }
          return true;
        }),
    });
}

const MyMapCodec = MapCodec(ft.Number, ft.String);
// => Codec<Map<number, string>>

type MyMap = ft.Static<typeof MyMapCodec>;
// => Map<number, string>

// ✅ Parses an array of tuples to a JavaScript Map
assert.deepEqual(
  MyMapCodec.parse([[42, "Forbes Lindesay"]]),
  new Map([[42, "Forbes Lindesay"]]),
);

// ✅ Serializes a JavaScript Map to an array of
//    tuples
assert.deepEqual(
  MyMapCodec.serialize(
    new Map([[42, "Forbes Lindesay"]]),
  ),
  [[42, "Forbes Lindesay"]],
);
```

## Migrating old data

We can use a `ParsedValue` to handle migrating old data. For this use case, we only really need to specify the `parse` method.

```ts
import * as ft from "funtypes";

const LegacyUserCodec = ft.Object({
  id: ft.Number,
});
const ModernUserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});
const UserCodec = ft.Union(
  ModernUserCodec,
  // If the data doesn't match the ModernUserCodec,
  // Funtypes will try matching it against the
  // LegacyUserCodec instead, and if it's successful,
  // Funtypes will transform the value using the
  // `parse` function we provide here.
  LegacyUserCodec.withParser({
    parse(user) {
      return {
        success: true,
        value: { ...user, name: "Anonymous" },
      };
    },
  }),
);
// => Codec<{ id: number; name: string }>

// ✅ The legacy user will be migrated by adding a
//    default value for the new "name" property.
assert.deepEqual(
  UserCodec.parse({
    id: 42,
  }),
  {
    id: 42,
    name: "Anonymous",
  },
);

// ✅ The modern user matches the modern user
//    codec.
assert.deepEqual(
  UserCodec.parse({
    id: 42,
    name: "Forbes Lindesay",
  }),
  {
    id: 42,
    name: "Forbes Lindesay",
  },
);

// ✅ Serializing uses the modern user codec.
assert.deepEqual(
  UserCodec.serialize({
    id: 42,
    name: "Forbes Lindesay",
  }),
  {
    id: 42,
    name: "Forbes Lindesay",
  },
);

// 🚨 Serializing can only use the modern user
//    codec.
assert.throws(() => {
  // TypeScript knows you can only pass a ModernUser
  // to the serialize method.
  // @ts-expect-error
  UserCodec.serialize({
    id: 42,
  });
});
```
