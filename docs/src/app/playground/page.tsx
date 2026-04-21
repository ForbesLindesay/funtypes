// This playground doesn't let you run the code
'use client'
import { DocsHeader } from '@/components/DocsHeader'
import { PrevNextLinks } from '@/components/PrevNextLinks'
import { FUNTYPES_DEFINITIONS } from '@/lib/funtypes-definitions'
import { Editor } from '@monaco-editor/react'
import { useEffect, useState } from 'react'
import initSwc, { transformSync } from '@swc/wasm-web'
import * as funtypes from 'funtypes'
import * as funtypesReadOnly from 'funtypes/readonly'
import { Console, Hook, Unhook } from 'console-feed'

const DEFAULT_CODE = `import * as ft from "funtypes";

const VectorCodec = ft.Named(
  "Vector",
  ft.Tuple(
    ft.Number,
    ft.Number,
    ft.Number,
  ),
);

const AsteroidCodec = ft.Named(
  "Asteroid",
  ft.Object({
    type: ft.Literal("asteroid"),
    location: VectorCodec,
    mass: ft.Number,
  })
);

const PlanetCodec = ft.Named(
  "Planet",
  ft.Object({
    type: ft.Literal("planet"),
    location: VectorCodec,
    mass: ft.Number,
    population: ft.Number,
    habitable: ft.Boolean,
  }),
);

const RankCodec = ft.Named(
  "Rank",
  ft.Union(
    ft.Literal("captain"),
    ft.Literal("first mate"),
    ft.Literal("officer"),
    ft.Literal("ensign"),
  ),
);

const CrewMemberCodec = ft.Named(
  "CrewMember",
  ft.Object({
    name: ft.String,
    age: ft.Number,
    rank: RankCodec,
    home: PlanetCodec,
  }),
);

const ShipCodec = ft.Named(
  "Ship",
  ft.Object({
    type: ft.Literal("ship"),
    location: VectorCodec,
    mass: ft.Number,
    name: ft.String,
    crew: ft.Array(CrewMemberCodec),
  }),
);

const SpaceObjectCodec = ft.Union(
  AsteroidCodec,
  PlanetCodec,
  ShipCodec,
);

try {
  const invalidShip = {
    type: "ship",
    name: "SS Funtypes",
  };
  SpaceObjectCodec.parse(invalidShip);
} catch (e) {
  console.error(e.message);
}
`
let hasAddedDefinitions = false
let swcInitPromise: undefined | Promise<unknown> = undefined
export default function Playground() {
  const [code, setCode] = useState(() => {
    try {
      const savedCode = localStorage.getItem('funtypes-playground-code')
      if (savedCode) {
        return savedCode
      }
    } catch {
      // ignore error loading saved code
    }
    return DEFAULT_CODE
  })
  const [logs, setLogs] = useState<any[]>([])
  const [loaded, setLoaded] = useState<boolean>(false)
  useEffect(() => {
    if (!swcInitPromise) {
      swcInitPromise = initSwc()
    }
    swcInitPromise.then(() => setLoaded(true))
  }, [])
  useEffect(() => {
    if (!loaded) return
    const timeout = setTimeout(() => {
      const logs: any[] = []
      const hookedConsole = Hook(window.console, (log) => logs.push(log), false)
      try {
        const js = transformSync(code, {
          filename: 'playground.ts',
          isModule: true,
          module: {
            type: 'commonjs',
          },
        })
        let passedAssertions = 0
        const exp = {}
        Function(
          'require',
          'exports',
          'module',
          js.code,
        )(
          (name: string) => {
            if (name === 'funtypes') {
              return funtypes
            }
            if (name === 'funtypes/readonly') {
              return funtypesReadOnly
            }
            if (name === 'assert') {
              return {
                deepEqual: (a: any, b: any) => {
                  if (!deepEqual(a, b)) {
                    throw new Error(
                      `Assertion failed: \n${JSON.stringify(a, null, 2)} is not equal to \n${JSON.stringify(b, null, 2)}`,
                    )
                  }
                  passedAssertions++
                },
                throws: (fn: () => void) => {
                  let threw = false
                  try {
                    fn()
                  } catch {
                    threw = true
                  }
                  if (!threw) {
                    throw new Error(`Assertion failed: function did not throw`)
                  }
                  passedAssertions++
                },
              }
            }
            throw new Error(`Cannot find module '${name}'`)
          },
          exp,
          { exports: exp },
        )
        if (passedAssertions) {
          console.log(
            `✅ All ${passedAssertions.toLocaleString()} assertions passed`,
          )
        }
        try {
          if (code !== DEFAULT_CODE) {
            localStorage.setItem('funtypes-playground-code', code)
          } else {
            localStorage.removeItem('funtypes-playground-code')
          }
        } catch {
          // ignore error writing to local storage
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLogs(logs)
        Unhook(hookedConsole)
      }
    }, 500)
    return () => {
      clearTimeout(timeout)
    }
  }, [code, loaded])
  return (
    <div className="max-w-2xl min-w-0 flex-auto px-4 py-16 lg:max-w-none lg:pr-0 lg:pl-8 xl:px-16">
      <article>
        <DocsHeader title="Funtypes Playground" />
        <div className="hidden md:block">
          <div className="flex" style={{ height: '70vh' }}>
            <div className="flex-grow basis-0 rounded-sm border border-gray-200 shadow-sm">
              <Editor
                height="100%"
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
                  m.languages.typescript.typescriptDefaults.setCompilerOptions({
                    ...m.languages.typescript.typescriptDefaults.getCompilerOptions(),
                    strict: true,
                  })
                  m.languages.typescript.typescriptDefaults.setExtraLibs([
                    { content: FUNTYPES_DEFINITIONS },
                    {
                      content: `declare module "assert" {
                      export function deepEqual(a: any, b: true): asserts a is true;
                      export function deepEqual(a: any, b: false): asserts a is false;
                      export function deepEqual(a: any, b: any): void;
                      export function throws(fn: () => void): void;
                    }`,
                    },
                  ])
                }}
              />
            </div>
            <div className="w-4" />
            <div className="flex flex-grow basis-0 flex-col overflow-hidden rounded-sm border border-gray-200 bg-white text-gray-900 shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div>Console Output</div>
                {/* <button
                className={`m-1 rounded-full p-2 text-gray-500 hover:bg-gray-200 ${logs.length ? 'opacity-100' : 'opacity-0'}`}
                title="Clear console"
                onClick={() => setLogs([])}
              >
                <svg viewBox="-2 -2 36 36" width="24" height="24">
                  <circle
                    cx="16"
                    cy="16"
                    r="15"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <line
                    x1="5"
                    y1="26"
                    x2="26"
                    y2="5"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
              </button> */}
              </div>
              <div className="overflow-scroll">
                <Console logs={logs} variant="light" />
              </div>
            </div>
          </div>
          {code !== DEFAULT_CODE ? (
            <button
              className="mt-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
              type="button"
              onClick={() => {
                setCode(DEFAULT_CODE)
              }}
            >
              Reset Playground
            </button>
          ) : null}
        </div>
        <div className="md:hidden">
          Not enough width to show the playground. Please use a larger screen.
        </div>
        {/* <button
          type="button"
          onClick={async () => {
            setLogs([])
            const hookedConsole = Hook(
              window.console,
              (log) => setLogs((currentLogs) => [...currentLogs, log]),
              false,
            )
            try {
              await loaded
              const js = transformSync(code, {
                filename: 'playground.ts',
                isModule: true,
                module: {
                  type: 'commonjs',
                },
              })
              const exp = {}
              Function(
                'require',
                'exports',
                'module',
                js.code,
              )(
                (name: string) => {
                  if (name === 'funtypes') {
                    return funtypes
                  }
                  if (name === 'funtypes/readonly') {
                    return funtypesReadOnly
                  }
                  throw new Error(`Cannot find module '${name}'`)
                },
                exp,
                { exports: exp },
              )
            } catch (e) {
              console.error(e)
            } finally {
              Unhook(hookedConsole)
            }
          }}
        >
          run
        </button> */}
      </article>
      <PrevNextLinks />
    </div>
  )
}

function deepEqual(a: any, b: any): boolean {
  return deepEqualInternal(a, b, new Map())
}
function deepEqualInternal(a: any, b: any, seen: Map<any, any>): boolean {
  if (a === b) return true
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false
  }
  const right = seen.get(a)
  if (b === right) {
    return true
  }
  seen.set(a, b)
  try {
    if (Array.isArray(a)) {
      if (!Array.isArray(b)) return false
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (!deepEqualInternal(a[i], b[i], seen)) return false
      }
      return true
    }
    if (a instanceof URL) {
      if (!(b instanceof URL)) return false
      return a.href === b.href
    }
    if (b instanceof URL) return false

    if (a instanceof Date) {
      if (!(b instanceof Date)) return false
      return a.getTime() === b.getTime()
    }
    if (b instanceof Date) return false

    if (a instanceof Uint8Array) {
      if (!(b instanceof Uint8Array)) return false
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
      }
      return true
    }
    if (b instanceof Uint8Array) return false

    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    for (const key of aKeys) {
      if (!bKeys.includes(key)) return false
      if (!deepEqualInternal(a[key], b[key], seen)) return false
    }
    return true
  } finally {
    seen.delete(a)
  }
}
