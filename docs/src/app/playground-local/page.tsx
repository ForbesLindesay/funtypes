// This playground doesn't let you run the code
'use client'
import { DocsHeader } from '@/components/DocsHeader'
import { PrevNextLinks } from '@/components/PrevNextLinks'
import { FUNTYPES_DEFINITIONS } from '@/lib/funtypes-definitions'
import { Editor } from '@monaco-editor/react'
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
`
let hasAddedDefinitions = false
export default function CustomPage() {
  const [code, setCode] = useState(DEFAULT_CODE)
  return (
    <div className="max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <article>
        <DocsHeader title="Funtypes Playground" />
        <Editor
          height="70vh"
          value={code}
          onChange={(value) => setCode(value ?? '')}
          language="typescript"
          options={{
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
          beforeMount={(m) => {
            if (hasAddedDefinitions) return
            hasAddedDefinitions = true
            // Any other modules we allow users to import can have definitions added here
            m.languages.typescript.typescriptDefaults.setExtraLibs([
              { content: FUNTYPES_DEFINITIONS },
            ])
          }}
        />
      </article>
      <PrevNextLinks />
    </div>
  )
}
