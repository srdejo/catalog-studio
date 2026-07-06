import { createHash } from 'node:crypto';

export function hashImageBuffer(buffer: Buffer): string {
  return createHash('sha1').update(buffer).digest('hex').slice(0, 12);
}
