import { readFileSync } from 'fs';
import * as ft from '..';

export class MyCustomClass {}
export const MyCustomClassSchema = ft.InstanceOf(MyCustomClass);

export class MyOtherCustomClass {
  public readonly value: number;
  constructor(value: number) {
    this.value = value;
  }
}
export const MyOtherCustomClassSchema = ft.InstanceOf(MyOtherCustomClass);

test('InstanceOf', () => {
  expect(MyCustomClassSchema.safeParse(new MyCustomClass())).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": MyCustomClass {},
    }
  `);
  expect(MyCustomClassSchema.safeParse({})).toMatchInlineSnapshot(`
    {
      "message": "Expected MyCustomClass, but was {}",
      "success": false,
    }
  `);
  expect(MyOtherCustomClassSchema.safeParse(new MyOtherCustomClass(42))).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": MyOtherCustomClass {
        "value": 42,
      },
    }
  `);
  expect(MyOtherCustomClassSchema.safeParse({ value: 42 })).toMatchInlineSnapshot(`
    {
      "message": "Expected MyOtherCustomClass, but was {value: 42}",
      "success": false,
    }
  `);
  expect(ft.showType(MyCustomClassSchema)).toEqual('InstanceOf<MyCustomClass>');
  expect(ft.showType(MyOtherCustomClassSchema)).toEqual('InstanceOf<MyOtherCustomClass>');
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/instanceof.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare class MyCustomClass {
    }
    export declare const MyCustomClassSchema: ft.Codec<MyCustomClass>;
    export declare class MyOtherCustomClass {
        readonly value: number;
        constructor(value: number);
    }
    export declare const MyOtherCustomClassSchema: ft.Codec<MyOtherCustomClass>;
    "
  `);
});
