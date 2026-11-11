// Append-only operation log used next to the SQLite snapshot.
//
// Format:
//   header: magic "ONJ1", version, generation, schemaVersion, timestamps, CRC32
//   frames: [payloadLength:u32][payloadCRC32:u32][UTF-8 JSON payload]
//
// The log is intentionally compact and self-describing. A partially written
// tail (crash during append) is discarded by parseOplog; the caller can then
// truncate to validLength before appending again.

const MAGIC = [0x4f, 0x4e, 0x4a, 0x31]; // ONJ1
const VERSION = 1;
const HEADER_SIZE = 64;
const MAX_FRAME_SIZE = 16 * 1024 * 1024;

type OplogFrame = {
  seq: number;
  table: string;
  op: 'upsert';
  row: Record<string, any>;
};

type ParsedOplog = {
  generation: number;
  schemaVersion: number;
  frames: OplogFrame[];
  validLength: number;
  tailInvalid: boolean;
};

let crcTable: Uint32Array | null = null;

function getCrcTable(): Uint32Array {
  if (crcTable) return crcTable;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  crcTable = table;
  return table;
}

function crc32(bytes: Uint8Array, start = 0, end = bytes.length): number {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = start; i < end; i++) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createOplogHeader(generation: number, schemaVersion: number): Uint8Array {
  const bytes = new Uint8Array(HEADER_SIZE);
  const view = new DataView(bytes.buffer);
  bytes.set(MAGIC, 0);
  view.setUint16(4, VERSION, true);
  view.setUint16(6, HEADER_SIZE, true);
  view.setBigUint64(8, BigInt(Math.max(0, Math.floor(generation))), true);
  view.setUint32(16, schemaVersion >>> 0, true);
  view.setBigUint64(20, BigInt(Date.now()), true);
  view.setUint32(28, 0, true);
  view.setUint32(60, crc32(bytes, 0, 60), true);
  return bytes;
}

function encodeOplogFrame(frame: OplogFrame): Uint8Array {
  const payload = new TextEncoder().encode(JSON.stringify({
    s: frame.seq,
    t: frame.table,
    op: frame.op,
    r: frame.row,
  }));
  const bytes = new Uint8Array(8 + payload.byteLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, payload.byteLength, true);
  view.setUint32(4, crc32(payload), true);
  bytes.set(payload, 8);
  return bytes;
}

function parseOplogHeader(bytes: Uint8Array): { generation: number; schemaVersion: number } | null {
  if (bytes.byteLength < HEADER_SIZE) return null;
  for (let i = 0; i < MAGIC.length; i++) {
    if (bytes[i] !== MAGIC[i]) return null;
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(4, true) !== VERSION) return null;
  if (view.getUint16(6, true) !== HEADER_SIZE) return null;
  if (view.getUint32(60, true) !== crc32(bytes, 0, 60)) return null;

  return {
    generation: Number(view.getBigUint64(8, true)),
    schemaVersion: view.getUint32(16, true),
  };
}

function parseOplog(bytes: Uint8Array): ParsedOplog {
  const header = parseOplogHeader(bytes);
  if (!header) {
    throw new Error('Invalid oplog header');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const frames: OplogFrame[] = [];
  let offset = HEADER_SIZE;
  let tailInvalid = false;

  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) {
      tailInvalid = true;
      break;
    }

    const payloadLength = view.getUint32(offset, true);
    const payloadCrc = view.getUint32(offset + 4, true);
    if (payloadLength > MAX_FRAME_SIZE) {
      tailInvalid = true;
      break;
    }

    const payloadStart = offset + 8;
    const payloadEnd = payloadStart + payloadLength;
    if (payloadEnd > bytes.byteLength) {
      tailInvalid = true;
      break;
    }

    const payload = bytes.subarray(payloadStart, payloadEnd);
    if (crc32(payload) !== payloadCrc) {
      tailInvalid = true;
      break;
    }

    try {
      const parsed = JSON.parse(new TextDecoder().decode(payload));
      if (typeof parsed?.s === 'number' && typeof parsed?.t === 'string' && parsed?.op === 'upsert') {
        frames.push({
          seq: parsed.s,
          table: parsed.t,
          op: 'upsert',
          row: parsed.r || {},
        });
      } else {
        tailInvalid = true;
        break;
      }
    } catch {
      tailInvalid = true;
      break;
    }

    offset = payloadEnd;
  }

  return {
    generation: header.generation,
    schemaVersion: header.schemaVersion,
    frames,
    validLength: offset,
    tailInvalid,
  };
}

function maxFrameSeq(frames: OplogFrame[], fallback = 0): number {
  return frames.reduce((max, frame) => Math.max(max, frame.seq), fallback);
}

export type { OplogFrame, ParsedOplog };

export {
  HEADER_SIZE,
  createOplogHeader,
  encodeOplogFrame,
  parseOplog,
  parseOplogHeader,
  maxFrameSeq,
  crc32,
};
