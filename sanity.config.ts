import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity/schemaTypes';

/**
 * Minimal Sanity config for this repo (commercialRfp + future types).
 * If you already host Studio elsewhere with tradeApplication, etc., add
 * `commercialRfp` from ./sanity/schemaTypes/commercialRfp to that project’s
 * schema types and redeploy Studio — do not replace a full studio with this file alone.
 */
export default defineConfig({
  name: 'ro-unlimited',
  title: 'RO Unlimited',
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '3at2yyx0',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  plugins: [structureTool()],
  schema: {
    types: schemaTypes,
  },
});
