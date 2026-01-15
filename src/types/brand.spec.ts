import { readFileSync } from 'fs';
import * as ft from '..';

export const brand = ft.Brand('MyBrand', ft.Number);
test('Brand', () => {
  expect(ft.showType(brand)).toEqual('number');
  expect(brand.safeParse(42)).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": 42,
    }
  `);
  expect(brand.safeParse('hello world')).toMatchInlineSnapshot(`
    {
      "message": "Expected number, but was "hello world" (i.e. a string literal)",
      "success": false,
    }
  `);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/brand.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const brand: ft.Codec<ft.BrandedType<"MyBrand", number>>;
    "
  `);
});
