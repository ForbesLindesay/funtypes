import { Codec } from '../runtype';
import { Constraint } from './constraint';
import { Unknown } from './unknown';

export const Guard = <T>(test: (x: unknown) => x is T, options?: { name?: string }): Codec<T> =>
  Constraint(Unknown, test, options);
