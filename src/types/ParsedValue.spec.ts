import * as ta from 'type-assertions';
import {
  Array,
  String,
  Number,
  ParsedValue,
  Static,
  Literal,
  Object,
  Union,
  Tuple,
  Codec,
  Sealed,
  showError,
} from '..';
import show from '../show';
import { InstanceOf } from './instanceof';
import { Lazy } from './lazy';
import { Null } from './literal';

test('TrimmedString', () => {
  const TrimmedString = ParsedValue(String, {
    name: 'TrimmedString',
    parse(value) {
      return { success: true, value: value.trim() };
    },
    test: String.withConstraint(
      value =>
        value.trim() === value || `Expected the string to be trimmed, but this one has whitespace`,
    ),
  });

  expect(TrimmedString.safeParse(' foo bar ')).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": "foo bar",
    }
  `);
  expect(TrimmedString.safeParse(42)).toMatchInlineSnapshot(`
    Object {
      "message": "Expected string, but was 42",
      "success": false,
    }
  `);

  expect(() => TrimmedString.assert(' foo bar ')).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign \\" foo bar \\" to WithConstraint<string>
      Expected the string to be trimmed, but this one has whitespace"
  `);
  expect(() => TrimmedString.assert('foo bar')).not.toThrow();
});

test('DoubledNumber', () => {
  const DoubledNumber = ParsedValue(Number, {
    name: 'DoubledNumber',
    parse(value) {
      return { success: true, value: value * 2 };
    },
    test: Number.withConstraint(value => value % 2 === 0 || `Expected an even number`),
  });

  expect(DoubledNumber.safeParse(10)).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": 20,
    }
  `);

  expect(() => DoubledNumber.assert(11)).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign 11 to WithConstraint<number>
      Expected an even number"
  `);
  expect(() => DoubledNumber.assert(12)).not.toThrow();

  expect(DoubledNumber.safeSerialize(10)).toMatchInlineSnapshot(`
    Object {
      "message": "DoubledNumber does not support Runtype.serialize",
      "success": false,
    }
  `);
});

test('DoubledNumber - 2', () => {
  const DoubledNumber = Number.withParser({
    name: 'DoubledNumber',
    parse(value) {
      return { success: true, value: value * 2 };
    },
    test: Number.withConstraint(value => value % 2 === 0 || `Expected an even number`),
    serialize(value) {
      return { success: true, value: value / 2 };
    },
  });

  expect(DoubledNumber.safeParse(10)).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": 20,
    }
  `);

  expect(() => DoubledNumber.assert(11)).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign 11 to WithConstraint<number>
      Expected an even number"
  `);
  expect(() => DoubledNumber.assert(12)).not.toThrow();

  expect(DoubledNumber.safeSerialize(10)).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": 5,
    }
  `);

  expect(DoubledNumber.safeSerialize(11)).toMatchInlineSnapshot(`
    Object {
      "fullError": Array [
        "Unable to assign 11 to WithConstraint<number>",
        Array [
          "Expected an even number",
        ],
      ],
      "message": "Expected an even number",
      "success": false,
    }
  `);
});

test('Upgrade Example', () => {
  const ShapeV1 = Object({ version: Literal(1), size: Number });
  const ShapeV2 = Object({ version: Literal(2), width: Number, height: Number });
  const Shape = Union(
    ShapeV1.withParser({
      parse: ({ size }) => ({
        success: true,
        value: { version: 2 as const, width: size, height: size },
      }),
    }),
    ShapeV2,
  );
  type X = Static<typeof Shape>;
  ta.assert<ta.Equal<X, { version: 2; width: number; height: number }>>();
  expect(Shape.parse({ version: 1, size: 42 })).toEqual({ version: 2, width: 42, height: 42 });
  expect(Shape.parse({ version: 2, width: 10, height: 20 })).toEqual({
    version: 2,
    width: 10,
    height: 20,
  });
  expect(Shape.safeSerialize({ version: 2, width: 10, height: 20 })).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "height": 20,
        "version": 2,
        "width": 10,
      },
    }
  `);
  expect(Shape.safeSerialize({ version: 1, size: 20 } as any)).toMatchInlineSnapshot(`
    Object {
      "fullError": Array [
        "Unable to assign {version: 1, size: 20} to { version: 2; width: number; height: number; }",
        Array [
          "The types of \\"version\\" are not compatible",
          Array [
            "Expected literal 2, but was 1",
          ],
        ],
        Array [
          "The types of \\"width\\" are not compatible",
          Array [
            "Expected number, but was undefined",
          ],
        ],
        Array [
          "The types of \\"height\\" are not compatible",
          Array [
            "Expected number, but was undefined",
          ],
        ],
      ],
      "key": "version",
      "message": "Expected literal 2, but was 1",
      "success": false,
    }
  `);

  expect(Shape.serialize({ version: 2, width: 10, height: 20 })).toMatchInlineSnapshot(`
    Object {
      "height": 20,
      "version": 2,
      "width": 10,
    }
  `);
  expect(() => Shape.serialize({ version: 1, size: 20 } as any))
    .toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign {version: 1, size: 20} to { version: 2; width: number; height: number; }
      The types of \\"version\\" are not compatible
        Expected literal 2, but was 1
      The types of \\"width\\" are not compatible
        Expected number, but was undefined
      The types of \\"height\\" are not compatible
        Expected number, but was undefined"
  `);
});

test('URL', () => {
  const URLString = ParsedValue(String, {
    name: 'URLString',
    parse(value) {
      try {
        return { success: true, value: new URL(value) };
      } catch (ex) {
        return { success: false, message: `Expected a valid URL but got '${value}'` };
      }
    },
    test: InstanceOf(URL),
  });

  const value: URL = URLString.parse('https://example.com');
  expect(value).toBeInstanceOf(URL);
  expect(value).toMatchInlineSnapshot(`"https://example.com/"`);
  expect(URLString.safeParse('https://example.com')).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": "https://example.com/",
    }
  `);
  expect(URLString.safeParse(42)).toMatchInlineSnapshot(`
    Object {
      "message": "Expected string, but was 42",
      "success": false,
    }
  `);
  expect(URLString.safeParse('not a url')).toMatchInlineSnapshot(`
    Object {
      "message": "Expected a valid URL but got 'not a url'",
      "success": false,
    }
  `);
});

test('test is optional', () => {
  const TrimmedString = ParsedValue<String, string>(String, {
    name: 'TrimmedString',
    parse(value) {
      return { success: true, value: value.trim() };
    },
    serialize(value) {
      // we're trusting the backend here, because there is no test!
      return { success: true, value };
    },
  });
  expect(() => TrimmedString.assert('foo bar')).toThrowErrorMatchingInlineSnapshot(
    `"TrimmedString does not support Runtype.test"`,
  );
  expect(TrimmedString.safeSerialize(' value ')).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": " value ",
    }
  `);
  // even though we're not testing before serialize, the value is still
  // validated after it has been serialized
  expect(TrimmedString.safeSerialize(42 as any)).toMatchInlineSnapshot(`
    Object {
      "message": "Expected string, but was 42",
      "success": false,
    }
  `);
  expect(show(TrimmedString)).toMatchInlineSnapshot(`"TrimmedString"`);
  const AnonymousStringTrim = ParsedValue(String, {
    parse(value) {
      return { success: true, value: value.trim() };
    },
  });
  expect(() => AnonymousStringTrim.assert('foo bar')).toThrowErrorMatchingInlineSnapshot(
    `"ParsedValue<string> does not support Runtype.test"`,
  );
  expect(show(AnonymousStringTrim)).toMatchInlineSnapshot(`"ParsedValue<string>"`);
});

test('serialize can return an error', () => {
  const URLString = ParsedValue(String, {
    name: 'URLString',
    parse(value) {
      try {
        return { success: true, value: new URL(value) };
      } catch (ex) {
        return { success: false, message: `Expected a valid URL but got '${value}'` };
      }
    },
    test: InstanceOf(URL),
    serialize(value) {
      if (value.protocol === 'https:') return { success: true, value: value.href };
      else return { success: false, message: `Refusing to serialize insecure URL: ${value.href}` };
    },
  });

  expect(URLString.safeSerialize(new URL('https://example.com'))).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": "https://example.com/",
    }
  `);
  expect(URLString.safeSerialize(new URL('http://example.com'))).toMatchInlineSnapshot(`
    Object {
      "message": "Refusing to serialize insecure URL: http://example.com/",
      "success": false,
    }
  `);
});

test('serialize returns an error if not implemented', () => {
  const URLString = ParsedValue(String, {
    parse(value) {
      try {
        return { success: true, value: new URL(value) };
      } catch (ex) {
        return { success: false, message: `Expected a valid URL but got '${value}'` };
      }
    },
  });

  expect(URLString.safeSerialize(new URL('https://example.com'))).toMatchInlineSnapshot(`
    Object {
      "message": "ParsedValue<string> does not support Runtype.serialize",
      "success": false,
    }
  `);
});

test('Handle Being Within Cycles', () => {
  const TrimmedString = ParsedValue(String, {
    name: 'TrimmedString',
    parse(value) {
      return { success: true, value: value.trim() };
    },
    test: String.withConstraint(
      value =>
        value.trim() === value || `Expected the string to be trimmed, but this one has whitespace`,
    ),
    serialize(value) {
      return { success: true, value: ` ${value} ` };
    },
  });
  type RecursiveType = [string, RecursiveType];
  const RecursiveType: Codec<RecursiveType> = Lazy(() => Tuple(TrimmedString, RecursiveType));

  const example = [' hello world ', undefined as any] as RecursiveType;
  example[1] = example;

  const expected = ['hello world', undefined as any] as RecursiveType;
  expected[1] = expected;

  const parsed = RecursiveType.parse(example);
  expect(parsed).toEqual(expected);

  const serialized = RecursiveType.serialize(parsed);
  expect(serialized).toEqual(example);

  expect(() => RecursiveType.assert(parsed)).not.toThrow();
  expect(() => RecursiveType.assert(serialized)).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign [\\" hello world \\", [\\" hello world \\" ... ]] to [TrimmedString, CIRCULAR tuple]
      The types of [0] are not compatible
        Unable to assign \\" hello world \\" to WithConstraint<string>
          Expected the string to be trimmed, but this one has whitespace"
  `);
});

test('Handle Being Outside Cycles', () => {
  type RecursiveTypePreParse = (string | RecursiveTypePreParse)[];
  type RecursiveType = RecursiveType[];
  const RecursiveTypeWithoutParse: Codec<RecursiveType> = Lazy(() =>
    Array(RecursiveTypeWithoutParse),
  );
  const RecursiveType: Codec<RecursiveType> = Lazy(() =>
    Array(Union(String, RecursiveType)).withParser({
      parse(arr) {
        return {
          success: true,
          value: arr.filter(
            <T>(value: T): value is Exclude<T, string> => typeof value !== 'string',
          ),
        };
      },
      serialize(arr: RecursiveType) {
        return { success: true, value: ['hello world', ...arr] };
      },
      test: RecursiveTypeWithoutParse,
    }),
  );

  const example: RecursiveTypePreParse = ['hello world'];
  example.push(example);

  const expected: RecursiveType = [];
  expected.push(expected);

  const parsed = RecursiveType.parse(example);
  expect(parsed).toEqual(expected);

  const serialized = RecursiveType.serialize(parsed);
  expect(serialized).toEqual(example);

  expect(() => RecursiveType.assert(parsed)).not.toThrow();
  expect(() => RecursiveType.assert(serialized)).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign [\\"hello world\\", [\\"hello world\\" ... ]] to (CIRCULAR array)[]
      The types of [0] are not compatible
        Expected an Array, but was \\"hello world\\""
  `);
});

test('Handle Being Outside Cycles - objects', () => {
  type RecursiveTypePreParse = { value: string | null; child: RecursiveTypePreParse };
  type RecursiveType = { child: RecursiveType };
  const RecursiveTypeWithoutParse: Codec<RecursiveType> = Lazy(() =>
    Object({ child: RecursiveTypeWithoutParse }),
  );
  const RecursiveType: Codec<RecursiveType> = Lazy(() =>
    Object({ value: Union(String, Null), child: RecursiveType }).withParser({
      parse({ value, ...rest }) {
        return {
          success: true,
          value: rest,
        };
      },
      serialize(obj: RecursiveType) {
        return {
          success: true,
          value: {
            value: 'hello world',
            child: obj.child,
          },
        };
      },
      test: RecursiveTypeWithoutParse,
    }),
  );

  const example: RecursiveTypePreParse = { value: 'hello world', child: null as any };
  example.child = example;

  const expected: RecursiveType = { child: null as any };
  expected.child = expected;

  const parsed = RecursiveType.parse(example);
  expect(parsed).toEqual(expected);

  const serialized = RecursiveType.serialize(parsed);
  expect(serialized).toEqual(example);

  expect(() => RecursiveType.assert(parsed)).not.toThrow();
});

test('Fails when cycles modify types', () => {
  type RecursiveTypePreParse = RecursiveTypePreParse[];
  type RecursiveType = { values: RecursiveType[] };
  const RecursiveTypeWithoutParse: Codec<RecursiveType> = Lazy(() =>
    Object({ values: Array(RecursiveTypeWithoutParse) }),
  );
  const RecursiveType: Codec<RecursiveType> = Lazy(
    () =>
      Array(RecursiveType).withParser({
        name: 'Parser<Array ↔ Object>',
        parse(arr) {
          return {
            success: true,
            value: { values: arr },
          };
        },
        serialize(obj) {
          return { success: true, value: obj.values };
        },
        test: RecursiveTypeWithoutParse,
      }),
    // TODO: the type for serialize doesn't quite line up here
  ) as any;

  const example: RecursiveTypePreParse = [];
  example.push(example);

  const expected: RecursiveType = { values: [] };
  expected.values.push(expected);

  // parse doesn't work because the recursive passing in `Array(RecursiveType)` "locks in" a type of "Array"
  // and we later change it to object
  expect(RecursiveType.safeParse(example)).toMatchInlineSnapshot(`
    Object {
      "message": "Cannot convert a value of type \\"Array\\" into a value of type \\"object\\" when it contains cycles.",
      "success": false,
    }
  `);

  // we can still use this recursive type to parse arbitrarily nested data
  expect(RecursiveType.safeParse([[], [[]]])).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Object {
        "values": Array [
          Object {
            "values": Array [],
          },
          Object {
            "values": Array [
              Object {
                "values": Array [],
              },
            ],
          },
        ],
      },
    }
  `);

  // the type conversion in serialize happens before the data type has locked in
  // so we can handle cyclic data structures, although it's probably not a great
  // idea
  expect(RecursiveType.safeSerialize(expected)).toMatchInlineSnapshot(`
    Object {
      "success": true,
      "value": Array [
        [Circular],
      ],
    }
  `);
});

test('Handles partial tests on parse', () => {
  // Result type doesn't support `undefined` when parsing
  // but only because we haven't implemented that test
  const ResultType = Sealed(
    Union(
      Object({ hello: Literal('world') }),
      ParsedValue(Object({}), {
        parse(_value) {
          return { success: true, value: undefined };
        },
      }),
    ),
    { deep: true },
  );
  const JsonType = ParsedValue(String, {
    test: ResultType,
    parse(value) {
      try {
        return ResultType.safeParse(JSON.parse(value));
      } catch (ex) {
        return {
          success: false,
          message: `Expected a JSON string but got ${JSON.stringify(value)}`,
        };
      }
    },
    serialize(value) {
      const r = ResultType.safeSerialize(value);
      return r.success ? { success: true, value: JSON.stringify(r.value) } : r;
    },
  });
  // The test supports { hello 'world' } as one of the values in the union
  expect(() => ResultType.assert({ hello: 'world' })).not.toThrow();
  expect(() => JsonType.assert({ hello: 'world' })).not.toThrow();

  // although undefined can be returned from the "parse", it is not supported by the test,
  // but this is only because it is not implemented
  expect(() => ResultType.assert(undefined)).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign undefined to { hello: \\"world\\"; } | ParsedValue<{}>
      Unable to assign undefined to { hello: \\"world\\"; }
        Expected { hello: \\"world\\"; }, but was undefined
      And unable to assign undefined to ParsedValue<{}>
        ParsedValue<{}> does not support Runtype.test"
  `);
  expect(() => JsonType.assert(undefined)).toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign undefined to { hello: \\"world\\"; } | ParsedValue<{}>
      Unable to assign undefined to { hello: \\"world\\"; }
        Expected { hello: \\"world\\"; }, but was undefined
      And unable to assign undefined to ParsedValue<{}>
        ParsedValue<{}> does not support Runtype.test"
  `);

  // We used Sealed, so extra properties are not allowed
  expect(() => JsonType.assert({ hello: 'world', whatever: true }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Unable to assign {hello: \\"world\\", whatever: true} to { hello: \\"world\\"; } | ParsedValue<{}>
      Unable to assign {hello: \\"world\\", whatever: true} to { hello: \\"world\\"; }
        Unexpected property: whatever
      And unable to assign {hello: \\"world\\", whatever: true} to ParsedValue<{}>
        ParsedValue<{}> does not support Runtype.test"
  `);

  // The basic parsing works
  expect(JsonType.safeParse(`{"hello": "world"}`)).toEqual({
    success: true,
    value: { hello: 'world' },
  });
  // Parsing also works even if the test would fail because it is not
  // implemented
  expect(JsonType.safeParse(`{}`)).toEqual({
    success: true,
    value: undefined,
  });

  // We used Sealed, so extra properties are not allowed
  expect(showError(JsonType.safeParse(`{"hello": "world", "whatever": true}`) as any))
    .toMatchInlineSnapshot(`
    "Unable to assign {hello: \\"world\\", whatever: true} to { hello: \\"world\\"; } | ParsedValue<{}>
      Unable to assign {hello: \\"world\\", whatever: true} to { hello: \\"world\\"; }
        Unexpected property: whatever
      And unable to assign {hello: \\"world\\", whatever: true} to {}
        Unexpected property: hello
        Unexpected property: whatever"
  `);

  // We can serialize the normal object
  expect(JsonType.safeSerialize({ hello: 'world' })).toEqual({
    success: true,
    value: `{"hello":"world"}`,
  });
  // We cannot serialize undefined because we didn't implement serialize for that value in the union
  expect(JsonType.safeSerialize(undefined)).toEqual({
    success: false,
    message: 'Expected { hello: "world"; }, but was undefined',
  });
  // We used Sealed, so extra properties are not allowed
  expect(showError(JsonType.safeSerialize({ hello: 'world', whatever: true } as any) as any))
    .toMatchInlineSnapshot(`
    "Unable to assign {hello: \\"world\\", whatever: true} to { hello: \\"world\\"; }
      Unexpected property: whatever"
  `);

  // We still apply normal tests post-parse, so you can still use the `test` to add
  // extra constraints
  const evenString = ParsedValue(String, {
    test: Number.withConstraint(
      value => (value % 2 === 0 ? true : `Expected an even number but got ${value}`),
      { name: `EvenNumber` },
    ),
    parse(value) {
      if (!/^\d+$/.test(value)) {
        return {
          success: false,
          message: `Expected an even integer but got ${JSON.stringify(value)}`,
        };
      }
      return { success: true, value: parseInt(value, 10) };
    },
    name: `EvenString`,
  });
  expect(evenString.safeParse('10')).toEqual({
    success: true,
    value: 10,
  });
  expect(showError(evenString.safeParse('9') as any)).toMatchInlineSnapshot(`
    "Unable to assign 9 to EvenNumber
      Expected an even number but got 9"
  `);
});
