import { success } from '../result';
import { Codec, create } from '../runtype';

/**
 * Validates anything, but provides no new type information about it.
 */
export const Unknown: Codec<unknown> = create<unknown>(value => success(value), { tag: 'unknown' });
