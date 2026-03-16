// Create estimation system tables via Supabase Management API
const PROJECT_ID = 'ocizuduhqsmewcmtilae';
const SUPABASE_ACCESS_TOKEN = 'sbp_5e04e0b1dfba656275bf457960603cacf3554386';

async function runSQL(sql, label) {
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text}`);
    }
    const data = await res.json();
    console.log(`[OK] ${label}`);
    return data;
  } catch (err) {
    console.error(`[FAIL] ${label}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log('=== Creating Estimation System Tables ===\n');

  // 1. vendors (no FK deps)
  await runSQL(`
    CREATE TABLE IF NOT EXISTS vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name TEXT,
      contact_name TEXT,
      trade TEXT,
      type TEXT CHECK (type IN ('supplier', 'subcontractor', 'rental')),
      phone TEXT,
      email TEXT,
      address TEXT,
      city TEXT,
      state TEXT DEFAULT 'SC',
      zip TEXT,
      notes TEXT,
      is_preferred BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `, 'Table: vendors');

  // 2. customers (no FK deps)
  await runSQL(`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company_name TEXT,
      first_name TEXT,
      last_name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT DEFAULT 'SC',
      zip TEXT,
      type TEXT CHECK (type IN ('residential', 'commercial', 'government')),
      source TEXT CHECK (source IN ('referral', 'website', 'drive-by', 'repeat')),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `, 'Table: customers');

  // 3. cost_items (FK: vendors)
  await runSQL(`
    CREATE TABLE IF NOT EXISTS cost_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      description TEXT,
      category TEXT CHECK (category IN ('material', 'labor', 'equipment', 'subcontractor')),
      trade TEXT,
      unit TEXT DEFAULT 'each',
      default_cost NUMERIC(12,2) DEFAULT 0,
      default_markup_percent NUMERIC(5,2) DEFAULT 0,
      vendor_id UUID REFERENCES vendors(id),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `, 'Table: cost_items');

  // 4. estimate_templates (no FK deps)
  await runSQL(`
    CREATE TABLE IF NOT EXISTS estimate_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT,
      description TEXT,
      division TEXT,
      estimate_type TEXT,
      contract_type TEXT,
      default_overhead_percent NUMERIC(5,2) DEFAULT 10,
      default_markup_percent NUMERIC(5,2) DEFAULT 25,
      default_tax_percent NUMERIC(5,2) DEFAULT 0,
      default_contingency_percent NUMERIC(5,2) DEFAULT 5,
      default_valid_days INTEGER DEFAULT 30,
      line_items JSONB DEFAULT '[]'::jsonb,
      payment_schedule JSONB DEFAULT '[]'::jsonb,
      disclaimers JSONB DEFAULT '[]'::jsonb,
      exclusions TEXT,
      is_active BOOLEAN DEFAULT true,
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `, 'Table: estimate_templates');

  // 5. estimates (FK: customers, estimate_templates, self-ref)
  await runSQL(`
    CREATE TABLE IF NOT EXISTS estimates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      estimate_number TEXT UNIQUE,
      customer_id UUID REFERENCES customers(id),
      project_name TEXT,
      project_address TEXT,
      project_city TEXT,
      project_state TEXT DEFAULT 'SC',
      project_zip TEXT,
      project_description TEXT,
      estimate_type TEXT CHECK (estimate_type IN ('quick_quote', 'preliminary', 'detailed', 'change_order', 'time_materials')),
      contract_type TEXT CHECK (contract_type IN ('fixed_price', 'cost_plus', 'time_materials', 'unit_price')),
      division TEXT,
      subtotal NUMERIC(12,2) DEFAULT 0,
      overhead_percent NUMERIC(5,2) DEFAULT 0,
      overhead_amount NUMERIC(12,2) DEFAULT 0,
      markup_percent NUMERIC(5,2) DEFAULT 0,
      markup_amount NUMERIC(12,2) DEFAULT 0,
      tax_percent NUMERIC(5,2) DEFAULT 0,
      tax_amount NUMERIC(12,2) DEFAULT 0,
      permit_fees NUMERIC(12,2) DEFAULT 0,
      contingency_percent NUMERIC(5,2) DEFAULT 0,
      contingency_amount NUMERIC(12,2) DEFAULT 0,
      total NUMERIC(12,2) DEFAULT 0,
      status TEXT DEFAULT 'draft',
      valid_until DATE,
      sent_at TIMESTAMPTZ,
      viewed_at TIMESTAMPTZ,
      accepted_at TIMESTAMPTZ,
      declined_at TIMESTAMPTZ,
      template_id UUID REFERENCES estimate_templates(id),
      parent_estimate_id UUID REFERENCES estimates(id),
      version INTEGER DEFAULT 1,
      pdf_url TEXT,
      client_signature TEXT,
      created_by UUID,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `, 'Table: estimates');

  // 6. estimate_line_items (FK: estimates, cost_items, vendors)
  await runSQL(`
    CREATE TABLE IF NOT EXISTS estimate_line_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
      phase TEXT,
      sort_order INTEGER DEFAULT 0,
      description TEXT,
      category TEXT CHECK (category IN ('material', 'labor', 'subcontractor', 'equipment', 'other')),
      quantity NUMERIC(10,2) DEFAULT 1,
      unit TEXT DEFAULT 'each',
      unit_cost NUMERIC(12,2) DEFAULT 0,
      markup_percent NUMERIC(5,2) DEFAULT 0,
      total NUMERIC(12,2) DEFAULT 0,
      cost_item_id UUID REFERENCES cost_items(id),
      vendor_id UUID REFERENCES vendors(id),
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `, 'Table: estimate_line_items');

  // 7. disclaimers
  await runSQL(`
    CREATE TABLE IF NOT EXISTS disclaimers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT,
      body TEXT,
      category TEXT CHECK (category IN ('general', 'payment', 'warranty', 'liability', 'sc_specific')),
      is_default BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `, 'Table: disclaimers');

  // 8. estimate_payment_schedules (FK: estimates)
  await runSQL(`
    CREATE TABLE IF NOT EXISTS estimate_payment_schedules (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
      milestone TEXT,
      percent NUMERIC(5,2),
      amount NUMERIC(12,2),
      due_description TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `, 'Table: estimate_payment_schedules');

  // 9. estimate_status_history (FK: estimates)
  await runSQL(`
    CREATE TABLE IF NOT EXISTS estimate_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
      old_status TEXT,
      new_status TEXT,
      changed_by UUID,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `, 'Table: estimate_status_history');

  // --- Trigger function for updated_at ---
  console.log('');
  await runSQL(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `, 'Trigger function: update_updated_at_column');

  // Add updated_at triggers
  const tablesWithUpdatedAt = [
    'vendors', 'customers', 'cost_items', 'estimate_templates',
    'estimates', 'estimate_line_items', 'disclaimers'
  ];
  for (const table of tablesWithUpdatedAt) {
    await runSQL(`
      DROP TRIGGER IF EXISTS set_updated_at ON ${table};
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON ${table}
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `, `Trigger: set_updated_at on ${table}`);
  }

  // --- Indexes ---
  console.log('');
  const indexes = [
    ['CREATE INDEX IF NOT EXISTS idx_estimates_customer_id ON estimates(customer_id);', 'Index: estimates.customer_id'],
    ['CREATE INDEX IF NOT EXISTS idx_estimates_status ON estimates(status);', 'Index: estimates.status'],
    ['CREATE INDEX IF NOT EXISTS idx_estimates_estimate_number ON estimates(estimate_number);', 'Index: estimates.estimate_number'],
    ['CREATE INDEX IF NOT EXISTS idx_estimate_line_items_estimate_id ON estimate_line_items(estimate_id);', 'Index: estimate_line_items.estimate_id'],
    ['CREATE INDEX IF NOT EXISTS idx_estimate_payment_schedules_estimate_id ON estimate_payment_schedules(estimate_id);', 'Index: estimate_payment_schedules.estimate_id'],
    ['CREATE INDEX IF NOT EXISTS idx_estimate_status_history_estimate_id ON estimate_status_history(estimate_id);', 'Index: estimate_status_history.estimate_id'],
    ['CREATE INDEX IF NOT EXISTS idx_cost_items_category ON cost_items(category);', 'Index: cost_items.category'],
    ['CREATE INDEX IF NOT EXISTS idx_cost_items_trade ON cost_items(trade);', 'Index: cost_items.trade'],
    ['CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);', 'Index: customers.type'],
    ['CREATE INDEX IF NOT EXISTS idx_vendors_trade ON vendors(trade);', 'Index: vendors.trade'],
  ];
  for (const [sql, label] of indexes) {
    await runSQL(sql, label);
  }

  // --- RLS ---
  console.log('');
  const allTables = [
    'vendors', 'customers', 'cost_items', 'estimate_templates',
    'estimates', 'estimate_line_items', 'disclaimers',
    'estimate_payment_schedules', 'estimate_status_history'
  ];
  for (const table of allTables) {
    await runSQL(`
      ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "${table}_all_access" ON ${table};
      CREATE POLICY "${table}_all_access" ON ${table}
        FOR ALL
        USING (true)
        WITH CHECK (true);
    `, `RLS + policy on ${table}`);
  }

  // --- Seed disclaimers ---
  console.log('\n--- Seeding Disclaimers ---');

  await runSQL(`
    INSERT INTO disclaimers (title, body, category, is_default, sort_order) VALUES
    ('Non-Binding Estimate', 'This estimate is provided for budgeting purposes and is not a binding contract. Actual costs may vary based on site conditions, material availability, design changes, and other factors discovered during construction.', 'general', true, 1),
    ('Estimate Validity Period', 'This estimate is valid for 30 days from the date of issue. After this period, pricing may be subject to change due to fluctuations in material costs and labor availability.', 'general', true, 2),
    ('Scope Limitation', 'This estimate covers only the work specifically described herein. Any additional work, changes, or unforeseen conditions will require a separate change order with associated costs.', 'general', true, 3),
    ('Material Price Fluctuation', 'Material prices are subject to change without notice. This estimate is based on current pricing as of the date issued. Significant material cost increases may necessitate a revised estimate.', 'general', true, 4),
    ('Concealed Conditions', 'This estimate does not account for concealed or unknown conditions including but not limited to: mold, asbestos, structural damage, faulty wiring, plumbing defects, or code violations discovered during construction. Additional costs for remediation will be addressed via change order.', 'general', false, 5),
    ('Permit & Inspection', 'Permit fees are estimated and may vary. The contractor is not responsible for delays caused by the permitting process or inspection requirements. Additional work required by inspectors to meet code will be billed as a change order.', 'general', false, 6),
    ('Payment Terms', 'A deposit is required to schedule work. Progress payments are due upon completion of each milestone as outlined in the payment schedule. Final payment is due upon substantial completion. Late payments are subject to a 1.5% monthly finance charge.', 'payment', true, 7),
    ('Cancellation Policy', 'Cancellation after acceptance is subject to a cancellation fee to cover planning, material ordering, and scheduling costs already incurred.', 'payment', false, 8),
    ('Warranty', 'Workmanship is warranted for one (1) year from the date of substantial completion. Manufacturer warranties apply to all materials and equipment. This warranty does not cover damage caused by the owner, natural disasters, or normal wear and tear.', 'warranty', false, 9),
    ('Liability Limitation', 'The contractor''s total liability under this agreement shall not exceed the total contract price. The contractor shall not be liable for consequential, incidental, or indirect damages.', 'liability', false, 10),
    ('Insurance Disclosure', 'Contractor maintains general liability insurance and workers'' compensation coverage as required by the State of South Carolina. Certificates of insurance are available upon request.', 'liability', false, 11),
    ('License Disclosure', 'Licensed and insured contractor in the State of South Carolina.', 'sc_specific', false, 12),
    ('Lien Rights Notice', 'Under South Carolina law, those who work on your property or provide materials and are not paid in full have a right to enforce their claim for payment against your property. This claim is known as a mechanic''s lien.', 'sc_specific', false, 13),
    ('Right of Rescission', 'You may cancel this contract within three (3) business days of signing if the contract was signed at your residence or at a location other than the contractor''s place of business.', 'sc_specific', false, 14);
  `, 'Seed: 14 disclaimers');

  // Verify disclaimers count
  const verifyResult = await runSQL('SELECT count(*) as cnt FROM disclaimers;', 'Verify: disclaimers count');
  if (verifyResult) {
    console.log('  Result:', JSON.stringify(verifyResult));
  }

  // Verify all tables exist
  console.log('');
  const tableCheck = await runSQL(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('vendors','customers','cost_items','estimate_templates','estimates','estimate_line_items','disclaimers','estimate_payment_schedules','estimate_status_history')
    ORDER BY table_name;
  `, 'Verify: all estimation tables exist');
  if (tableCheck) {
    console.log('  Tables found:', JSON.stringify(tableCheck));
  }

  console.log('\n=== Done! ===');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
