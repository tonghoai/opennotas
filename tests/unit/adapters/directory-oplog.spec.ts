import { describe, expect, it } from 'vitest';
import {
  HEADER_SIZE,
  createOplogHeader,
  crc32,
  encodeOplogFrame,
  maxFrameSeq,
  parseOplog,
  parseOplogHeader,
} from '~/adapter/directory/oplog';

function join(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.byteLength;
  }
  return result;
}

const frame = (seq: number, table = 'notes', row = { id: `note-${seq}` }) => ({
  seq,
  table,
  op: 'upsert' as const,
  row,
});

describe('directory oplog', () => {
  it('round-trips a header', () => {
    const header = createOplogHeader(42, 7);
    expect(header.byteLength).toBe(HEADER_SIZE);
    expect(parseOplogHeader(header)).toEqual({ generation: 42, schemaVersion: 7 });
  });

  it('rejects a short, wrong-magic or corrupted header', () => {
    expect(parseOplogHeader(new Uint8Array(10))).toBeNull();

    const short = createOplogHeader(1, 2).slice(0, HEADER_SIZE - 1);
    expect(parseOplogHeader(short)).toBeNull();

    const wrongMagic = createOplogHeader(1, 2);
    wrongMagic[0] = 0;
    expect(parseOplogHeader(wrongMagic)).toBeNull();

    const wrongVersion = createOplogHeader(1, 2);
    new DataView(wrongVersion.buffer).setUint16(4, 99, true);
    expect(parseOplogHeader(wrongVersion)).toBeNull();

    const wrongCrc = createOplogHeader(1, 2);
    wrongCrc[30] ^= 0xff;
    expect(parseOplogHeader(wrongCrc)).toBeNull();
  });

  it('encodes and parses a sequence of frames', () => {
    const bytes = join(
      createOplogHeader(3, 1),
      encodeOplogFrame(frame(1)),
      encodeOplogFrame(frame(2, 'folders', { id: 'folder-2' })),
    );
    const parsed = parseOplog(bytes);

    expect(parsed.generation).toBe(3);
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.frames).toHaveLength(2);
    expect(parsed.frames[0]).toMatchObject({ seq: 1, table: 'notes', op: 'upsert' });
    expect(parsed.frames[1]).toMatchObject({ seq: 2, table: 'folders', row: { id: 'folder-2' } });
    expect(parsed.validLength).toBe(bytes.byteLength);
    expect(parsed.tailInvalid).toBe(false);
  });

  it('reports a truncated tail and stops at the last valid frame', () => {
    const first = encodeOplogFrame(frame(1));
    const second = encodeOplogFrame(frame(2));
    const bytes = join(createOplogHeader(1, 1), first, second.slice(0, second.byteLength - 2));
    const parsed = parseOplog(bytes);

    expect(parsed.frames).toHaveLength(1);
    expect(parsed.validLength).toBe(HEADER_SIZE + first.byteLength);
    expect(parsed.tailInvalid).toBe(true);
  });

  it('rejects a frame with a corrupted payload', () => {
    const encoded = encodeOplogFrame(frame(1));
    encoded[encoded.byteLength - 1] ^= 0xff;
    const parsed = parseOplog(join(createOplogHeader(1, 1), encoded));
    expect(parsed.frames).toHaveLength(0);
    expect(parsed.validLength).toBe(HEADER_SIZE);
    expect(parsed.tailInvalid).toBe(true);
  });

  it('rejects malformed JSON and oversized frames as invalid tails', () => {
    const malformed = new TextEncoder().encode('not-json');
    const badFrame = new Uint8Array(8 + malformed.byteLength);
    const view = new DataView(badFrame.buffer);
    view.setUint32(0, malformed.byteLength, true);
    view.setUint32(4, crc32(malformed), true);
    badFrame.set(malformed, 8);
    expect(parseOplog(join(createOplogHeader(1, 1), badFrame)).tailInvalid).toBe(true);

    const oversized = new Uint8Array(8);
    new DataView(oversized.buffer).setUint32(0, 16 * 1024 * 1024 + 1, true);
    const parsed = parseOplog(join(createOplogHeader(1, 1), oversized));
    expect(parsed.tailInvalid).toBe(true);
    expect(parsed.frames).toHaveLength(0);
  });

  it('computes max frame sequence and CRC32 consistently', () => {
    expect(maxFrameSeq([frame(2), frame(9), frame(4)])).toBe(9);
    expect(maxFrameSeq([], 12)).toBe(12);
    const bytes = new TextEncoder().encode('123456789');
    expect(crc32(bytes)).toBe(0xcbf43926);
  });
});
