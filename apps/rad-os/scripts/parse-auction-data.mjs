/**
 * Parse auction XLS → geocoded JSON for Land Finder app
 *
 * Usage:
 *   node scripts/parse-auction-data.mjs <path-to-xls>
 *   node scripts/parse-auction-data.mjs  # defaults to Downloads path
 *
 * Geocodes via Nominatim (free, no API key). Rate-limited to 1 req/sec.
 * Outputs to lib/mockData/auction-properties.json
 */

import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

const DEFAULT_XLS = resolve(
  process.env.HOME,
  'Downloads/03_16 - 3_18_2026 Auction List.xls'
);

const xlsPath = process.argv[2] || DEFAULT_XLS;
const outPath = resolve(PROJECT_ROOT, 'lib/mockData/auction-properties.json');

// ── Helpers ──────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildExternalLinks(address, city, zip) {
  const fullAddr = `${address}, ${city}, CA ${zip}`;
  const encoded = encodeURIComponent(fullAddr);
  return {
    zillow: `https://www.zillow.com/homes/${encoded}_rb/`,
    redfin: `https://www.redfin.com/search?q=${encoded}`,
    googleMaps: `https://www.google.com/maps/search/${encoded}`,
  };
}

function computeDealScore(openingBid, totalAssessedValue) {
  if (!totalAssessedValue || totalAssessedValue <= 0) return null;
  return Math.round((openingBid / totalAssessedValue) * 100) / 100;
}

function parseStatus(canceled) {
  if (!canceled || canceled.trim() === '') return 'active';
  const c = canceled.trim().toUpperCase();
  if (c === 'WITHDRAWN') return 'withdrawn';
  if (c === 'REDEEMED') return 'redeemed';
  return 'active';
}

function parseAuctionType(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('unimproved')) return 'unimproved';
  if (t.includes('improved')) return 'improved';
  if (t.includes('timeshare')) return 'timeshare';
  return 'unknown';
}

async function geocode(address, city, zip) {
  const q = `${address}, ${city}, CA ${zip}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=us`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RadLandFinder/1.0 (dev tool)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
  } catch {
    // silent fail
  }
  return null;
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log(`Reading: ${xlsPath}`);
  const buf = await readFile(xlsPath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.log(`Total rows: ${rows.length}`);

  // Filter to land + improved only (skip timeshares)
  const filtered = rows.filter((r) => {
    const type = parseAuctionType(r['Auction Type']);
    return type === 'improved' || type === 'unimproved';
  });

  console.log(`After filtering (land + improved): ${filtered.length}`);

  const properties = [];

  for (let i = 0; i < filtered.length; i++) {
    const r = filtered[i];
    const id = String(r['ID#']).padStart(4, '0');
    const address = String(r['Street Address'] || '').trim();
    const city = String(r['City'] || '').trim();
    const zip = String(r['Postal Code'] || '').trim();
    const auctionType = parseAuctionType(r['Auction Type']);
    const landValue = Number(r['Land Value']) || 0;
    const improvements = Number(r['Improvements']) || 0;
    const totalAssessedValue = Number(r['Total Assessed Value']) || 0;
    const openingBid = Number(r['Opening Bid']) || 0;
    const status = parseStatus(r['Canceled']);
    const description = String(r['Property Description'] || '').trim();
    const apn = String(r['APN'] || '').trim();

    // Geocode (1 req/sec rate limit)
    process.stdout.write(
      `  [${i + 1}/${filtered.length}] Geocoding ${city}... `
    );
    const coordinates = await geocode(address, city, zip);
    console.log(coordinates ? `${coordinates.lat}, ${coordinates.lng}` : 'MISS');

    if (i < filtered.length - 1) await sleep(1100);

    properties.push({
      id,
      apn,
      address,
      city,
      zip,
      auctionType,
      landValue,
      improvements,
      totalAssessedValue,
      openingBid,
      status,
      description,
      coordinates,
      dealScore: computeDealScore(openingBid, totalAssessedValue),
      externalLinks: buildExternalLinks(address, city, zip),
    });
  }

  const geocoded = properties.filter((p) => p.coordinates).length;
  console.log(
    `\nGeocoded: ${geocoded}/${properties.length} (${Math.round((geocoded / properties.length) * 100)}%)`
  );

  await writeFile(outPath, JSON.stringify(properties, null, 2));
  console.log(`Written to: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
