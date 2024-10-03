const { spawnSync } = require('child_process');
const { mkdtempSync, writeFileSync, mkdirSync, readFileSync } = require('fs');
const { tmpdir } = require('os');
const { join, resolve, relative } = require('path');

const { parse } = require('@babel/parser');

function getExports(filename) {
  const ast = parse(readFileSync(`${__dirname}/../${filename}`, `utf8`), {
    plugins: [`typescript`],
    sourceType: 'module',
    sourceFilename: filename,
  });
  const exports = { value: [], type: [] };
  for (const statement of ast.program.body) {
    switch (statement.type) {
      case 'ExpressionStatement':
      case 'ImportDeclaration':
        break;
      case 'ExportNamedDeclaration':
        for (const specifier of statement.specifiers) {
          const exportKind =
            specifier.exportKind === 'type' ? 'type' : statement.exportKind ?? 'value';
          exports[exportKind].push(specifier.exported.name);
        }
        break;
      default:
        console.log(statement);
        process.exit(1);
    }
  }
  return { filename, value: new Set(exports.value), type: new Set(exports.type) };
}

const mutableExports = getExports(`src/index.ts`);

console.info(`$ npm pack`);
inheritExit(spawnSync(`npm`, [`pack`], { cwd: join(__dirname, `..`), stdio: `inherit` }));

const OUTPUTS = [
  {
    name: `test.cjs`,
    header: [
      `const { strictEqual } = require('assert');`,
      `const t = require('funtypes');`,
      `const r = require('funtypes/readonly');`,
    ],
  },
  {
    name: `test.mjs`,
    header: [
      `import { strictEqual } from 'assert';`,
      `import * as t from 'funtypes';`,
      `import * as r from 'funtypes/readonly';`,
    ],
  },
];

const assertions = [
  ...[`Readonly`, `Object`, `Record`].flatMap(n => [
    `strictEqual(typeof t.${n}, 'function', "${n} should be a function in the default 'funtypes' entrypoint");`,
    `strictEqual(typeof r.${n}, 'function', "${n} should be a function in the 'funtypes/readonly' entrypoint");`,
  ]),
  ...[...mutableExports.value]
    .sort()
    .flatMap(n => [
      `strictEqual(t.${n} === undefined, false, "${n} should be exported in the default 'funtypes' entrypoint");`,
      `strictEqual(typeof t.${n}, typeof r.${n}, "${n} should have the same type in both entrypoints");`,
    ]),
  `strictEqual(t.Object({}).isReadonly, false, "Object should not be readonly in the default 'funtypes' entrypoint");`,
  `strictEqual(r.Object({}).isReadonly, true, "Object should be readonly in the 'funtypes/readonly' entrypoint");`,
];

const dir = mkdtempSync(join(tmpdir(), `funtypes`));
for (const { name, header } of OUTPUTS) {
  writeFileSync(
    join(dir, name),
    [...header, ``, ...assertions, ``, `console.log("✅ ${name} Import Tests Passed")`, ``].join(
      `\n`,
    ),
  );
}

mkdirSync(join(dir, `src`));
writeFileSync(
  join(dir, `src`, `test.ts`),
  [
    `import { strictEqual } from 'assert';`,
    `import * as t from 'funtypes';`,
    `import * as r from 'funtypes/readonly';`,
    ``,
    `export const schemaA = t.Object({value: t.String});`,
    `export const schemaB = r.Object({value: t.String});`,
    `export const schemaC = t.Named("MySchema",`,
    `  t.Union(`,
    `    t.Object({ kind: t.Literal("string"), value: t.String }),`,
    `    t.Object({ kind: t.Literal("number"), value: t.Number }),`,
    `  ),`,
    `);`,
    `export type schemaCType = t.Static<typeof schemaC>;`,
    `export type schemaCTypeNotInferred = { kind: "string", value: string } | { kind: "number", value: number }`,
    `export function doubleNumbers(value: schemaCTypeNotInferred): schemaCTypeNotInferred {`,
    `  if (value.kind === "number") return { kind: "number", value: value.value * 2 };`,
    `  return value;`,
    `}`,
    `export function doubleNumbersX(value: unknown): schemaCTypeNotInferred {`,
    `  return doubleNumbers(schemaC.parse(value));`,
    `}`,
    ``,
    `const valueA = schemaA.parse({value: 'hello world'});`,
    `valueA.value = 'updated value';`,
    ``,
    `const valueB = schemaB.parse({value: 'hello world'});`,
    `// @ts-expect-error - valueB.value is readonly`,
    `valueB.value = 'updated value';`,
    ``,
    `valueA.value = valueB.value`,
    ``,
    ...assertions,
    ``,
    'console.log(`✅ TypeScript Import Tests Passed ${process.argv[2]}`)',
    ``,
  ].join(`\n`),
);

writeFileSync(
  join(dir, `package.json`),
  JSON.stringify({
    name: 'funtypes-test-import',
    private: true,
    dependencies: {
      '@types/node': '^22.7.4',
      typescript: '5.6.2',
    },
    scripts: {
      typecheck: 'tsc --build',
    },
  }) + `\n`,
);

console.info(`$ npm install`);
inheritExit(spawnSync(`npm`, [`install`], { cwd: dir, stdio: `inherit` }));

const packPath = relative(
  join(dir, `package.json`),
  resolve(join(__dirname, `..`, `funtypes-0.0.0.tgz`)),
);
console.info(`$ npm install ${packPath}`);
inheritExit(spawnSync(`npm`, [`install`, packPath], { cwd: dir, stdio: `inherit` }));

for (const { name } of OUTPUTS) {
  console.info(`$ node ${join(dir, name)}`);
  inheritExit(spawnSync(`node`, [join(dir, name)], { cwd: dir, stdio: `inherit` }));
}

const modes = [
  { module: 'commonjs', type: 'commonjs' },
  { module: 'nodenext', type: 'module' },
  { module: 'preserve', type: 'module' },
];
for (const mode of modes) {
  writeFileSync(
    join(dir, `tsconfig.json`),
    JSON.stringify({
      compilerOptions: {
        module: mode.module,
        outDir: 'lib',
        noImplicitAny: true,
        skipLibCheck: false,
        strict: true,
        isolatedModules: true,
        declaration: true,
      },
      include: ['src'],
    }) + `\n`,
  );

  writeFileSync(
    join(dir, `package.json`),
    JSON.stringify({
      name: 'funtypes-test-import',
      private: true,
      type: mode.type,
      dependencies: {
        '@types/node': '^17.0.21',
        typescript: '4.0.2',
      },
      scripts: {
        typecheck: 'tsc --build',
      },
    }) + `\n`,
  );

  console.info(`$ npm run typecheck`);
  inheritExit(spawnSync(`npm`, [`run`, `typecheck`], { cwd: dir, stdio: `inherit` }));
  console.info(`$ node lib/test.js`);
  inheritExit(
    spawnSync(`node`, [`lib/test.js`, `${mode.module}/${mode.type}`], {
      cwd: dir,
      stdio: `inherit`,
    }),
  );
  mkdirSync(`test-output/${mode.module}-${mode.type}`, { recursive: true });
  for (const file of [`test.js`, `test.d.ts`]) {
    writeFileSync(
      `test-output/${mode.module}-${mode.type}/${file}`,
      readFileSync(join(dir, `lib`, file), `utf8`),
    );
  }
}

function inheritExit(proc) {
  if (proc.status !== 0) process.exit(proc.status);
}
