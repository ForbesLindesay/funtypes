import { readFileSync } from 'fs';
import * as ft from '..';

export const CrewMember = ft.Object({
  name: ft.String,
  rank: ft.String,
  home: ft.String,
});
test('Object', () => {
  expect(ft.showType(CrewMember)).toMatchInlineSnapshot(
    `"{ name: string; rank: string; home: string }"`,
  );
  expect(CrewMember.safeParse({ name: 'my name', rank: 'my rank', home: 'my home' })).toEqual({
    success: true,
    value: {
      home: 'my home',
      name: 'my name',
      rank: 'my rank',
    },
  });
});

export const ReadonlyPartialCrewMember = ft.ReadonlyPartial({
  name: ft.String,
  rank: ft.String,
  home: ft.String,
});
test('ReadonlyPartial', () => {
  expect(ft.showType(ReadonlyPartialCrewMember)).toMatchInlineSnapshot(
    `"{ readonly name?: string; readonly rank?: string; readonly home?: string }"`,
  );
  expect(ReadonlyPartialCrewMember.safeParse({ name: 'my name', home: 'my home' })).toEqual({
    success: true,
    value: {
      home: 'my home',
      name: 'my name',
    },
  });
});

export const CrewMemberFromIntersect = ft.Intersect(
  ft.Object({
    name: ft.String,
  }),
  ft.Object({
    rank: ft.String,
  }),
  ft.Object({
    home: ft.String,
  }),
);
export const PartialCrewMemberFromIntersect = ft.Partial(CrewMemberFromIntersect);
test('Partial<Intersect>', () => {
  expect(ft.showType(CrewMemberFromIntersect)).toMatchInlineSnapshot(
    `"{ name: string; rank: string; home: string }"`,
  );
  expect(ft.showType(PartialCrewMemberFromIntersect)).toMatchInlineSnapshot(
    `"{ name?: string; rank?: string; home?: string }"`,
  );
  expect(PartialCrewMemberFromIntersect.safeParse({ name: 'my name', home: 'my home' })).toEqual({
    success: true,
    value: {
      home: 'my home',
      name: 'my name',
    },
  });
});

test('Partial<Union>', () => {
  expect(() => {
    ft.Partial(
      // @ts-expect-error Union only allows ObjectCodec inputs
      ft.Union(
        ft.Object({ name: ft.String }),
        ft.Object({ rank: ft.String }),
        ft.Object({ home: ft.String }),
      ),
    );
  }).toThrowErrorMatchingInlineSnapshot(
    `"Partial: input runtype "union" does not support 'partial' operation"`,
  );
});

test('Partial<Intersect<NonObject>', () => {
  expect(() => {
    ft.Partial(
      // @ts-expect-error Union only allows ObjectCodec inputs
      ft.Intersect(ft.Object({ name: ft.String }), ft.Null),
    );
  }).toThrowErrorMatchingInlineSnapshot(
    `"Partial: input runtype "literal" does not support 'partial' operation"`,
  );
});

export const PartialNamed = ft.Partial(ft.Named('MyNamedType', ft.Object({ whatever: ft.Number })));
test('Partial(Named(Object))', () => {
  expect(ft.showType(PartialNamed)).toMatchInlineSnapshot(`"Partial<MyNamedType>"`);
});

export const OptionalProperties = ft.Object({
  a: ft.String,
  b: ft.Optional(ft.String),
  c: ft.Documented({ title: 'A title for this field' }, ft.Optional(ft.String)),
});
test('OptionalProperties', () => {
  expect(ft.showType(OptionalProperties)).toMatchInlineSnapshot(
    `"{ a: string; b?: string; c?: string }"`,
  );
  expect(OptionalProperties.parse({ a: 'hello' })).toEqual({ a: 'hello' });
  expect(OptionalProperties.parse({ a: 'hello', b: 'world' })).toEqual({ a: 'hello', b: 'world' });
  expect(OptionalProperties.parse({ a: 'hello', b: 'world', c: 'This is C' })).toEqual({
    a: 'hello',
    b: 'world',
    c: 'This is C',
  });
  expect(OptionalProperties.safeParse({ a: 'hello', b: 42 })).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {a: "hello", b: 42} to { a: string; b?: string; c?: string }",
        [
          "The types of "b" are not compatible",
          [
            "Unable to assign 42 to string | undefined",
            [
              "Unable to assign 42 to string",
              [
                "Expected string, but was 42",
              ],
            ],
            [
              "And unable to assign 42 to undefined",
              [
                "Expected literal undefined, but was 42 (i.e. a number)",
              ],
            ],
          ],
        ],
      ],
      "key": "b",
      "message": "Expected string | undefined, but was 42",
      "success": false,
    }
  `);
});

export const PropertiesWithDefaults = ft.Object({
  a: ft.WithDefault(ft.String, 'Hello World'),
});
test('PropertiesWithDefaults', () => {
  expect(ft.showType(PropertiesWithDefaults)).toMatchInlineSnapshot(`"{ a: string }"`);
  expect(PropertiesWithDefaults.parse({ a: 'hello' })).toEqual({ a: 'hello' });
  expect(PropertiesWithDefaults.parse({ a: undefined })).toEqual({ a: 'Hello World' });
  expect(PropertiesWithDefaults.safeParse({ a: 42 })).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {a: 42} to { a: string }",
        [
          "The types of "a" are not compatible",
          [
            "Expected string, but was 42",
          ],
        ],
      ],
      "key": "a",
      "message": "Expected string, but was 42",
      "success": false,
    }
  `);
  // @ts-expect-error - the property is required because we are serializing
  expect(PropertiesWithDefaults.safeSerialize({ a: undefined })).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {a: undefined} to { a: string }",
        [
          "The types of "a" are not compatible",
          [
            "Expected string, but was undefined",
          ],
        ],
      ],
      "key": "a",
      "message": "Expected string, but was undefined",
      "success": false,
    }
  `);
});

test('Exported types', () => {
  expect(readFileSync(`lib/types/Object.spec.d.ts`, 'utf8')).toMatchInlineSnapshot(`
    "import * as ft from '..';
    export declare const CrewMember: ft.ObjectCodec<{
        name: string;
        rank: string;
        home: string;
    }>;
    export declare const ReadonlyPartialCrewMember: ft.ObjectCodec<{
        readonly name?: string | undefined;
        readonly rank?: string | undefined;
        readonly home?: string | undefined;
    }>;
    export declare const CrewMemberFromIntersect: ft.ObjectCodec<{
        name: string;
        rank: string;
        home: string;
    }>;
    export declare const PartialCrewMemberFromIntersect: ft.ObjectCodec<{
        name?: string | undefined;
        rank?: string | undefined;
        home?: string | undefined;
    }>;
    export declare const PartialNamed: ft.ObjectCodec<{
        whatever?: number | undefined;
    }>;
    export declare const OptionalProperties: ft.ObjectCodec<{
        a: string;
        b?: string | undefined;
        c?: string | undefined;
    }>;
    export declare const PropertiesWithDefaults: ft.ObjectCodec<{
        a: string;
    }>;
    "
  `);
});
