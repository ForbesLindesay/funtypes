import {
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
} from '..';

const SealableTypes: (
  | Codec<{ hello: string; world: string | undefined }>
  | Codec<{ hello: string; world?: string }>
)[] = [
  Object({ hello: String, world: Union(String, Undefined) }),
  Intersect(Object({ hello: String }), Partial({ world: String })),
];
const BaseSealableTypes = SealableTypes.slice();

for (const t of BaseSealableTypes) {
  SealableTypes.push(Named(`HelloWorld`, t));
}

for (const t of BaseSealableTypes) {
  SealableTypes.push(Constraint(t, () => true));
}

for (const t of BaseSealableTypes) {
  SealableTypes.push(Lazy(() => t));
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
    for (const { obj, result } of [
      {
        obj: { hello: 'a', world: 'b', otherProperty: 'c' },
        result: {
          success: false,
          message: `Unexpected property on sealed object: otherProperty`,
        },
      },
      {
        obj: { hello: 'a', otherProperty: 'c' },
        result: {
          success: false,
          message: `Unexpected property on sealed object: otherProperty`,
        },
      },
      {
        obj: { hello: 'a', world: 'b', otherProperty: 'c', secondOtherProperty: 'd' },
        result: {
          success: false,
          fullError: [
            'Unexpected properties on sealed object',
            ['Unexpected property: otherProperty'],
            ['Unexpected property: secondOtherProperty'],
          ],
          message: 'Unexpected properties on sealed object: otherProperty, secondOtherProperty',
        },
      },
    ]) {
      expect(s.safeSerialize(obj)).toEqual(result);
      expect(s.safeParse(obj)).toEqual(result);
      expect(s.test(obj)).toBe(false);
    }
  });
}

test(`SealableTypes - Union`, () => {
  const s = Sealed(Union(Object({ hello: String }), Object({ world: Number })));
  expect(s.safeParse({ hello: 'a' })).toEqual({
    success: true,
    value: { hello: 'a' },
  });
  expect(s.safeParse({ world: 42 })).toEqual({
    success: true,
    value: { world: 42 },
  });
  expect(s.safeParse({ hello: 'a', world: 42 })).toEqual({
    message: 'Unexpected property on sealed object: world',
    success: false,
  });
  expect(() => s.assert({ hello: 'a', world: 42 })).toThrowErrorMatchingInlineSnapshot(`
"Unexpected properties on sealed object
  Unexpected property: hello
  Unexpected property: world"
`);
});
