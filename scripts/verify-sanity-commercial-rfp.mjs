/**
 * One-off: load .env.local and try create+delete a commercialRfp doc.
 * Run: node scripts/verify-sanity-commercial-rfp.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@sanity/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Missing .env.local');
  process.exit(1);
}
const env = {};
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  env[k] = v;
}

const token = env.SANITY_API_WRITE_TOKEN;
if (!token) {
  console.error('SANITY_API_WRITE_TOKEN not set in .env.local');
  process.exit(1);
}

const client = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID || '3at2yyx0',
  dataset: env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01',
  token,
  useCdn: false,
});

const testDoc = {
  _type: 'commercialRfp',
  organizationName: 'VERIFY DELETE ME',
  contactName: 'Script',
  email: 'verify@example.invalid',
  phone: '000',
  projectType: 'office',
  scope: 'new_construction',
  squareFootage: '',
  locationCityState: '',
  desiredStartDate: '',
  budgetRange: '',
  description: 'Automated test document — safe to delete.',
  referralSource: '',
  status: 'new',
  notes: '',
  submittedAt: new Date().toISOString(),
  submittedFromHost: 'local-verify-script',
};

try {
  const created = await client.create(testDoc);
  console.log('OK: created commercialRfp', created._id);
  await client.delete(created._id);
  console.log('OK: deleted test doc. Sanity accepts this document type.');
} catch (e) {
  console.error('FAILED:', e.message || e);
  console.error(
    '\nIf you see "document type not allowed" or similar, open sanity.io/manage → your project → ' +
      'add the schema from repo file sanity/schemaTypes/commercialRfp.ts to your Studio, or run Studio from this repo.'
  );
  process.exit(1);
}
