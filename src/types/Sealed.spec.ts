import {
  Array,
  String,
  Partial,
  ParsedValue,
  Object,
  Constraint,
  Codec,
  Intersect,
  Named,
  Lazy,
  Sealed,
  Undefined,
  Union,
  Number,
  showType,
  Tuple,
  Literal,
  Record,
  ReadonlyArray,
  ReadonlyTuple,
  ReadonlyRecord,
  ReadonlyObject,
  Brand,
} from '..';
import { Unknown } from './unknown';

const SealableTypes: (
  | Codec<{ hello: string; world: string | undefined }>
  | Codec<{ hello: string; world?: string }>
)[] = [
  Object({ hello: String, world: Union(String, Undefined) }),
  Intersect(Object({ hello: String }), Partial({ world: String })),
];
const BaseSealableTypes = SealableTypes.slice();

for (const t of BaseSealableTypes) {
  SealableTypes.push(Named(`HelloWorld`, t as any));
}

for (const t of BaseSealableTypes) {
  SealableTypes.push(Constraint(t as any, () => true));
}

for (const t of BaseSealableTypes) {
  SealableTypes.push(Lazy((): Codec<any> => t));
}

for (const t of BaseSealableTypes) {
  SealableTypes.push(Brand(`x`, t as any) as any);
}

for (const t of BaseSealableTypes) {
  SealableTypes.push(
    ParsedValue(Intersect(Object({ hello: String }), Partial({ world: String, other: String })), {
      test: t,
      parse(v) {
        return { success: true, value: v };
      },
      serialize(v) {
        return { success: true, value: v };
      },
    }),
  );
}

for (const t of SealableTypes) {
  test(`SealableTypes - ${showType(t)}`, () => {
    const s = Sealed(t);
    for (const obj of [{ hello: 'a', world: 'b' }, { hello: 'a' }]) {
      expect(s.safeParse(obj)).toEqual({
        success: true,
        value: obj,
      });
      expect(s.safeSerialize(obj)).toEqual({
        success: true,
        value: obj,
      });
      expect(s.test(obj)).toBe(true);
    }
    for (const obj of [
      { hello: 'a', world: 'b', otherProperty: 'c' },
      { hello: 'a', otherProperty: 'c' },
      { hello: 'a', world: 'b', otherProperty: 'c', secondOtherProperty: 'd' },
    ] as any[]) {
      expect(s.safeSerialize(obj).success).toBe(false);
      expect(s.safeParse(obj).success).toBe(false);
      expect(s.test(obj)).toBe(false);
    }
  });
}

test(`Sealed - Union`, () => {
  const s = Sealed(Union(Object({ hello: String }), Object({ world: Number })));
  expect(showType(s)).toMatchInlineSnapshot(`"Sealed<{ hello: string } | { world: number }>"`);
  expect(s.safeParse({ hello: 'a' })).toEqual({
    success: true,
    value: { hello: 'a' },
  });
  expect(s.safeParse({ world: 42 })).toEqual({
    success: true,
    value: { world: 42 },
  });
  expect(s.safeParse({ hello: 'a', world: 42 })).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {hello: "a", world: 42} to { hello: string } | { world: number }",
        [
          "Unable to assign {hello: "a", world: 42} to { hello: string }",
          [
            "Unexpected property: world",
          ],
        ],
        [
          "And unable to assign {hello: "a", world: 42} to { world: number }",
          [
            "Unexpected property: hello",
          ],
        ],
      ],
      "message": "Expected { hello: string } | { world: number }, but was {hello: "a", world: 42}",
      "success": false,
    }
  `);
  expect(() => s.assert({ hello: 'a', world: 42 })).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign {hello: "a", world: 42} to { hello: string } | { world: number }
      Unable to assign {hello: "a", world: 42} to { hello: string }
        Unexpected property: world
      And unable to assign {hello: "a", world: 42} to { world: number }
        Unexpected property: hello"
  `);
});

test(`Sealed - Complex Union`, () => {
  const s = Sealed(
    Intersect(
      Object({ hello: String }),
      Union(
        Object({ kind: Literal('rectangle'), height: Number, width: Number }),
        Object({ kind: Literal('circle'), radius: Number }),
        Intersect(Object({ kind: Literal('squirkle') }), Unknown),
      ),
      Object({ world: String }),
    ),
  );
  expect(s.safeParse({ hello: 'a', world: 'b', kind: 'circle', radius: 42 })).toEqual({
    success: true,
    value: { hello: 'a', world: 'b', kind: 'circle', radius: 42 },
  });
  expect(s.safeParse({ hello: 'a', world: 'b', kind: 'circle', radius: 42, width: 5 }))
    .toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {hello: "a", world: "b", kind: "circle" ... } to { kind: "rectangle"; height: number; width: number } | { kind: "circle"; radius: number } | ({ kind: "squirkle" } & unknown)",
        [
          "Unable to assign {hello: "a", world: "b", kind: "circle" ... } to { kind: "circle"; radius: number }",
          [
            "Unexpected property: width",
          ],
        ],
      ],
      "key": "<kind: "circle">.width",
      "message": "Unexpected property: width",
      "success": false,
    }
  `);
  expect(() => s.assert({ hello: 'a', world: 'b', kind: 'circle', radius: 42, width: 5 }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign {hello: "a", world: "b", kind: "circle" ... } to { kind: "rectangle"; height: number; width: number } | { kind: "circle"; radius: number } | ({ kind: "squirkle" } & unknown)
      Unable to assign {hello: "a", world: "b", kind: "circle" ... } to { kind: "circle"; radius: number }
        Unexpected property: width"
  `);

  expect(s.safeParse({ hello: 'a', world: 'b', kind: 'squirkle', leftish: 10, upish: 14 })).toEqual(
    {
      success: true,
      value: { hello: 'a', world: 'b', kind: 'squirkle', leftish: 10, upish: 14 },
    },
  );
});

test(`Sealed - Unbounded Union`, () => {
  const s = Sealed(
    Intersect(
      Union(
        Object({ kind: Literal('rectangle'), height: Number, width: Number }),
        Object({ kind: Literal('circle'), radius: Number }),
      ),
      Unknown,
    ),
  );
  expect(s.safeParse({ kind: 'circle', radius: 42, whatever: 'hello world' })).toEqual({
    success: true,
    value: {
      kind: 'circle',
      radius: 42,
      whatever: 'hello world',
    },
  });
});

test(`Sealed - Intersected Unions`, () => {
  const s = Sealed(
    Intersect(
      Union(
        Object({ kind: Literal('rectangle'), height: Number, width: Number }),
        Object({ kind: Literal('circle'), radius: Number }),
      ),
      Union(
        Object({ dimension: Literal('2d') }),
        Object({ dimension: Literal('3d'), zIndex: Number }),
      ),
    ),
  );

  // Valid inputs:
  expect(s.safeParse({ kind: 'circle', radius: 42, dimension: '2d' })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "dimension": "2d",
        "kind": "circle",
        "radius": 42,
      },
    }
  `);
  expect(s.safeParse({ kind: 'circle', radius: 42, dimension: '3d', zIndex: 10 }))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "dimension": "3d",
        "kind": "circle",
        "radius": 42,
        "zIndex": 10,
      },
    }
  `);

  // Invalid inputs:
  expect(s.safeParse({ kind: 'circle', radius: 42, dimension: '2d', zIndex: 10 }))
    .toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {kind: "circle", radius: 42, dimension: "2d" ... } to { dimension: "2d" } | { dimension: "3d"; zIndex: number }",
        [
          "Unable to assign {kind: "circle", radius: 42, dimension: "2d" ... } to { dimension: "2d" }",
          [
            "Unexpected property: zIndex",
          ],
        ],
      ],
      "key": "<dimension: "2d">.zIndex",
      "message": "Unexpected property: zIndex",
      "success": false,
    }
  `);
  expect(s.safeParse({ kind: 'rectangle', height: 42, width: 42, radius: 42, dimension: '2d' }))
    .toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {kind: "rectangle", height: 42 ... } to { kind: "rectangle"; height: number; width: number } | { kind: "circle"; radius: number }",
        [
          "Unable to assign {kind: "rectangle", height: 42 ... } to { kind: "rectangle"; height: number; width: number }",
          [
            "Unexpected property: radius",
          ],
        ],
      ],
      "key": "<kind: "rectangle">.radius",
      "message": "Unexpected property: radius",
      "success": false,
    }
  `);
});

test(`Sealed - Intersected Unbounded Unions`, () => {
  const s = Sealed(
    Intersect(
      Union(
        Object({ kind: Literal('rectangle'), height: Number, width: Number }),
        Object({ kind: Literal('circle'), radius: Number }),
      ),
      Union(
        Object({ dimension: Literal('2d') }),
        Intersect(Object({ dimension: Literal('3d') }), Unknown),
      ),
    ),
  );

  // Valid inputs:
  expect(s.safeParse({ kind: 'circle', radius: 42, dimension: '2d' })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "dimension": "2d",
        "kind": "circle",
        "radius": 42,
      },
    }
  `);
  expect(s.safeParse({ kind: 'circle', radius: 42, dimension: '3d', zIndex: 10 }))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "dimension": "3d",
        "kind": "circle",
        "radius": 42,
        "zIndex": 10,
      },
    }
  `);

  // Invalid inputs:
  expect(s.safeParse({ kind: 'circle', radius: 42, dimension: '2d', zIndex: 10 }))
    .toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {kind: "circle", radius: 42, dimension: "2d" ... } to { dimension: "2d" } | ({ dimension: "3d" } & unknown)",
        [
          "Unable to assign {kind: "circle", radius: 42, dimension: "2d" ... } to { dimension: "2d" }",
          [
            "Unexpected property: zIndex",
          ],
        ],
      ],
      "key": "<dimension: "2d">.zIndex",
      "message": "Unexpected property: zIndex",
      "success": false,
    }
  `);

  // Extra valid input - we are not smart enough to detect that the
  // 2d option in one union means the other union could stop being unbounded:
  expect(s.safeParse({ kind: 'rectangle', height: 42, width: 42, radius: 42, dimension: '2d' }))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "dimension": "2d",
        "height": 42,
        "kind": "rectangle",
        "width": 42,
      },
    }
  `);
});

test(`Sealed - Lazy Cycle`, () => {
  interface T {
    children: ({ value: string } | T)[];
  }
  const s: Codec<T> = Sealed(
    Lazy(() => Object({ children: Array(Union(leaf, s)) })),
    { deep: true },
  );
  const leaf = Object({ value: String });
  expect(s.safeParse({ children: [{ value: 'a' }, { value: 'b' }] })).toEqual({
    success: true,
    value: { children: [{ value: 'a' }, { value: 'b' }] },
  });
});

test(`Sealed - Deep`, () => {
  expect(Sealed(Array(Object({ a: String }))).safeParse([{ a: 'A', b: 'B' }]))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        {
          "a": "A",
        },
      ],
    }
  `);
  expect(Sealed(Array(Object({ a: String })), { deep: true }).safeParse([{ a: 'A', b: 'B' }]))
    .toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign [{a: "A", b: "B"}] to { a: string }[]",
        [
          "The types of [0] are not compatible",
          [
            "Unable to assign {a: "A", b: "B"} to { a: string }",
            [
              "Unexpected property: b",
            ],
          ],
        ],
      ],
      "key": "[0].b",
      "message": "Unexpected property: b",
      "success": false,
    }
  `);
  expect(
    Sealed(ReadonlyArray(Object({ a: String })), { deep: true }).safeParse([{ a: 'A', b: 'B' }]),
  ).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign [{a: "A", b: "B"}] to readonly { a: string }[]",
        [
          "The types of [0] are not compatible",
          [
            "Unable to assign {a: "A", b: "B"} to { a: string }",
            [
              "Unexpected property: b",
            ],
          ],
        ],
      ],
      "key": "[0].b",
      "message": "Unexpected property: b",
      "success": false,
    }
  `);
  expect(Sealed(Tuple(Object({ a: String }))).safeParse([{ a: 'A', b: 'B' }]))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        {
          "a": "A",
        },
      ],
    }
  `);
  expect(Sealed(Tuple(Object({ a: String })), { deep: true }).safeParse([{ a: 'A', b: 'B' }]))
    .toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign [{a: "A", b: "B"}] to [{ a: string }]",
        [
          "The types of [0] are not compatible",
          [
            "Unable to assign {a: "A", b: "B"} to { a: string }",
            [
              "Unexpected property: b",
            ],
          ],
        ],
      ],
      "key": "[0].b",
      "message": "Unexpected property: b",
      "success": false,
    }
  `);
  expect(
    Sealed(ReadonlyTuple(Object({ a: String })), { deep: true }).safeParse([{ a: 'A', b: 'B' }]),
  ).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign [{a: "A", b: "B"}] to readonly [{ a: string }]",
        [
          "The types of [0] are not compatible",
          [
            "Unable to assign {a: "A", b: "B"} to { a: string }",
            [
              "Unexpected property: b",
            ],
          ],
        ],
      ],
      "key": "[0].b",
      "message": "Unexpected property: b",
      "success": false,
    }
  `);

  expect(Sealed(Record(String, Object({ a: String }))).safeParse({ x: { a: 'A', b: 'B' } }))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "x": {
          "a": "A",
        },
      },
    }
  `);
  expect(
    Sealed(Record(String, Object({ a: String })), { deep: true }).safeParse({
      x: { a: 'A', b: 'B' },
    }),
  ).toMatchInlineSnapshot(`
    {
      "fullError": [
        "The types of x are not compatible",
        [
          "Unable to assign {a: "A", b: "B"} to { a: string }",
          [
            "Unexpected property: b",
          ],
        ],
      ],
      "key": "x.b",
      "message": "Unexpected property: b",
      "success": false,
    }
  `);
  expect(
    Sealed(ReadonlyRecord(String, Object({ a: String })), { deep: true }).safeParse({
      x: { a: 'A', b: 'B' },
    }),
  ).toMatchInlineSnapshot(`
    {
      "fullError": [
        "The types of x are not compatible",
        [
          "Unable to assign {a: "A", b: "B"} to { a: string }",
          [
            "Unexpected property: b",
          ],
        ],
      ],
      "key": "x.b",
      "message": "Unexpected property: b",
      "success": false,
    }
  `);

  expect(Sealed(Object({ x: Object({ a: String }) })).safeParse({ x: { a: 'A', b: 'B' } }))
    .toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "x": {
          "a": "A",
        },
      },
    }
  `);
  expect(
    Sealed(Object({ x: Object({ a: String }) }), { deep: true }).safeParse({
      x: { a: 'A', b: 'B' },
    }),
  ).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {x: {a: "A", b: "B"}} to { x: { a: string } }",
        [
          "The types of "x" are not compatible",
          [
            "Unable to assign {a: "A", b: "B"} to { a: string }",
            [
              "Unexpected property: b",
            ],
          ],
        ],
      ],
      "key": "x.b",
      "message": "Unexpected property: b",
      "success": false,
    }
  `);
  expect(
    Sealed(Object({ x: ReadonlyObject({ a: String }) }), { deep: true }).safeParse({
      x: { a: 'A', b: 'B' },
    }),
  ).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {x: {a: "A", b: "B"}} to { x: { readonly a: string } }",
        [
          "The types of "x" are not compatible",
          [
            "Unable to assign {a: "A", b: "B"} to { readonly a: string }",
            [
              "Unexpected property: b",
            ],
          ],
        ],
      ],
      "key": "x.b",
      "message": "Unexpected property: b",
      "success": false,
    }
  `);

  const deepParsed = Sealed(
    Array(
      Object({
        a: String,
        b: ParsedValue(Object({ x: Number }), {
          parse({ x }) {
            return { success: true, value: { x, y: x } };
          },
        }),
      }),
    ),
    {
      deep: true,
    },
  );
  expect(deepParsed.safeParse([{ a: 'A', b: { x: 5 } }])).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": [
        {
          "a": "A",
          "b": {
            "x": 5,
            "y": 5,
          },
        },
      ],
    }
  `);
  expect(deepParsed.safeParse([{ a: 'A', b: { x: 5, y: 10 } }])).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign [{a: "A", b: {x: 5, y: 10}}] to { a: string; b: ParsedValue<{ x: number }> }[]",
        [
          "The types of [0] are not compatible",
          [
            "Unable to assign {a: "A", b: {x: 5, y: 10}} to { a: string; b: ParsedValue<{ x: number }> }",
            [
              "The types of "b" are not compatible",
              [
                "Unable to assign {x: 5, y: 10} to { x: number }",
                [
                  "Unexpected property: y",
                ],
              ],
            ],
          ],
        ],
      ],
      "key": "[0].b.y",
      "message": "Unexpected property: y",
      "success": false,
    }
  `);
  expect(deepParsed.safeParse([{ a: 'A', b: { x: 5 }, c: 'C' }])).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign [{a: "A", b: {x: 5}, c: "C"}] to { a: string; b: ParsedValue<{ x: number }> }[]",
        [
          "The types of [0] are not compatible",
          [
            "Unable to assign {a: "A", b: {x: 5}, c: "C"} to { a: string; b: ParsedValue<{ x: number }> }",
            [
              "Unexpected property: c",
            ],
          ],
        ],
      ],
      "key": "[0].c",
      "message": "Unexpected property: c",
      "success": false,
    }
  `);

  const unionParsed = Sealed(
    Intersect(
      Partial({ x: Number }),
      Union(
        ParsedValue(Object({ hello: String, world: String }), {
          parse(value) {
            return { success: true, value: { hello: value.hello } };
          },
        }),
        Object({ hello: String }),
      ),
    ),
  );

  expect(unionParsed.safeParse({ hello: 'a' })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "hello": "a",
      },
    }
  `);
  expect(unionParsed.safeParse({ hello: 'a', world: 'b' })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "hello": "a",
      },
    }
  `);
  expect(unionParsed.safeParse({ hello: 'a', world: 'b', other: 'c' })).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {hello: "a", world: "b", other: "c"} to { x?: number }",
        [
          "Unexpected property: other",
        ],
      ],
      "key": "other",
      "message": "Unexpected property: other",
      "success": false,
    }
  `);

  expect(unionParsed.safeSerialize({ hello: 'a' })).toMatchInlineSnapshot(`
    {
      "success": true,
      "value": {
        "hello": "a",
      },
    }
  `);
  expect(unionParsed.safeSerialize({ hello: 'a', world: 'b' } as any)).toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {hello: "a", world: "b"} to { x?: number }",
        [
          "Unexpected property: world",
        ],
      ],
      "key": "world",
      "message": "Unexpected property: world",
      "success": false,
    }
  `);
  expect(unionParsed.safeSerialize({ hello: 'a', world: 'b', other: 'c' } as any))
    .toMatchInlineSnapshot(`
    {
      "fullError": [
        "Unable to assign {hello: "a", world: "b", other: "c"} to { x?: number }",
        [
          "Unexpected property: world",
        ],
        [
          "Unexpected property: other",
        ],
      ],
      "key": "world",
      "message": "Unexpected property: world",
      "success": false,
    }
  `);

  (unionParsed as any).assert({ hello: 'a' });
  expect(() => unionParsed.assert({ hello: 'a', world: 'b' })).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign {hello: "a", world: "b"} to ParsedValue<{ hello: string; world: string }> | { hello: string }
      Unable to assign {hello: "a", world: "b"} to ParsedValue<{ hello: string; world: string }>
        ParsedValue<{ hello: string; world: string }> does not support Runtype.test
      And unable to assign {hello: "a", world: "b"} to { hello: string }
        Unexpected property: world"
  `);
  expect(() => unionParsed.assert({ hello: 'a', world: 'b', other: 'c' }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign {hello: "a", world: "b", other: "c"} to ParsedValue<{ hello: string; world: string }> | { hello: string }
      Unable to assign {hello: "a", world: "b", other: "c"} to ParsedValue<{ hello: string; world: string }>
        ParsedValue<{ hello: string; world: string }> does not support Runtype.test
      And unable to assign {hello: "a", world: "b", other: "c"} to { hello: string }
        Unexpected property: world
        Unexpected property: other"
  `);
});
