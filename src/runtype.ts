import { Result, Union, Intersect, Constraint, ConstraintCheck, Brand, Failure } from './index';
import show from './show';
import { ValidationError } from './errors';
import { ParsedValue, ParsedValueConfig } from './types/ParsedValue';

export type InnerValidateHelper = <T>(runtype: RuntypeBase<T>, value: unknown) => Result<T>;
declare const internalSymbol: unique symbol;
const internal: typeof internalSymbol = ('__internal__' as unknown) as typeof internalSymbol;

export type ResultWithCycle<T> = (Result<T> & { cycle?: false }) | Cycle<T>;
export interface InternalValidation<TParsed> {
  validate(
    x: any,
    innerValidate: <T>(runtype: RuntypeBase<T>, value: unknown) => Result<T>,
    innerValidateToPlaceholder: <T>(runtype: RuntypeBase<T>, value: unknown) => ResultWithCycle<T>,
  ): ResultWithCycle<TParsed>;
  test?: (
    x: any,
    innerValidate: <T>(runtype: RuntypeBase<T>, value: unknown) => Failure | undefined,
  ) => Failure | undefined;
  serialize?: (
    x: any,
    innerSerialize: (runtype: RuntypeBase, value: unknown) => Result<any>,
    innerSerializeToPlaceholder: (runtype: RuntypeBase, value: unknown) => ResultWithCycle<any>,
  ) => ResultWithCycle<any>;
}
/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface RuntypeBase<A = unknown> {
  readonly tag: string;

  show?: (ctx: {
    needsParens: boolean;
    parenthesize: (str: string) => string;
    showChild: (rt: RuntypeBase, needsParens: boolean) => string;
  }) => string;

  [internal]: InternalValidation<A>;
}

/**
 * A runtype determines at runtime whether a value conforms to a type specification.
 */
export interface Runtype<TParsed> extends RuntypeBase<TParsed> {
  /**
   * Verifies that a value conforms to this runtype. When given a value that does
   * not conform to the runtype, throws an exception.
   */
  assert(x: any): asserts x is TParsed;

  /**
   * A type guard for this runtype.
   */
  test(x: any): x is TParsed;

  /**
   * @deprecated use Runtype.test
   */
  guard(x: any): x is TParsed;

  /**
   * Verifies that a value conforms to this runtype. If so, returns the same value,
   * statically typed. Otherwise throws an exception.
   */
  parse(x: any): TParsed;

  /**
   * @deprecated use Runtype.parse
   */
  check(x: any): TParsed;

  /**
   * Validates that a value conforms to this type, and returns a result indicating
   * success or failure (does not throw).
   */
  safeParse(x: any): Result<TParsed>;

  /**
   * @deprecated use Runtype.safeParse
   */
  validate(x: any): Result<TParsed>;

  /**
   * Union this Runtype with another.
   */
  Or<B extends RuntypeBase>(B: B): Union<[this, B]>;

  /**
   * Intersect this Runtype with another.
   */
  And<B extends RuntypeBase>(B: B): Intersect<[this, B]>;

  /**
   * Use an arbitrary constraint function to validate a runtype, and optionally
   * to change its name and/or its static type.
   *
   * @template T - Optionally override the static type of the resulting runtype
   * @param {(x: Static<this>) => boolean | string} constraint - Custom function
   * that returns `true` if the constraint is satisfied, `false` or a custom
   * error message if not.
   * @param [options]
   * @param {string} [options.name] - allows setting the name of this
   * constrained runtype, which is helpful in reflection or diagnostic
   * use-cases.
   */
  withConstraint<T extends Static<this>, K = unknown>(
    constraint: ConstraintCheck<this>,
    options?: { name?: string; args?: K },
  ): Constraint<this, T, K>;

  /**
   * Helper function to convert an underlying Runtype into another static type
   * via a type guard function.  The static type of the runtype is inferred from
   * the type of the test function.
   *
   * @template T - Typically inferred from the return type of the type guard
   * function, so usually not needed to specify manually.
   * @param {(x: Static<this>) => x is T} test - Type test function (see
   * https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards)
   *
   * @param [options]
   * @param {string} [options.name] - allows setting the name of this
   * constrained runtype, which is helpful in reflection or diagnostic
   * use-cases.
   */
  withGuard<T extends Static<this>, K = unknown>(
    test: (x: Static<this>) => x is T,
    options?: { name?: string; args?: K },
  ): Constraint<this, T, K>;

  /**
   * Adds a brand to the type.
   */
  withBrand<B extends string>(brand: B): Brand<B, this>;

  /**
   * Apply conversion functions when parsing/serializing this value
   */
  withParser<TParsed>(value: ParsedValueConfig<this, TParsed>): ParsedValue<this, TParsed>;
}

export interface Codec<TParsed, TSerialized = TParsed> extends Runtype<TParsed> {
  serialize: (x: TParsed) => TSerialized;
  safeSerialize: (x: TParsed) => Result<TSerialized>;
}
/**
 * Obtains the static type associated with a Runtype.
 */
export type Static<A extends RuntypeBase<any>> = A extends RuntypeBase<infer T> ? T : unknown;

export function create<TConfig extends Codec<any, any>>(
  internalImplementation:
    | InternalValidation<Static<TConfig>>
    | InternalValidation<Static<TConfig>>['validate'],
  config: Omit<
    TConfig,
    | 'assert'
    | 'check'
    | 'test'
    | 'guard'
    | 'parse'
    | 'check'
    | 'safeParse'
    | 'validate'
    | 'serialize'
    | 'safeSerialize'
    | 'Or'
    | 'And'
    | 'withConstraint'
    | 'withGuard'
    | 'withBrand'
    | 'withParser'
    | typeof internal
  >,
): TConfig {
  const A: Codec<Static<TConfig>> = {
    ...config,
    assert,
    parse,
    check: parse,
    safeParse,
    validate: safeParse,
    test,
    guard: test,
    serialize,
    safeSerialize,
    Or,
    And,
    withConstraint,
    withGuard,
    withBrand,
    withParser,
    toString: () => `Runtype<${show(A)}>`,
    [internal]:
      typeof internalImplementation === 'function'
        ? {
            validate: internalImplementation,
          }
        : internalImplementation,
  };

  return (A as unknown) as TConfig;

  function safeParse(x: any) {
    return innerValidate(A, x, createVisitedState());
  }
  function safeSerialize(x: any) {
    return innerSerialize(A, x, createVisitedState());
  }
  function parse(x: any) {
    const validated = safeParse(x);
    if (!validated.success) {
      throw new ValidationError(validated.message, validated.key);
    }
    return validated.value;
  }
  function serialize(x: any) {
    const validated = safeSerialize(x);
    if (!validated.success) {
      throw new ValidationError(validated.message, validated.key);
    }
    return validated.value;
  }

  function assert(x: any): asserts x is Static<TConfig> {
    const validated = innerGuard(A, x, createGuardVisitedState());
    if (validated) {
      throw new ValidationError(validated.message, validated.key);
    }
  }
  function test(x: any): x is Static<TConfig> {
    const validated = innerGuard(A, x, createGuardVisitedState());
    return validated === undefined;
  }

  function Or<B extends RuntypeBase>(B: B): Union<[Codec<Static<TConfig>>, B]> {
    return Union(A, B);
  }

  function And<B extends RuntypeBase>(B: B): Intersect<[Codec<Static<TConfig>>, B]> {
    return Intersect(A, B);
  }

  function withConstraint<T extends Static<TConfig>, K = unknown>(
    constraint: ConstraintCheck<Codec<Static<TConfig>>>,
    options?: { name?: string; args?: K },
  ): Constraint<Codec<Static<TConfig>>, T, K> {
    return Constraint<Codec<Static<TConfig>>, T, K>(A, constraint, options);
  }

  function withGuard<T extends Static<TConfig>, K = unknown>(
    test: (x: Static<TConfig>) => x is T,
    options?: { name?: string; args?: K },
  ): Constraint<Codec<Static<TConfig>>, T, K> {
    return Constraint<Codec<Static<TConfig>>, T, K>(A, test, options);
  }

  function withBrand<B extends string>(B: B): Brand<B, Codec<Static<TConfig>>> {
    return Brand<B, Codec<Static<TConfig>>>(B, A);
  }

  function withParser<TParsed>(
    config: ParsedValueConfig<Codec<Static<TConfig>>, TParsed>,
  ): ParsedValue<Codec<Static<TConfig>>, TParsed> {
    return ParsedValue(A as any, config);
  }
}

export type Cycle<T> = {
  success: true;
  cycle: true;
  placeholder: Partial<T>;
  unwrap: () => Result<T>;
};

function attemptMixin<T>(placehoder: any, value: T): Result<T> {
  if (placehoder === value) {
    return { success: true, value };
  }
  if (Array.isArray(placehoder) && Array.isArray(value)) {
    placehoder.splice(0, placehoder.length, ...value);
    return { success: true, value: placehoder as any };
  }
  if (
    placehoder &&
    typeof placehoder === 'object' &&
    !Array.isArray(placehoder) &&
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    Object.assign(placehoder, value);
    return { success: true, value: placehoder };
  }
  return {
    success: false,
    message: `Cannot convert a value of type "${
      Array.isArray(placehoder) ? 'Array' : typeof placehoder
    }" into a value of type "${
      value === null ? 'null' : Array.isArray(value) ? 'Array' : typeof value
    }" when it contains cycles.`,
  };
}

export function createValidationPlaceholder<T>(
  placeholder: T,
  fn: (placehoder: T) => Result<T> | undefined,
): Cycle<T> {
  return innerMapValidationPlaceholder(
    placeholder,
    () => fn(placeholder) || { success: true, value: placeholder },
  );
}

export function mapValidationPlaceholder<T, S>(
  source: ResultWithCycle<T>,
  fn: (placehoder: T) => Result<S>,
  extraGuard?: RuntypeBase<S>,
): ResultWithCycle<S> {
  if (!source.success) return source;
  if (!source.cycle) {
    const result = fn(source.value);
    return (
      (result.success &&
        extraGuard &&
        innerGuard(extraGuard, result.value, createGuardVisitedState())) ||
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
  fn?: (placehoder: any) => Result<any>,
  extraGuard?: RuntypeBase<any>,
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
      cache = { success: true, value: placeholder };

      const sourceResult = populate();
      const result = sourceResult.success && fn ? fn(sourceResult.value) : sourceResult;
      if (!result.success) return result;
      if (hasCycle) {
        const unwrapResult = attemptMixin(placeholder, result.value);
        const guardFailure =
          unwrapResult.success &&
          extraGuard &&
          innerGuard(extraGuard, unwrapResult.value, createGuardVisitedState());
        cache = guardFailure || unwrapResult;
      } else {
        const guardFailure =
          extraGuard && innerGuard(extraGuard, result.value, createGuardVisitedState());
        cycle.placeholder = result.value;
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
type VisitedState = Map<RuntypeBase<unknown>, Map<any, Cycle<any>>>;

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
type GuardVisitedState = Map<RuntypeBase<unknown>, Set<any>>;

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
  targetType: RuntypeBase<T>,
  value: any,
  $visited: OpaqueVisitedState,
): Result<T> {
  const result = innerValidateToPlaceholder(targetType, value, $visited);
  if (result.cycle) {
    return result.unwrap();
  }
  return result;
}

function innerValidateToPlaceholder<T>(
  targetType: RuntypeBase<T>,
  value: any,
  $visited: OpaqueVisitedState,
): ResultWithCycle<T> {
  const visited = unwrapVisitedState($visited);
  const validator = targetType[internal];
  const cached = visited.get(targetType)?.get(value);
  if (cached !== undefined) {
    return cached;
  }
  const result = validator.validate(
    value,
    (t, v) => innerValidate(t, v, $visited),
    (t, v) => innerValidateToPlaceholder(t, v, $visited),
  );
  if (result.cycle) {
    visited.set(targetType, (visited.get(targetType) || new Map()).set(value, result));
    return result;
  }
  return result;
}

export function innerSerialize<T>(
  targetType: RuntypeBase<T>,
  value: any,
  $visited: OpaqueVisitedState,
): Result<T> {
  const result = innerSerializeToPlaceholder(targetType, value, $visited);
  if (result.cycle) {
    return result.unwrap();
  }
  return result;
}
function innerSerializeToPlaceholder(
  targetType: RuntypeBase,
  value: any,
  $visited: OpaqueVisitedState,
): ResultWithCycle<any> {
  const visited = unwrapVisitedState($visited);
  const validator = targetType[internal];
  const cached = visited.get(targetType)?.get(value);
  if (cached !== undefined) {
    return cached;
  }
  let result = (validator.serialize || validator.validate)(
    value,
    (t, v) => innerSerialize(t, v, $visited),
    (t, v) => innerSerializeToPlaceholder(t, v, $visited),
  );
  if (result.cycle) {
    visited.set(targetType, (visited.get(targetType) || new Map()).set(value, result));
    return result;
  }
  return result;
}

export function innerGuard(
  targetType: RuntypeBase,
  value: any,
  $visited: OpaqueGuardVisitedState,
): Failure | undefined {
  const visited = unwrapGuardVisitedState($visited);
  const validator = targetType[internal];
  if (value && (typeof value === 'object' || typeof value === 'function')) {
    const cached = visited.get(targetType)?.has(value);
    if (cached) return undefined;
    visited.set(targetType, (visited.get(targetType) || new Set()).add(value));
  }
  if (validator.test) {
    return validator.test(value, (t, v) => innerGuard(t, v, $visited));
  }
  let result = validator.validate(
    value,
    (t, v) => innerGuard(t, v, $visited) || { success: true, value: v as any },
    (t, v) => innerGuard(t, v, $visited) || { success: true, value: v as any },
  );
  if (result.cycle) result = result.unwrap();
  if (result.success) return undefined;
  else return result;
}
