import { failure, success } from '../result';
import { create, Codec, showValue } from '../runtype';

function createPrimitive<
  TType extends 'boolean' | 'function' | 'number' | 'string' | 'symbol' | 'bigint',
  TValue,
>(type: TType): Codec<TValue> {
  return create<TValue>(
    value =>
      typeof value === type
        ? success<TValue>(value)
        : failure(
            `Expected ${type}, but was ${showValue(value)}${typeof value === 'string' ? ` (i.e. a string literal)` : ``}`,
          ),
    { tag: type },
  );
}

/**
 * Validates that a value is a boolean.
 */
export const Boolean: Codec<boolean> = createPrimitive('boolean');

/**
 * Validates that a value is a function.
 */
export const Function: Codec<(...args: any[]) => any> = createPrimitive('function');

/**
 * Validates that a value is a number.
 */
export const Number: Codec<number> = createPrimitive('number');

/**
 * Validates that a value is a string.
 */
export const String: Codec<string> = createPrimitive('string');

/**
 * Validates that a value is a symbol.
 */
const Sym: Codec<symbol> = createPrimitive('symbol');
export { Sym as Symbol };

/**
 * Validates that a value is a BigInt.
 */
export const BigInt: Codec<bigint> = createPrimitive('bigint');
