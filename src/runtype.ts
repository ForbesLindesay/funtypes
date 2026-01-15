import type { Result, Failure } from './result';

import { ValidationError } from './errors';
import { failure, success } from './result';
import { RuntypeIntrospection } from './introspection';

export type InnerValidateHelper = <T>(runtype: Runtype<T>, value: unknown) => Result<T>;
declare const internalSymbol: unique symbol;
const internal: typeof internalSymbol =
  '__internal_runtype_methods__' as unknown as typeof internalSymbol;

export function assertRuntype(...values: Runtype[]) {
  for (const value of values) {
    if (!value || !value[internal]) {
      throw new Error(`Expected Runtype but got ${showValue(value)}`);
    }
  }
}
export function isRuntype(value: unknown): value is Runtype {
  return typeof value === 'object' && value != null && internal in value;
}
export function getInternal<T>(value: Runtype<T>): InternalValidation<T> {
  return value[internal];
}

export type ResultWithCycle<T> = (Result<T> & { cycle?: false }) | Cycle<T>;

export type SealedState =
  | { readonly keysFromIntersect?: ReadonlySet<string>; readonly deep: boolean }
  | false;
export interface InternalValidation<TParsed> {
  /**
   * parse
   */
  _parse(
    x: any,
    innerValidate: <T>(runtype: Runtype<T>, value: unknown, sealed?: SealedState) => Result<T>,
    innerValidateToPlaceholder: <T>(
      runtype: Runtype<T>,
      value: unknown,
      sealed?: SealedState,
    ) => ResultWithCycle<T>,
    mode: 'p' | 's' | 't',
    sealed: SealedState,
  ): ResultWithCycle<TParsed>;
  /**
   * test
   */
  _test?: (
    x: any,
    innerValidate: <T>(
      runtype: Runtype<T>,
      value: unknown,
      sealed?: SealedState,
    ) => Failure | undefined,
    sealed: SealedState,
    isOptionalTest: boolean,
  ) => Failure | undefined;
  /**
   * serialize
   */
  _serialize?: (
    // any is used here to ensure TypeScript still treats Runtype as
    // covariant.
    x: any,
    innerSerialize: (runtype: Runtype, value: unknown, sealed?: SealedState) => Result<any>,
    innerSerializeToPlaceholder: (
      runtype: Runtype,
      value: unknown,
      sealed?: SealedState,
    ) => ResultWithCycle<any>,
    mode: 's',
    sealed: SealedState,
  ) => ResultWithCycle<any>;
  /**
   * get underlying type
   */
  _underlyingType?: (mode: 'p' | 's' | 't') => Runtype | undefined;

  /**
   * get fields, not called if "u" is implemented, can return
   * undefined to indicate that arbitrarily many fields are
   * possible.
   */
  _fields?: (mode: 'p' | 't' | 's') => ReadonlySet<string> | undefined;

  /**
   * "view" a string representation of this type for debugging/error messages
   */
  _showType?: (needsParens: boolean) => string;

  /**
   * asMutable
   */
  _asMutable?: (asMutable: (t: Codec<any>) => Codec<any>) => Codec<any>;
  /**
   * asReadonly
   */
  _asReadonly?: (asReadonly: (t: Codec<any>) => Codec<any>) => Codec<any>;

  /**
   * Pick keys from an object
   */
  _pick?: (keys: string[], pick: (t: Codec<any>, keys: string[]) => Codec<any>) => Codec<any>;
  /**
   * Omit keys from an object
   */
  _omit?: (keys: string[], omit: (t: Codec<any>, keys: string[]) => Codec<any>) => Codec<any>;
}

/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface Runtype<TParsed = unknown> {
  readonly introspection: RuntypeIntrospection;

  /**
   * Verifies that a value conforms to this runtype. When given a value that does
   * not conform to the runtype, throws an exception.
   *
   * @throws ValidationError
   */
  assert(x: any): asserts x is TParsed;

  /**
   * A type guard for this runtype.
   */
  test(x: any): x is TParsed;

  /**
   * Validates the value conforms to this type, and performs
   * the `parse` action for any `ParsedValue` types.
   *
   * If the value is valid, it returns the parsed value,
   * otherwise it throws a ValidationError.
   *
   * @throws ValidationError
   */
  parse(x: any): TParsed;

  /**
   * Validates the value conforms to this type, and performs
   * the `parse` action for any `ParsedValue` types.
   *
   * Returns a `Result`, constaining the parsed value or
   * error message. Does not throw!
   */
  safeParse(x: any): Result<TParsed>;

  [internal]: InternalValidation<TParsed>;
}

export interface Codec<TParsed> extends Runtype<TParsed> {
  /**
   * Validates the value conforms to this type, and performs
   * the `serialize` action for any `ParsedValue` types.
   *
   * If the value is valid, and the type supports serialize,
   * it returns the serialized value, otherwise it throws a
   * ValidationError.
   *
   * @throws ValidationError
   */
  serialize: (x: TParsed) => unknown;
  /**
   * Validates the value conforms to this type, and performs
   * the `serialize` action for any `ParsedValue` types.
   *
   * Returns a `Result`, constaining the serialized value or
   * error message. Does not throw!
   */
  safeSerialize: (x: TParsed) => Result<unknown>;
  toString: () => string;
}
/**
 * Obtains the static type associated with a Runtype.
 */
export type Static<A extends Runtype<any>> = A extends Runtype<infer T> ? T : unknown;

export function create<T>(
  internalImplementation: InternalValidation<T> | InternalValidation<T>['_parse'],
  introspection: RuntypeIntrospection,
): Codec<T> {
  const A: Codec<T> = {
    introspection,
    assert(x: any): asserts x is T {
      const validated = innerGuard(A, x, createGuardVisitedState(), false, false);
      if (validated) {
        throw new ValidationError(validated);
      }
    },
    parse,
    safeParse,
    test,
    serialize(x: any) {
      const validated = safeSerialize(x);
      if (!validated.success) {
        throw new ValidationError(validated);
      }
      return validated.value;
    },
    safeSerialize,
    toString: () => `Runtype<${showType(A)}>`,
    [internal]:
      typeof internalImplementation === 'function'
        ? { _parse: internalImplementation }
        : internalImplementation,
  };

  return A;

  function safeParse(x: any) {
    return innerValidate(A, x, createVisitedState(), false);
  }
  function safeSerialize(x: any) {
    return innerSerialize(A, x, createVisitedState(), false);
  }
  function parse(x: any) {
    const validated = safeParse(x);
    if (!validated.success) {
      throw new ValidationError(validated);
    }
    return validated.value;
  }

  function test(x: any): x is T {
    const validated = innerGuard(A, x, createGuardVisitedState(), false, false);
    return validated === undefined;
  }
}

export function getShow(v: Runtype) {
  return v[internal]._showType;
}

export interface Cycle<T> {
  success: true;
  cycle: true;
  placeholder: Partial<T>;
  unwrap: () => Result<T>;
}

function attemptMixin<T>(placeholder: any, value: T): Result<T> {
  if (placeholder === value) {
    return success(value);
  }
  if (Array.isArray(placeholder) && Array.isArray(value)) {
    placeholder.splice(0, placeholder.length, ...value);
    return success(placeholder as any);
  }
  if (
    placeholder &&
    typeof placeholder === 'object' &&
    !Array.isArray(placeholder) &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    Object.assign(placeholder, value);
    return success(placeholder);
  }
  return failure(
    `Cannot convert a value of type "${
      Array.isArray(placeholder) ? 'Array' : typeof placeholder
    }" into a value of type "${
      value === null ? 'null' : Array.isArray(value) ? 'Array' : typeof value
    }" when it contains cycles.`,
  );
}

/**
 * Get the underlying type of a runtype, if it is a wrapper around another type
 */
export function unwrapRuntype(t: Runtype, mode: 'p' | 's' | 't'): Runtype {
  const i = t[internal];
  const unwrapped = i._underlyingType ? i._underlyingType(mode) : undefined;
  if (unwrapped && unwrapped !== t) {
    return unwrapRuntype(unwrapped, mode);
  }
  return t;
}

export function createValidationPlaceholder<T>(
  placeholder: T,
  fn: (placeholder: T) => Failure | undefined,
): Cycle<T> {
  return innerMapValidationPlaceholder(placeholder, () => fn(placeholder) || success(placeholder));
}

export function mapValidationPlaceholder<T, S>(
  source: ResultWithCycle<T>,
  fn: (placeholder: T) => Result<S>,
  extraGuard?: Runtype<S>,
): ResultWithCycle<S> {
  if (!source.success) return source;
  if (!source.cycle) {
    const result = fn(source.value);
    return (
      (result.success &&
        extraGuard &&
        innerGuard(extraGuard, result.value, createGuardVisitedState(), false, true)) ||
      result
    );
  }

  return innerMapValidationPlaceholder(
    Array.isArray(source.placeholder) ? [...source.placeholder] : { ...source.placeholder },
    () => source.unwrap(),
    fn,
    extraGuard,
  );
}

function innerMapValidationPlaceholder(
  placeholder: any,
  populate: () => Result<any>,
  fn?: (placeholder: any) => Result<any>,
  extraGuard?: Runtype<any>,
): Cycle<any> {
  let hasCycle = false;
  let cache: Result<any> | undefined;
  const cycle: Cycle<any> = {
    success: true,
    cycle: true,
    placeholder,
    unwrap: () => {
      if (cache) {
        hasCycle = true;
        return cache;
      }
      cache = success(placeholder);

      const sourceResult = populate();
      const result = sourceResult.success && fn ? fn(sourceResult.value) : sourceResult;
      if (!result.success) return (cache = result);
      if (hasCycle) {
        const unwrapResult = attemptMixin(cache.value, result.value);
        const guardFailure =
          unwrapResult.success &&
          extraGuard &&
          innerGuard(extraGuard, unwrapResult.value, createGuardVisitedState(), false, true);
        cache = guardFailure || unwrapResult;
      } else {
        const guardFailure =
          extraGuard &&
          innerGuard(extraGuard, result.value, createGuardVisitedState(), false, true);
        cache = guardFailure || result;
      }

      if (cache.success) {
        cycle.placeholder = cache.value;
      }

      return cache;
    },
  };
  return cycle;
}

declare const OpaqueVisitedState: unique symbol;
export type OpaqueVisitedState = typeof OpaqueVisitedState;
type VisitedState = Map<Runtype<unknown>, Map<any, Cycle<any>>>;

function unwrapVisitedState(o: OpaqueVisitedState): VisitedState {
  return o as any;
}
function wrapVisitedState(o: VisitedState): OpaqueVisitedState {
  return o as any;
}

export function createVisitedState(): OpaqueVisitedState {
  return wrapVisitedState(new Map());
}

declare const OpaqueGuardVisitedState: unique symbol;
export type OpaqueGuardVisitedState = typeof OpaqueGuardVisitedState;
type GuardVisitedState = Map<Runtype<unknown>, Set<any>>;

function unwrapGuardVisitedState(o: OpaqueGuardVisitedState): GuardVisitedState {
  return o as any;
}
function wrapGuardVisitedState(o: GuardVisitedState): OpaqueGuardVisitedState {
  return o as any;
}

export function createGuardVisitedState(): OpaqueGuardVisitedState {
  return wrapGuardVisitedState(new Map());
}

export function innerValidate<T>(
  targetType: Runtype<T>,
  value: any,
  $visited: OpaqueVisitedState,
  sealed: SealedState,
): Result<T> {
  const result = innerValidateToPlaceholder(targetType, value, $visited, sealed);
  if (result.cycle) {
    return result.unwrap();
  }
  return result;
}

function innerValidateToPlaceholder<T>(
  targetType: Runtype<T>,
  value: any,
  $visited: OpaqueVisitedState,
  sealed: SealedState,
): ResultWithCycle<T> {
  const visited = unwrapVisitedState($visited);
  const validator = targetType[internal];
  const cached = visited.get(targetType)?.get(value);
  if (cached !== undefined) {
    return cached;
  }
  const result = validator._parse(
    value,
    (t, v, s) => innerValidate(t, v, $visited, s ?? sealed),
    (t, v, s) => innerValidateToPlaceholder(t, v, $visited, s ?? sealed),
    'p',
    sealed,
  );
  if (result.cycle) {
    visited.set(targetType, (visited.get(targetType) || new Map()).set(value, result));
    return result;
  }
  return result;
}

export function innerSerialize<T>(
  targetType: Runtype<T>,
  value: any,
  $visited: OpaqueVisitedState,
  sealed: SealedState,
): Result<T> {
  const result = innerSerializeToPlaceholder(targetType, value, $visited, sealed);
  if (result.cycle) {
    return result.unwrap();
  }
  return result;
}
function innerSerializeToPlaceholder(
  targetType: Runtype,
  value: any,
  $visited: OpaqueVisitedState,
  sealed: SealedState,
): ResultWithCycle<any> {
  const visited = unwrapVisitedState($visited);
  const validator = targetType[internal];
  const cached = visited.get(targetType)?.get(value);
  if (cached !== undefined) {
    return cached;
  }
  const fn: typeof validator._serialize = validator._serialize || validator._parse;
  let result = fn(
    value,
    (t, v, s) => innerSerialize(t, v, $visited, s ?? sealed),
    (t, v, s) => innerSerializeToPlaceholder(t, v, $visited, s ?? sealed),
    's',
    sealed,
  );
  if (result.cycle) {
    visited.set(targetType, (visited.get(targetType) || new Map()).set(value, result));
    return result;
  }
  return result;
}

export function innerGuard(
  targetType: Runtype,
  value: any,
  $visited: OpaqueGuardVisitedState,
  sealed: SealedState,
  isOptionalTest: boolean,
): Failure | undefined {
  const visited = unwrapGuardVisitedState($visited);
  const validator = targetType[internal];
  if (value && (typeof value === 'object' || typeof value === 'function')) {
    const cached = visited.get(targetType)?.has(value);
    if (cached) return undefined;
    visited.set(targetType, (visited.get(targetType) || new Set()).add(value));
  }
  if (validator._test) {
    return validator._test(
      value,
      (t, v, s) => innerGuard(t, v, $visited, s ?? sealed, isOptionalTest),
      sealed,
      isOptionalTest,
    );
  }
  let result = validator._parse(
    value,
    (t, v, s) => innerGuard(t, v, $visited, s ?? sealed, isOptionalTest) || success(v as any),
    (t, v, s) => innerGuard(t, v, $visited, s ?? sealed, isOptionalTest) || success(v as any),
    't',
    sealed,
  );
  if (result.cycle) result = result.unwrap();
  if (result.success) return undefined;
  else return result;
}

/**
 * Get the possible fields for a runtype
 * Returns "undefined" if there can be arbitrary fields (e.g. Record<string, number>)
 */
export function getFields(t: Runtype, mode: 'p' | 's' | 't'): ReadonlySet<string> | undefined {
  const b = unwrapRuntype(t, mode);
  const i = b[internal];
  return i._fields ? i._fields(mode) : undefined;
}

export const parenthesize = (s: string, needsParens: boolean) => (needsParens ? `(${s})` : s);
const circular = new Set<Runtype<unknown>>();
export const showType = (runtype: Runtype<unknown>, needsParens: boolean = false): string => {
  if (circular.has(runtype) && runtype.introspection.tag !== 'lazy') {
    return parenthesize(`CIRCULAR ${runtype.introspection.tag}`, needsParens);
  }

  if (runtype[internal]._showType) {
    circular.add(runtype);

    try {
      return runtype[internal]._showType(needsParens);
    } finally {
      circular.delete(runtype);
    }
  }

  return runtype.introspection.tag;
};

export function showValue(
  value: unknown,
  remainingDepth: number = 3,
  remainingLength: number = 30,
): string {
  switch (typeof value) {
    case 'bigint':
    case 'boolean':
    case 'number':
      return `${value}`;
    case 'string':
      return JSON.stringify(value);
    case 'object':
      if (value === null) {
        return 'null';
      }
      if (Array.isArray(value)) {
        if (remainingDepth === 0 || remainingLength === 0) {
          return '[Array]';
        } else {
          let result = '[';
          let i = 0;
          for (i = 0; i < value.length && remainingLength > result.length; i++) {
            if (i !== 0) result += ', ';
            result += showValue(value[i], remainingDepth - 1, remainingLength - result.length);
          }
          if (i < value.length) {
            result += ' ... ';
          }
          result += ']';
          return result;
        }
      }
      if (isRuntype(value)) {
        return value.toString();
      }
      if (remainingDepth === 0) {
        return '{Object}';
      } else {
        const props = Object.entries(value);
        let result = '{';
        let i = 0;
        for (i = 0; i < props.length && remainingLength > result.length; i++) {
          if (i !== 0) result += ', ';
          const [key, v] = props[i];
          result += `${/\s/.test(key) ? JSON.stringify(key) : key}: ${showValue(
            v,
            remainingDepth - 1,
            remainingLength - result.length,
          )}`;
        }
        if (i < props.length) {
          result += ' ... ';
        }
        result += '}';
        return result;
      }
    case 'function':
    case 'symbol':
    case 'undefined':
    default:
      return typeof value;
  }
}
export function showValueNonString(value: unknown): string {
  return `${showValue(value)}${typeof value === 'string' ? ` (i.e. a string literal)` : ``}`;
}
