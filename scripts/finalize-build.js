const { writeFileSync, readFileSync, rmSync, readdirSync } = require('fs');
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
  return {
    value: [...new Set(exports.value)].sort(),
    all: [...new Set([...exports.value, ...exports.type])].sort(),
  };
}

const EXPORTS_TO_RENAME = new Set([`Array`, `Object`, `Partial`, `Record`, `Tuple`]);

const baseModule = getExports(`src/index.ts`);

const commonJs = [`"use strict";`, `const m = require("./index.js")`, ``];
const esModule = [
  `import {`,
  ...baseModule.value.filter(v => !EXPORTS_TO_RENAME.has(v)).map(v => `  ${v},`),
  `} from "./index.mjs";`,
  `export {`,
];
for (const exportName of baseModule.value) {
  if (EXPORTS_TO_RENAME.has(exportName)) {
    commonJs.push(`exports.${exportName} = m.Readonly${exportName};`);
    esModule.push(`  Readonly${exportName} as ${exportName},`);
  } else {
    commonJs.push(`exports.${exportName} = m.${exportName};`);
    esModule.push(`  ${exportName},`);
  }
}
commonJs.push(``);
esModule.push(`};`, ``);

const types = [`export {`];
for (const exportName of baseModule.all) {
  if (EXPORTS_TO_RENAME.has(exportName)) {
    types.push(`  Readonly${exportName} as ${exportName},`);
  } else {
    types.push(`  ${exportName},`);
  }
}
types.push(`} from "./index";`, ``);

writeFileSync(`lib/index.d.ts`, readFileSync(`dist/index.d.ts`, `utf8`));
writeFileSync(`lib/readonly.js`, commonJs.join(`\n`));
writeFileSync(`lib/readonly.mjs`, esModule.join(`\n`));
writeFileSync(`lib/readonly.d.ts`, types.join(`\n`));

rmSync(`dist`, { recursive: true, force: true });

const ALLOWED_FILES = new Set(
  [`index`, `readonly`].flatMap(name => [`.js`, `.mjs`, `.d.ts`].map(ext => `${name}${ext}`)),
);

readdirSync(`lib`).forEach(f => {
  if (!ALLOWED_FILES.has(f)) {
    rmSync(`lib/${f}`, { recursive: true, force: true });
  }
});
