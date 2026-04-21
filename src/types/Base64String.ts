import { String } from './primitive';
import { Constraint } from './constraint';
import { Codec } from '../runtype';
import { expected } from '../result';

/**
 * A string that contains base64 encoded data.
 */
export function Base64String(): Codec<string> {
  return Constraint(
    String,
    value => {
      if (!/^[0-9a-zA-Z/+,_-]*=*$/.test(value)) {
        return expected(`a base64 encoded string`, value);
      }
      return true;
    },
    { name: `Base64String` },
  );
}
