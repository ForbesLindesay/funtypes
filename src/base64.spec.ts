import { randomBytes } from 'crypto';

import { base64Decode, base64Encode } from './base64';

function testBuffers() {
  const buffers: Buffer[] = [];
  for (let i = 0; i < 32; i++) {
    for (let length = 0; length < 256; length++) {
      buffers.push(randomBytes(length));
    }
  }
  return buffers;
}
test(`base64`, () => {
  expect(base64Decode(Buffer.from(`hello world`).toString(`base64`))).toEqual(
    new Uint8Array([104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]),
  );
  for (const buffer of testBuffers()) {
    const b64 = buffer.toString(`base64`);
    const b64url = buffer.toString(`base64url`);
    try {
      expect(Buffer.from(base64Decode(b64)).toString(`base64`)).toBe(b64);
      expect(Buffer.from(base64Decode(b64url)).toString(`base64`)).toBe(b64);
      expect(base64Encode(buffer as Uint8Array)).toBe(b64);
      expect(
        base64Encode(buffer as Uint8Array, { alphabet: 'base64url', omitPadding: true }).replace(
          /=+$/,
          '',
        ),
      ).toBe(b64url);
    } catch (ex) {
      console.error(b64);
      throw ex;
    }
  }
});
