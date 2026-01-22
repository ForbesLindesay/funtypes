---
title: Getting started
---

Funtypes allow you to take values about which you have no assurances and check that they conform to some known type. It also lets you parse serialized values into rich objects. This is done by means of composable type validators of primitives, literals, arrays, tuples, records, unions,
intersections and more.

## Installation

```sh
npm install --save funtypes
```

## Example

Suppose you have objects which represent asteroids, planets, ships and crew members. In TypeScript, you might write their types like so:

```ts
type Vector = [number, number, number];

type Asteroid = {
  type: "asteroid";
  location: Vector;
  mass: number;
};

type Planet = {
  type: "planet";
  location: Vector;
  mass: number;
  population: number;
  habitable: boolean;
};

type Rank =
  | "captain"
  | "first mate"
  | "officer"
  | "ensign";

type CrewMember = {
  name: string;
  age: number;
  rank: Rank;
  home: Planet;
};

type Ship = {
  type: "ship";
  location: Vector;
  mass: number;
  name: string;
  crew: CrewMember[];
};

type SpaceObject = Asteroid | Planet | Ship;
```

If the objects which are supposed to have these shapes are loaded from some external source, perhaps a JSON file, we need to validate that the objects conform to their specifications. We do so by building corresponding `Codec`s in a similar structure to the TypeScript types:

```ts
import * as ft from "funtypes";

const VectorCodec = ft.Tuple(
  ft.Number,
  ft.Number,
  ft.Number,
);

const AsteroidCodec = ft.Object({
  type: ft.Literal("asteroid"),
  location: VectorCodec,
  mass: ft.Number,
});

const PlanetCodec = ft.Object({
  type: ft.Literal("planet"),
  location: VectorCodec,
  mass: ft.Number,
  population: ft.Number,
  habitable: ft.Boolean,
});

const RankCodec = ft.Union(
  ft.Literal("captain"),
  ft.Literal("first mate"),
  ft.Literal("officer"),
  ft.Literal("ensign"),
);

const CrewMemberCodec = ft.Object({
  name: ft.String,
  age: ft.Number,
  rank: RankCodec,
  home: PlanetCodec,
});

const ShipCodec = ft.Object({
  type: ft.Literal("ship"),
  location: VectorCodec,
  mass: ft.Number,
  name: ft.String,
  crew: ft.Array(CrewMemberCodec),
});

const SpaceObjectCodec = ft.Union(
  AsteroidCodec,
  PlanetCodec,
  ShipCodec,
);
```

Now if we are given a `SpaceObject` from an untrusted source, we can validate it like so:

```ts
// spaceObject: SpaceObject
const spaceObject = SpaceObjectCodec.parse(obj);
```

If the object doesn't conform to the type specification, `parse` will throw an exception.

## Static type inference

In TypeScript, the inferred type of `AsteroidCodec` in the above example is

```ts
ft.Codec<{
  type: "asteroid";
  location: [number, number, number];
  mass: number;
}>;
```

That is, it's a `Codec<Asteroid>`, and you could annotate it as such. But we don't really have to define the
`Asteroid` type in TypeScript at all now, because the inferred type is correct. Defining each of your types
twice, once at the type level and then again at the value level, is a pain and not very [DRY](https://en.wikipedia.org/wiki/Don't_repeat_yourself).
Fortunately you can define a static `Asteroid` type which is an alias to the `Codec`-derived type like so:

```ts
import * as ft from "funtypes";

type Asteroid = ft.Static<typeof AsteroidCodec>;
```

which achieves the same result as

```ts
type Asteroid = {
  type: "asteroid";
  location: [number, number, number];
  mass: number;
};
```
