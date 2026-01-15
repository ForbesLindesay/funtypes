import {
  Unknown,
  Never,
  Undefined,
  Null,
  Boolean,
  Number,
  String,
  Symbol,
  Literal,
  Array,
  Record,
  Object,
  Partial,
  Tuple,
  Union,
  Intersect,
  Function,
  Lazy,
  InstanceOf,
  Constraint,
  Brand,
  Readonly,
} from '.';
import { Runtype, showType } from './runtype';

class TestClass {}

const cases: [Runtype, string][] = [
  [Unknown, 'unknown'],
  [Never, 'never'],
  [Undefined, 'undefined'],
  [Null, 'null'],
  [Boolean, 'boolean'],
  [Number, 'number'],
  [String, 'string'],
  [Symbol, 'symbol'],
  [Literal(true), 'true'],
  [Literal(3), '3'],
  [Literal('foo'), '"foo"'],
  [Array(String), 'string[]'],
  [Readonly(Array(String)), 'readonly string[]'],
  [Record(String, Array(Boolean)), 'Record<string, boolean[]>'],
  [Record(String, Array(Boolean)), 'Record<string, boolean[]>'],
  [Record(Number, Array(Boolean)), 'Record<number, boolean[]>'],
  [Object({}), '{}'],
  [Readonly(Object({})), '{}'],
  [Partial({}), '{}'],
  [InstanceOf(TestClass), 'InstanceOf<TestClass>'],
  [Array(InstanceOf(TestClass)), 'InstanceOf<TestClass>[]'],
  [Object({ x: String, y: Array(Boolean) }), '{ x: string; y: boolean[] }'],
  [Object({ x: String, y: Array(Boolean) }), '{ x: string; y: boolean[] }'],
  [Intersect(Object({ x: Number }), Partial({ y: Number })), '{ x: number; y?: number }'],
  [
    Readonly(Object({ x: String, y: Array(Boolean) })),
    '{ readonly x: string; readonly y: boolean[] }',
  ],
  [Object({ x: String, y: Readonly(Array(Boolean)) }), '{ x: string; y: readonly boolean[] }'],
  [
    Readonly(Object({ x: String, y: Readonly(Array(Boolean)) })),
    '{ readonly x: string; readonly y: readonly boolean[] }',
  ],
  [Partial({ x: String, y: Array(Boolean) }), '{ x?: string; y?: boolean[] }'],
  [Partial(Object({ x: String, y: Array(Boolean) })), '{ x?: string; y?: boolean[] }'],
  [Tuple(Boolean, Number), '[boolean, number]'],
  [Union(Boolean, Number), 'boolean | number'],
  [Intersect(Boolean, Number), 'boolean & number'],
  [Function, 'function'],
  [Lazy(() => Boolean), 'boolean'],
  [Constraint(Number, x => x > 3), 'WithConstraint<number>'],
  [Brand('someNumber', Number), 'number'],
  [Constraint(Brand('someNumber', Number), x => x > 3), 'WithConstraint<number>'],

  // Parenthesization
  [Intersect(Boolean, Union(Number, String)), 'boolean & (number | string)'],
  [Union(Boolean, Intersect(Number, String)), 'boolean | (number & string)'],
  [Union(Boolean, Object({ x: String, y: Number })), 'boolean | { x: string; y: number }'],
];

for (const [T, expected] of cases) {
  const s = showType(T);
  it(s, () => {
    expect(s).toBe(expected);
    expect(T.toString()).toBe(`Runtype<${s}>`);
  });
}
