import { expected } from '../result';
import { Codec, create } from '../runtype';

/**
 * Validates nothing (unknown fails).
 */
export const Never: Codec<never> = create<never>(
  { _parse: value => expected('nothing', value), _fields: () => new Set() },
  { tag: 'never' },
);
