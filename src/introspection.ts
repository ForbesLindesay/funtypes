import type { Runtype } from './runtype';
import type { LiteralValue } from './types/literal';
import { RecordFields } from './types/Object';

export interface ArrayIntrospection {
  readonly tag: 'array';
  readonly element: Runtype;
  readonly isReadonly: boolean;
}

export interface BrandIntrospection {
  readonly tag: 'brand';
  readonly brand: string;
  readonly entity: Runtype;
}

export interface ConstraintIntrospection {
  readonly tag: 'constraint';
  readonly underlying: Runtype;
  readonly name?: string;
}

export interface EnumIntrospection {
  readonly tag: 'enum';
  readonly enumObject: { [key: string]: number | string };
}

export interface InstanceOfIntrospection {
  readonly tag: 'instanceof';
  readonly ctor: { new (...args: any[]): unknown };
}

export interface IntersectIntrospection {
  readonly tag: 'intersect';
  readonly intersectees: readonly Runtype[];
}

export interface KeyOfIntrospection {
  readonly tag: 'keyOf';
  readonly keys: Set<string>;
}

export interface LazyIntrospection {
  readonly tag: 'lazy';
  readonly underlying: () => Runtype;
}

export interface LiteralIntrospection {
  readonly tag: 'literal';
  readonly value: LiteralValue;
}

export interface NamedIntrospection {
  readonly tag: 'named';
  readonly underlying: Runtype;
  readonly name: string;
}

export interface NeverIntrospection {
  readonly tag: 'never';
}

export interface ObjectIntrospection {
  readonly tag: 'object';
  readonly fields: RecordFields;
  readonly isPartial: boolean;
  readonly isReadonly: boolean;
}

export interface ParsedValueIntrospection {
  readonly tag: 'parsed';
  readonly underlying: Runtype;
  readonly name: string | undefined;
  readonly test: Runtype | undefined;
}

export interface RecordIntrospection {
  readonly tag: 'record';
  readonly key: Runtype<string | number>;
  readonly value: Runtype;
  readonly isReadonly: boolean;
}

export interface SealedIntrospection {
  readonly tag: 'sealed';
  readonly underlying: Runtype;
  readonly deep: boolean;
}

export interface TupleIntrospection {
  readonly tag: 'tuple';
  readonly components: readonly Runtype[];
  readonly isReadonly: boolean;
}

export interface UnionIntrospection {
  readonly tag: 'union';
  readonly alternatives: readonly Runtype[];
}

export interface UnknownIntrospection {
  readonly tag: 'unknown';
}

// Primitive types

export interface BooleanIntrospection {
  readonly tag: 'boolean';
}

export interface FunctionIntrospection {
  readonly tag: 'function';
}

export interface NumberIntrospection {
  readonly tag: 'number';
}

export interface StringIntrospection {
  readonly tag: 'string';
}

export interface SymbolIntrospection {
  readonly tag: 'symbol';
}

export interface BigIntIntrospection {
  readonly tag: 'bigint';
}

export type PrimitiveIntrospection =
  | BooleanIntrospection
  | FunctionIntrospection
  | NumberIntrospection
  | StringIntrospection
  | SymbolIntrospection
  | BigIntIntrospection;

export type RuntypeIntrospection =
  | ArrayIntrospection
  | BrandIntrospection
  | ConstraintIntrospection
  | EnumIntrospection
  | InstanceOfIntrospection
  | IntersectIntrospection
  | KeyOfIntrospection
  | LazyIntrospection
  | LiteralIntrospection
  | NamedIntrospection
  | NeverIntrospection
  | ObjectIntrospection
  | ParsedValueIntrospection
  | RecordIntrospection
  | SealedIntrospection
  | TupleIntrospection
  | UnionIntrospection
  | UnknownIntrospection
  | PrimitiveIntrospection;
