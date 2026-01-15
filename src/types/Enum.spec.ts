import { readFileSync } from 'fs';
import * as ft from '..';

export enum NumericEnum {
  foo = 12,
  bar = 20,
}
export const NumericEnumSchema = ft.Enum('NumericEnum', NumericEnum);

test('Numeric Enum', () => {
  expect(NumericEnumSchema.safeParse(12)).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": 12,
    }
  `);
  expect(NumericEnumSchema.safeParse(16)).toMatchInlineSnapshot(`
    {
      "message": "Expected NumericEnum, but was 16",
      "success": false,
    }
  `);
  expect(NumericEnumSchema.safeParse('bar')).toMatchInlineSnapshot(`
    {
      "message": "Expected NumericEnum, but was "bar"",
      "success": false,
    }
  `);
  const typed: NumericEnum = NumericEnumSchema.parse(20);
  expect(typed).toBe(NumericEnum.bar);

  expect(ft.showType(NumericEnumSchema)).toMatchInlineSnapshot(`"NumericEnum"`);
});

export enum StringEnum {
  Foo = 'Bar',
  Hello = 'World',
}
export const StringEnumSchema = ft.Enum('StringEnum', StringEnum);

test('String Enum', () => {
  expect(StringEnumSchema.safeParse('World')).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": "World",
    }
  `);
  expect(StringEnumSchema.safeParse('Foo')).toMatchInlineSnapshot(`
    {
      "message": "Expected StringEnum, but was "Foo"",
      "success": false,
    }
  `);
  expect(StringEnumSchema.safeParse('Hello')).toMatchInlineSnapshot(`
    {
      "message": "Expected StringEnum, but was "Hello"",
      "success": false,
    }
  `);
  const typed: StringEnum = StringEnumSchema.parse('Bar');
  expect(typed).toBe(StringEnum.Foo);
  expect(ft.showType(StringEnumSchema)).toMatchInlineSnapshot(`"StringEnum"`);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Enum.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare enum NumericEnum {
        foo = 12,
        bar = 20
    }
    export declare const NumericEnumSchema: ft.Codec<NumericEnum>;
    export declare enum StringEnum {
        Foo = "Bar",
        Hello = "World"
    }
    export declare const StringEnumSchema: ft.Codec<StringEnum>;
    "
  `);
});
