// This playground doesn't let you run the code
'use client'
import { DocsHeader } from '@/components/DocsHeader'
import { PrevNextLinks } from '@/components/PrevNextLinks'
import { FUNTYPES_DEFINITIONS } from '@/lib/funtypes-definitions'
import { Sandpack } from '@codesandbox/sandpack-react'
import { useState } from 'react'

const DEFAULT_CODE = `import * as ft from "funtypes";

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

console.log("hello world")
`
let hasAddedDefinitions = false
export default function CustomPage() {
  const [code, setCode] = useState(DEFAULT_CODE)
  return (
    <div className="max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <article>
        <DocsHeader title="Funtypes Playground" />
        <Sandpack
          customSetup={{
            dependencies: {
              funtypes: '6.0.0',
            },
            devDependencies: {
              typescript: '5.9.3',
            },
            entry: '/index.ts',
            environment: 'parcel',
          }}
          files={{
            // '/package.json': JSON.stringify({
            //   // dependencies: {
            //   //   funtypes: '6.0.0',
            //   // },
            //   // devDependencies: {
            //   //   typescript: '5.9.3',
            //   // },
            //   scripts: {
            //     start: 'node --strip-types index.ts',
            //   },
            // }),
            '/index.ts': DEFAULT_CODE,
          }}
        />
      </article>
      <PrevNextLinks />
    </div>
  )
}
