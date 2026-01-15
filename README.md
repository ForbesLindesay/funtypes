# Funtypes

### Safely bring untyped data into the fold

Funtypes allow you to take values about which you have no assurances and check that they conform to some type `A`.
This is done by means of composable type validators of primitives, literals, arrays, tuples, records, unions,
intersections and more.

[![Build Status](https://img.shields.io/github/actions/workflow/status/ForbesLindesay/funtypes/test.yml?event=push&style=for-the-badge)](https://github.com/ForbesLindesay/funtypes/actions?query=workflow%3ATest+branch%3Amaster)
[![Coveralls github branch](https://img.shields.io/coveralls/github/ForbesLindesay/funtypes/master?color=brightgreen&style=for-the-badge)](https://coveralls.io/github/ForbesLindesay/funtypes)
[![Rolling Versions](https://img.shields.io/badge/Rolling%20Versions-Enabled-brightgreen?style=for-the-badge)](https://rollingversions.com/ForbesLindesay/funtypes)
[![NPM version](https://img.shields.io/npm/v/funtypes?style=for-the-badge)](https://www.npmjs.com/package/funtypes)

> This library is a fork of the excellent [runtypes](https://github.com/pelotom/runtypes) by Tom Crockett

## Installation

```
npm install --save funtypes
```

## Example

Suppose you have objects which represent asteroids, planets, ships and crew members. In TypeScript, you might write their types like so:

```ts
type Vector = [number, number, number];

type Asteroid = {
  type: 'asteroid';
  location: Vector;
  mass: number;
};

type Planet = {
  type: 'planet';
  location: Vector;
  mass: number;
  population: number;
  habitable: boolean;
};

type Rank = 'captain' | 'first mate' | 'officer' | 'ensign';

type CrewMember = {
  name: string;
  age: number;
  rank: Rank;
  home: Planet;
};

type Ship = {
  type: 'ship';
  location: Vector;
  mass: number;
  name: string;
  crew: CrewMember[];
};

type SpaceObject = Asteroid | Planet | Ship;
```

If the objects which are supposed to have these shapes are loaded from some external source, perhaps a JSON file, we need to
validate that the objects conform to their specifications. We do so by building corresponding `Runtype`s in a very straightforward
manner:

```ts
import { Boolean, Number, String, Literal, Array, Tuple, Object, Union } from 'funtypes';

const Vector = Tuple(Number, Number, Number);

const Asteroid = Object({
  type: Literal('asteroid'),
  location: Vector,
  mass: Number,
});

const Planet = Object({
  type: Literal('planet'),
  location: Vector,
  mass: Number,
  population: Number,
  habitable: Boolean,
});

const Rank = Union(
  Literal('captain'),
  Literal('first mate'),
  Literal('officer'),
  Literal('ensign'),
);

const CrewMember = Object({
  name: String,
  age: Number,
  rank: Rank,
  home: Planet,
});

const Ship = Object({
  type: Literal('ship'),
  location: Vector,
  mass: Number,
  name: String,
  crew: Array(CrewMember),
});

const SpaceObject = Union(Asteroid, Planet, Ship);
```

(See the [examples](examples) directory for an expanded version of this.)

Now if we are given a putative `SpaceObject` we can validate it like so:

```ts
// spaceObject: SpaceObject
const spaceObject = SpaceObject.parse(obj);
```

If the object doesn't conform to the type specification, `parse` will throw an exception.

## Static type inference

In TypeScript, the inferred type of `Asteroid` in the above example is

```ts
Codec<{
  type: 'asteroid'
  location: [number, number, number]
  mass: number
}>
```

That is, it's a `Codec<Asteroid>`, and you could annotate it as such. But we don't really have to define the
`Asteroid` type in TypeScript at all now, because the inferred type is correct. Defining each of your types
twice, once at the type level and then again at the value level, is a pain and not very [DRY](https://en.wikipedia.org/wiki/Don't_repeat_yourself).
Fortunately you can define a static `Asteroid` type which is an alias to the `Codec`-derived type like so:

```ts
import { Static } from 'funtypes';

type Asteroid = Static<typeof Asteroid>;
```

which achieves the same result as

```ts
type Asteroid = {
  type: 'asteroid';
  location: [number, number, number];
  mass: number;
};
```

## Type guards

In addition to providing a `parse` method, funtypes can be used as [type guards](https://basarat.gitbook.io/typescript/type-system/typeguard):

```ts
function disembark(obj: {}) {
  if (SpaceObject.test(obj)) {
    // obj: SpaceObject
    if (obj.type === 'ship') {
      // obj: Ship
      obj.crew = [];
    }
  }
}
```

## Constraint checking

Beyond mere type checking, we can add arbitrary runtime constraints to a `Codec`:

```ts
const Positive = Constraint(Number, n => n > 0);

Positive.check(-3); // Throws error: Failed constraint check
```

You can provide more descriptive error messages for failed constraints by returning
a string instead of `false`:

```ts
const Positive = Constraint(Number, n => n > 0 || `${n} is not positive`);

Positive.check(-3); // Throws error: -3 is not positive
```

You can set a custom name for your runtype, which will be used in default error
messages and reflection, by using the `name` prop on the optional `options`
parameter: 

```typescript
const C = Constraint(Number, n => n > 0, {name: 'PositiveNumber'});
```

To change the type, you can explicitly specify the underlying type and the
constrained type when calling `Constrain`. Note that TypeScript will not
check that your constraint function actually validates that the value is the
constrained type.

```typescript
type Email = `${string}@${string}`
const EmailSchema = Constraint<string, Email>(String, e => e.includes('@'), {name: 'Email'});
```

## Custom Type Validators

The easiest way to add your own custom types is using the `Guard` function.
TypeScript will infer the type for your codec from the function you provide.

```typescript
// use Buffer.isBuffer, which is typed as: isBuffer(obj: any): obj is Buffer;
const B = Guard(Buffer.isBuffer, { name: "Buffer" });
type T = Static<typeof B>; // T is Buffer
```

However, if you want to return a custom error message from your constraint
function, you can't do this with a type guard because these functions can only
return boolean values.  Instead, you can roll your own constraint function and
use the `Constraint<TUnderlying, TParsed>()` method. Remember to specify the type parameter for
the `Constraint` because it can't be inferred from your check function!

```typescript
const check = (o: any) => Buffer.isBuffer(o) || 'Dude, not a Buffer!';
const B = Constraint<unknown, Buffer>(Unknown, check);
type T = Static<typeof B>; // T will have type of `Buffer`
```

One important choice when changing `Constraint` static types is choosing the
correct underlying type. The implementation of `Constraint` will validate the
underlying type *before* running your constraint function. So it's important to
use a lowest-common-denominator type that will pass validation for all expected
inputs of your constraint function or type test.  If there's no obvious
lowest-common-denominator type, you can always use `Unknown` as the underlying
type, as shown in the `Buffer` examples above.  

## Optional values

Funtypes can be used to represent a variable that may be null or undefined
as well as representing keys within records that may or may not be present.

```ts
// For variables that might be undefined or null
const MyString = String;                        // string             (e.g. 'text')
const MyStringMaybe = Union(String, Undefined); // string | undefined (e.g. 'text', undefined)
const MyStringNullable = Union(String, Null);   // string | null      (e.g. 'text', null)
const MyOtherStringNullable = Nullable(String); // Equivalent to Union(String, Null)
```

If a `Object` may or may not have some keys, we can declare the optional
keys using `myRecord.And(Partial({ ... }))`.  Partial keys validate successfully if
they are absent or undefined (but not null) or the type specified
(which can be null).

```ts
// Using `Ship` from above
const RegisteredShip = Intersect(
  Ship,
  Object({
    // All registered ships must have this flag
    isRegistered: Literal(true),
  }),
  Partial({
    // We may or may not know the ship's classification
    shipClass: Union(Literal('military'), Literal('civilian')),

    // We may not know the ship's rank (so we allow it to be undefined via `Partial`),
    // we may also know that a civilian ship doesn't have a rank (e.g. null)
    rank: Nullable(Rank),
  })
);
```

If a record has keys which _must be present_ but can be null, then use
the `Object` runtype normally instead.

```ts
const MilitaryShip = Intersect(
  Ship,
  Object({
    shipClass: Literal('military'),
    
    // Must NOT be undefined, but can be null
    lastDeployedTimestamp: Nullable(Number),
  })
);
```

## Readonly records and arrays

Arrays, Objects, Tuples and Intersections of Arrays, Objects and Tuples can be made `readonly` using the `Readonly` helper:

For example:

```typescript
const Asteroid = Readonly(
  Object({
    type: Literal('asteroid'),
    location: Vector,
    mass: Number,
  })
)

Static<typeof Asteroid> // { readonly type: 'asteroid', readonly location: Vector, readonly mass: number }

const AsteroidArray = Readonly(Array(Asteroid))

Static<typeof AsteroidArray> // ReadonlyArray<Asteroid>
```

You can also use `ReadonlyArray`, `ReadonlyObject`, `ReadonlyPartial`, `ReadonlyTuple` as shorthands if you know you want read only variants, and you can import from `funtypes/readonly` instead of importing from `funtypes` to default to read only for all types.

## Partial, Pick, Omit

Objects (and intersections of objects) can be manipulated using `Partial`, `Pick` and `Omit` just like they can in TypeScript.

```typescript
const Asteroid = Object({
  type: Literal('asteroid'),
  location: Vector,
  mass: Number,
})
const PartialAsteroid = Partial(Asteroid) // Codec<{ type?: "asteroid"; location?: Vector; mass?: number }>
const MassObj = Pick(Asteroid, ["mass"]) // Codec<{ mass: number }>
const TypeAndLocObj = Omit(Asteroid, ["mass"]) // Codec<{ type: "asteroid"; location: Vector }>
```