import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { deflateSync } from "node:zlib";

const sourcePath = resolve("reference/easter-eggs.eps");
const outputDirectory = resolve("public/images/easter-eggs");
const source = readFileSync(sourcePath, "latin1");

const pageWidth = 4800;
const pageHeight = 1500;
const placements = [
  { x: -1, y: -1 },
  { x: 929, y: -1 },
  { x: 1859, y: -1 },
  { x: 2789, y: -1 },
  { x: 3720, y: -1 },
  { x: 4650, y: -1 },
  { x: -1, y: 879 },
  { x: 1287, y: 879 },
  { x: 2575, y: 879 },
  { x: 3863, y: 879 },
];

function ascii85Decode(input) {
  const output = [];
  let group = [];

  for (const character of input.replace(/\s/g, "")) {
    if (character === "z") {
      if (group.length !== 0) throw new Error("Invalid ASCII85 z marker");
      output.push(0, 0, 0, 0);
      continue;
    }

    const value = character.charCodeAt(0) - 33;
    if (value < 0 || value > 84) {
      throw new Error(`Invalid ASCII85 character ${JSON.stringify(character)}`);
    }

    group.push(value);
    if (group.length === 5) {
      let accumulator = 0;
      for (const digit of group) accumulator = accumulator * 85 + digit;
      output.push(
        (accumulator >>> 24) & 255,
        (accumulator >>> 16) & 255,
        (accumulator >>> 8) & 255,
        accumulator & 255,
      );
      group = [];
    }
  }

  if (group.length === 1) throw new Error("Invalid trailing ASCII85 group");
  if (group.length > 1) {
    const originalLength = group.length;
    while (group.length < 5) group.push(84);
    let accumulator = 0;
    for (const digit of group) accumulator = accumulator * 85 + digit;
    const bytes = [
      (accumulator >>> 24) & 255,
      (accumulator >>> 16) & 255,
      (accumulator >>> 8) & 255,
      accumulator & 255,
    ];
    output.push(...bytes.slice(0, originalLength - 1));
  }

  return Uint8Array.from(output);
}

function runLengthDecode(input) {
  const output = [];
  for (let index = 0; index < input.length; ) {
    const length = input[index++];
    if (length === 128) break;
    if (length <= 127) {
      const count = length + 1;
      output.push(...input.subarray(index, index + count));
      index += count;
    } else {
      const count = 257 - length;
      const value = input[index++];
      for (let repeat = 0; repeat < count; repeat += 1) output.push(value);
    }
  }
  return Uint8Array.from(output);
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, checksum]);
}

function encodePng(width, height, rgba) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8;
  header[9] = 6;
  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const offset = y * (stride + 1);
    scanlines[offset] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(
      scanlines,
      offset + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function extractTiles() {
  const tiles = [];
  let searchFrom = 0;
  while (true) {
    const marker = source.indexOf("%%BeginBinary: 1", searchFrom);
    if (marker < 0) break;
    const metadata = source.slice(Math.max(0, marker - 900), marker);
    const dimensions = metadata.match(/\/W\s+(\d+)\s+[\s\S]*?\/H\s+(\d+)/);
    if (!dimensions) throw new Error(`Missing dimensions before offset ${marker}`);
    const dataStart = source.indexOf("img", marker) + 3;
    const dataEnd = source.indexOf("~>", dataStart);
    const encoded = source.slice(dataStart, dataEnd);
    const decoded = runLengthDecode(ascii85Decode(encoded));
    const width = Number(dimensions[1]);
    const height = Number(dimensions[2]);
    const expectedLength = width * height * 3;
    if (decoded.length !== expectedLength) {
      throw new Error(
        `Tile ${tiles.length + 1}: expected ${expectedLength} bytes, got ${decoded.length}`,
      );
    }
    tiles.push({ decoded, width, height });
    searchFrom = dataEnd + 2;
  }
  return tiles;
}

const tiles = extractTiles();
if (tiles.length !== placements.length) {
  throw new Error(`Expected ${placements.length} tiles, got ${tiles.length}`);
}

const page = new Uint8Array(pageWidth * pageHeight * 4);
page.fill(255);

tiles.forEach(({ decoded, width, height }, tileIndex) => {
  const { x: originX, y: originY } = placements[tileIndex];
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const x = originX + column;
      const y = originY + row;
      if (x < 0 || x >= pageWidth || y < 0 || y >= pageHeight) continue;
      const sourceRow = row * width * 3;
      const target = (y * pageWidth + x) * 4;
      page[target] = decoded[sourceRow + column];
      page[target + 1] = decoded[sourceRow + width + column];
      page[target + 2] = decoded[sourceRow + width * 2 + column];
      page[target + 3] = 255;
    }
  }
});

function colorSpread(rgba, offset) {
  const red = rgba[offset];
  const green = rgba[offset + 1];
  const blue = rgba[offset + 2];
  return Math.max(red, green, blue) - Math.min(red, green, blue);
}

function findTopRowIntervals() {
  const columnsWithColor = Array.from({ length: pageWidth }, () => false);
  for (let x = 0; x < pageWidth; x += 1) {
    for (let y = 0; y < 750; y += 1) {
      if (colorSpread(page, (y * pageWidth + x) * 4) > 3) {
        columnsWithColor[x] = true;
        break;
      }
    }
  }

  const intervals = [];
  let start = -1;
  for (let x = 0; x <= pageWidth; x += 1) {
    if (x < pageWidth && columnsWithColor[x]) {
      if (start < 0) start = x;
    } else if (start >= 0) {
      intervals.push({ left: start, right: x - 1 });
      start = -1;
    }
  }

  if (intervals.length !== 8) {
    throw new Error(`Expected 8 top-row eggs, found ${intervals.length}`);
  }
  return intervals;
}

function findEggBounds(interval) {
  let minX = interval.right;
  let minY = 750;
  let maxX = interval.left;
  let maxY = 0;

  for (let y = 0; y < 750; y += 1) {
    for (let x = interval.left; x <= interval.right; x += 1) {
      if (colorSpread(page, (y * pageWidth + x) * 4) <= 3) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (minX > maxX || minY > maxY) {
    throw new Error(`Could not find egg in interval ${interval.left}-${interval.right}`);
  }

  return { minX, minY, maxX, maxY };
}

function exportEgg(interval, index) {
  const bounds = findEggBounds(interval);
  const margin = 8;
  const left = Math.max(0, bounds.minX - margin);
  const top = Math.max(0, bounds.minY - margin);
  const right = Math.min(pageWidth - 1, bounds.maxX + margin);
  const bottom = Math.min(749, bounds.maxY + margin);
  const width = right - left + 1;
  const height = bottom - top + 1;
  const output = new Uint8Array(width * height * 4);

  for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
    let rowLeft = bounds.maxX;
    let rowRight = bounds.minX;
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      if (colorSpread(page, (y * pageWidth + x) * 4) <= 3) continue;
      rowLeft = Math.min(rowLeft, x);
      rowRight = Math.max(rowRight, x);
    }

    if (rowLeft > rowRight) continue;
    for (let x = rowLeft; x <= rowRight; x += 1) {
      const sourceOffset = (y * pageWidth + x) * 4;
      const targetOffset = ((y - top) * width + x - left) * 4;
      output[targetOffset] = page[sourceOffset];
      output[targetOffset + 1] = page[sourceOffset + 1];
      output[targetOffset + 2] = page[sourceOffset + 2];
      output[targetOffset + 3] = 255;
    }
  }

  const fileName = `egg-${String(index + 1).padStart(2, "0")}.png`;
  const outputPath = resolve(outputDirectory, fileName);
  writeFileSync(outputPath, encodePng(width, height, output));
  return { fileName, width, height };
}

mkdirSync(outputDirectory, { recursive: true });
const topRowIntervals = findTopRowIntervals();
const exportedEggs = topRowIntervals.map((interval, index) =>
  exportEgg(interval, index),
);
console.log(`Decoded ${tiles.length} EPS tiles from ${sourcePath}`);
for (const egg of exportedEggs) {
  console.log(`${egg.fileName}: ${egg.width}x${egg.height}`);
}
