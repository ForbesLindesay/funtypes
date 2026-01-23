---
title: Why Funtypes?
---

It's important for security that you validate any un-trusted data, such as the JSON body of a request to your backend API. It's also hugely helpful for troubleshooting issues, as you can have a clear error as soon as you get the data that doesn't match your TypeScript types, rather than an obscure error about some undefined value or method, buried several layers deep in function calls.

There are lots of other libraries for doing runtime validation of data though, so what makes Funtypes special?

## Excellent Type Inference

Once you define an object Codec in Funtypes, Funtypes can also generate the static type for you so you never need any unsafe type casts and you don't need to repeat yourself. For example, here we get the `User` type from the codec, without needing to re-define the properties of the type.

```ts
import * as ft from "funtypes";

const UserCodec = ft.Object({
  id: ft.Number,
  name: ft.String,
});
// => Codec<{ id: number; name: string }>

type User = ft.Static<typeof UserCodec>;
// => { id: number; name: string }

// Returns a `User` type, throws if requestBody
// is not a valid User
function asUser(requestBody: unknown) {
  return UserCodec.parse(requestBody);
}
```

## Useful Errors

Funtypes always provides the detail you need in error messages to figure out **why** the object you passed in doesn't match the Codec. Every other library I've tried has error messages that are difficult to understand, especially when dealing with unions of many different object types.

For example:

```ts
import * as ft from "funtypes";

const UserCodec = ft.Named(
  "User",
  ft.Object({
    type: ft.Literal("USER"),
    id: ft.Number,
    name: ft.String,
  }),
);
const PostCodec = ft.Named(
  "Post",
  ft.Object({
    type: ft.Literal("POST"),
    id: ft.Number,
    title: ft.String,
  }),
);
const ObjectCodec = ft.Union(
  UserCodec,
  PostCodec,
);

ObjectCodec.parse({
  type: "USER",
  id: 42,
  title: "Forbes Lindesay",
});
```

Outputs the validation error:

```txt
ValidationError: Unable to assign {type: "USER", id: 42, title: "Forbes Lindesay"} to User | Post
  Unable to assign {type: "USER", id: 42, title: "Forbes Lindesay"} to { type: "USER"; id: number; name: string }
    The types of "name" are not compatible
      Expected string, but was undefined
```

Funtypes can see that `type` is meant to determine which of the codecs in the Union to use, so it doesn't print a separate error for the PostCodec.

If we didn't include the `type`, we can still get a useful (albeit more verbose error):

```ts
import * as ft from "funtypes";

const UserCodec = ft.Named(
  "User",
  ft.Object({
    id: ft.Number,
    name: ft.String,
  }),
);
const PostCodec = ft.Named(
  "Post",
  ft.Object({
    id: ft.Number,
    title: ft.String,
  }),
);
const ObjectCodec = ft.Union(
  UserCodec,
  PostCodec,
);

ObjectCodec.parse({ id: 42 });
```

```txt
ValidationError: Unable to assign {id: 42} to User | Post
  Unable to assign {id: 42} to { id: number; name: string }
    The types of "name" are not compatible
      Expected string, but was undefined
  And unable to assign {id: 42} to { id: number; title: string }
    The types of "title" are not compatible
      Expected string, but was undefined
```

This error can be read like a proof:

1. It first tells us `{id: 42}` is not assignable to `User | Post`.
2. Next, it tells us why it's not assignable to `User` - because it's missing the `name` property.
3. Finally, it tells us why it's not assignable to `Post` - because it's missing the `title` property.

Other validation libraries I've tested make that type of error nearly impossible to troubleshoot.

## Beyond Validation

Funtypes codecs are not just for validating, they can also simultaneously handle parsing and serializing. These things being integrated is extremely useful, as it means that once you've defined a "Codec" for some type that needs to be parsed and serialized, you can put it anywhere in your codecs and have it work transparently.

```ts
import * as ft from "funtypes";
import * as s from "funtypes-schemas";

const PostCodec = ft.Object({
  id: ft.Number,
  title: ft.String,
  url: s.ParsedUrlString(),
});

assert.deepEqual(
  PostCodec.parse({
    id: 42,
    title: "Example Post",
    url: "http://example.com",
  }),
  {
    id: 42,
    title: "Example Post",
    url: new URL("http://example.com"),
  },
);

assert.deepEqual(
  PostCodec.serialize({
    id: 42,
    title: "Example Post",
    url: new URL("http://example.com"),
  }),
  {
    id: 42,
    title: "Example Post",
    url: "http://example.com",
  },
);
```

## Handling Data Migration

Using Codecs that parse the value, not just validate it, you can create a Funtypes Codec that automatically migrates data from an older Codec:

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
```

## Small Bundle Size

Funtypes is small and is designed to support tree shaking, so if you don't use every feature you might get a bundle size as low as 2.37KB once GZipped [1](https://bundlejs.com/?q=funtypes%406.0.0&treeshake=%5B%7BString%7D%5D). If you use every feature, it's still just 6.43 kB once GZipped [2](https://bundlejs.com/?q=funtypes%406.0.0&treeshake=%5B*%5D).

## Easily Extendible

You can easily define custom types with additional constraints, and even Codecs for types that need custom parsing/serializing logic.

For more on this, check out [Constraint & Guard](/docs/types-constraint) or [ParsedValue](/docs/types-parsed-value).
