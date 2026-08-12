---
title: Standard Schema & JSON Schema
nextjs:
  metadata:
    title: Standard Schema & JSON Schema
    description: Use Funtypes with the Standard Schema spec, and generate JSON Schema from Funtypes Codecs
---

[Standard Schema](https://standardschema.dev/) is a common interface that several TypeScript validation libraries (including Funtypes) implement, so that tools like form libraries, API frameworks and LLM function-calling integrations can accept a schema from **any** compatible library without needing a dedicated integration for each one.

Standard Schema is made up of two related specs:

- The core spec lets a tool call `schema['~standard'].validate(value)` to validate an unknown value, without needing to know which library created the schema.
- The [JSON Schema extension](https://standardschema.dev/#json-schema) additionally lets a tool call `schema['~standard'].jsonSchema.input(...)`/`.output(...)` to get a plain [JSON Schema](https://json-schema.org/) representation of the type - useful for things like OpenAPI docs or LLM tool/function definitions.

## Every Codec is already a Standard Schema

You don't need to do anything special to get basic Standard Schema support - every `Codec` you create with Funtypes already implements the core spec, using `Codec.safeParse` under the hood:

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});

assert.deepEqual(
  UserCodec["~standard"].vendor,
  "funtypes",
);
assert.deepEqual(UserCodec["~standard"].version, 1);

// ✅ Valid value
assert.deepEqual(
  UserCodec["~standard"].validate({
    id: 1,
    name: "Bob",
  }),
  { value: { id: 1, name: "Bob" } },
);

// 🚨 Invalid value - `issues` is populated
//    instead of `value`
const result = UserCodec["~standard"].validate({
  id: "not a number",
  name: "Bob",
});
assert.deepEqual("issues" in result, true);
```

This is enough for anything that only needs the core Standard Schema spec. If you also want the JSON Schema extension, or want to customize how validation behaves, use `ft.toStandardJsonSchema`.

## ft.toStandardJsonSchema

`ft.toStandardJsonSchema(codec, options?)` wraps a `Codec` in an object that implements both halves of the Standard Schema spec: `~standard.validate`, and `~standard.jsonSchema.input`/`.output`.

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  role: ft.WithDefault(ft.String, "member"),
});

const schema = ft.toStandardJsonSchema(UserCodec);

// ✅ `validate` behaves like `safeParse` by
//    default, so the default is applied
assert.deepEqual(
  schema["~standard"].validate({ id: 1 }),
  { value: { id: 1, role: "member" } },
);

assert.deepEqual(
  schema["~standard"].jsonSchema.output({
    target: "draft-2020-12",
  }),
  {
    type: "object",
    properties: {
      id: { type: "number" },
      role: { type: "string", default: "member" },
    },
    required: ["id", "role"],
  },
);
```

{% callout title="target is accepted, but ignored" %}
The Standard Schema spec lets a caller ask for a specific JSON Schema `target` (e.g. `"draft-07"`, `"draft-2020-12"` or `"openapi-3.0"`). Funtypes accepts this parameter, to comply with the spec, but currently produces the same output regardless of which target you ask for.
{% /callout %}

### options.validateMode

By default, `~standard.validate` calls `Codec.safeParse`. You can change this with `validateMode`:

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({ name: ft.String });

// Use safeSerialize instead of safeParse
const serializeSchema = ft.toStandardJsonSchema(
  UserCodec,
  { validateMode: "serialize" },
);

// Use assert (and catch the thrown
// ValidationError) instead of safeParse
const assertSchema = ft.toStandardJsonSchema(
  UserCodec,
  { validateMode: "assert" },
);
```

### options.jsonSchemaMode

A `Codec` can have a different shape before parsing (the "serialized"/wire shape) than after parsing (the "parsed" shape) - see [`ParsedValue`](/docs/types-parsed-value) and [`WithDefault`](/docs/types-with-default). By default, `jsonSchema.input` describes the **serialized** shape (what you're allowed to send in), and `jsonSchema.output` describes the **parsed** shape (what you get back). You can override either independently:

```ts
import * as ft from "funtypes";

const schema = ft.toStandardJsonSchema(SomeCodec, {
  jsonSchemaMode: {
    input: "serialized", // the default
    output: "parsed", // the default
  },
});
```

### options.namedRefs

By default, a [`ft.Named`](/docs/types-named) type (along with `ft.Brand` or a named [`ft.Constraint`](/docs/types-constraint)) is extracted into a top-level `$defs` map and referenced with `$ref` - see [Enriching the generated schema](#enriching-the-generated-schema) below. Some tools that consume JSON Schema don't support `$ref`/`$defs`, so you can set `namedRefs: false` to inline the full schema at every usage site instead. The `title` is still set to the name, but no `$ref` or `$defs` are produced:

```ts
import * as ft from "funtypes";

const Point = ft.Named(
  "Point",
  ft.Object({ x: ft.Number, y: ft.Number }),
);
const LineCodec = ft.Object({ from: Point, to: Point });

const schema = ft.toStandardJsonSchema(LineCodec, {
  namedRefs: false,
});

assert.deepEqual(
  schema["~standard"].jsonSchema.output({
    target: "draft-2020-12",
  }),
  {
    type: "object",
    properties: {
      from: {
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
        },
        required: ["x", "y"],
        title: "Point",
      },
      to: {
        type: "object",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
        },
        required: ["x", "y"],
        title: "Point",
      },
    },
    required: ["from", "to"],
  },
);
```

{% callout title="This also inlines repeated types" type="warning" %}
With `namedRefs: false`, a type used more than once (like `Point` above) is no longer de-duplicated - it's fully inlined at every usage site instead of being defined once and referenced. For deeply nested or widely reused types, this can make the resulting schema significantly larger.
{% /callout %}

## ft.toJsonSchema

If you just want a plain [JSON Schema](https://json-schema.org/) object, without the Standard Schema wrapper, use `ft.toJsonSchema(codec, options?)` directly:

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});

// `options` defaults to `{ mode: "parsed" }`
assert.deepEqual(ft.toJsonSchema(UserCodec), {
  type: "object",
  properties: {
    id: { type: "number" },
    name: { type: "string" },
  },
  required: ["id", "name"],
});
```

Pass `{ mode: "serialized" }` to describe the pre-parse/wire shape instead of the parsed shape:

```ts
ft.toJsonSchema(SomeCodec, { mode: "serialized" });
```

It also accepts `namedRefs: false`, which behaves the same as the [`ft.toStandardJsonSchema` option of the same name](#options-named-refs) described above:

```ts
ft.toJsonSchema(SomeCodec, { namedRefs: false });
```

## Enriching the generated schema

A few utilities are picked up automatically when generating JSON Schema:

- [`ft.WithComment`](/docs/types-with-comment) adds a `title`/`description`.
- [`ft.WithDefault`](/docs/types-with-default) adds a `default`, and marks the property optional/`nullable` in the serialized shape.
- [`ft.Sealed`](/docs/types-sealed) adds `additionalProperties: false`.
- [`ft.Named`](/docs/types-named), `ft.Brand`, or a named [`ft.Constraint`](/docs/types-constraint) are extracted into `$defs`, and referenced with a `$ref` - the same underlying type used more than once is de-duplicated to a single `$defs` entry.

```ts
import * as ft from "funtypes";

const UserCodec = ft.Sealed(
  ft.Object({
    id: ft.WithComment(
      { title: "User ID" },
      ft.Number,
    ),
    role: ft.WithDefault(ft.String, "member"),
  }),
);

assert.deepEqual(ft.toJsonSchema(UserCodec), {
  type: "object",
  properties: {
    id: { type: "number", title: "User ID" },
    role: { type: "string", default: "member" },
  },
  required: ["id", "role"],
  additionalProperties: false,
});
```

If you're using [`Codec.withParser`](/docs/funtypes-api-withparser) (i.e. [`ft.ParsedValue`](/docs/types-parsed-value)) for a type that can't be represented well as JSON Schema, you can take full control by providing a `toJsonSchema` callback in the options passed to `withParser`:

```ts
import * as ft from "funtypes";

const CommaSeparatedStrings = ft.String.withParser({
  parse: (v) => ({
    success: true,
    value: v.split(","),
  }),
  serialize: (v) => ({
    success: true,
    value: v.join(","),
  }),
  toJsonSchema: () => ({
    type: "string",
    description: "A comma separated list",
  }),
});
```

## Types that can't be represented in JSON Schema

A few Funtypes constructs have no JSON Schema equivalent, and `ft.toJsonSchema`/`ft.toStandardJsonSchema` will throw a descriptive error if you try to convert one:

- [`ft.BigInt`](/docs/types-primitive), `ft.Function` and `ft.Symbol`
- [`ft.InstanceOf`](/docs/types-instanceof)
- [`ft.Lazy`](/docs/types-lazy) (recursive types)
- `ft.Undefined`/[`ft.Optional`](/docs/types-union#ft-optional) used somewhere other than directly as a property of an `ft.Object`, since JSON Schema has no way to say a value itself may be `undefined`
