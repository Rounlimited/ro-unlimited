import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { id: string } };

interface Warning {
  code: string;
  name: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const supabase = createAdminClient();

    // Fetch estimate + related data
    const { data: estimate } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', id)
      .single();

    if (!estimate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: lineItems } = await supabase
      .from('estimate_line_items')
      .select('*')
      .eq('estimate_id', id);

    const { data: payments } = await supabase
      .from('estimate_payment_schedules')
      .select('*')
      .eq('estimate_id', id);

    const items = lineItems || [];
    const milestones = payments || [];
    const phases = [...new Set(items.map((i: any) => (i.phase || '').toUpperCase()))];
    const total = estimate.total || 0;
    const docMode = estimate.document_mode || 'estimate';

    const warnings: Warning[] = [];

    // PI-001: Low commercial total
    if (estimate.division === 'commercial' && total > 0 && total < 5000) {
      warnings.push({
        code: 'PI-001',
        name: 'Low Commercial Total',
        severity: 'warning',
        message: `Total of $${total.toLocaleString()} seems low for a commercial project. Verify all trades are included.`,
      });
    }

    // PI-002: No payment schedule on large estimate
    if (total > 5000 && milestones.length === 0) {
      warnings.push({
        code: 'PI-002',
        name: 'No Payment Schedule',
        severity: 'info',
        message: 'Estimates over $5,000 typically include a payment schedule with milestones.',
      });
    }

    // PI-003: Missing scope
    if (!estimate.project_description || estimate.project_description === '<p></p>') {
      warnings.push({
        code: 'PI-003',
        name: 'Missing Scope',
        severity: 'warning',
        message: 'No scope of work has been provided. This is recommended for all estimates.',
      });
    }

    // PI-004: No exclusions
    if (!estimate.exclusions || estimate.exclusions.trim() === '') {
      warnings.push({
        code: 'PI-004',
        name: 'No Exclusions',
        severity: 'warning',
        message: 'No exclusions listed — this increases liability exposure. Specify what is NOT included.',
      });
    }

    // PI-005: Single item > 50% of total
    if (items.length > 1 && total > 0) {
      for (const item of items) {
        const itemTotal = (item.quantity || 0) * (item.unit_cost || 0) * (1 + (item.markup_percent || 0) / 100);
        if (itemTotal > total * 0.5) {
          warnings.push({
            code: 'PI-005',
            name: 'Large Single Item',
            severity: 'info',
            message: `"${item.description}" is ${Math.round(itemTotal / total * 100)}% of the total. Verify pricing.`,
          });
          break;
        }
      }
    }

    // PI-006: Demolition without cleanup
    if (phases.includes('DEMOLITION') && !phases.includes('CLEANUP')) {
      warnings.push({
        code: 'PI-006',
        name: 'Demolition Without Cleanup',
        severity: 'warning',
        message: 'Demolition is in scope but no cleanup category. Consider adding cleanup items.',
      });
    }

    // PI-007: Large estimate with no terms
    if (total > 10000 && (!estimate.disclaimer_ids || estimate.disclaimer_ids.length === 0)) {
      warnings.push({
        code: 'PI-007',
        name: 'No Terms Selected',
        severity: 'warning',
        message: 'Estimates over $10,000 should include terms and conditions for legal protection.',
      });
    }

    // PI-008: Contract without timeline
    if (docMode === 'contract' && !estimate.project_start_date) {
      warnings.push({
        code: 'PI-008',
        name: 'Contract Missing Timeline',
        severity: 'warning',
        message: 'Proposals/contracts should include a project start date and duration.',
      });
    }

    // PI-009: Payment milestones not 100%
    if (milestones.length > 0) {
      const totalPercent = milestones.reduce((s: number, m: any) => s + (m.percent || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.5) {
        warnings.push({
          code: 'PI-009',
          name: 'Payment Not 100%',
          severity: 'error',
          message: `Payment milestones total ${totalPercent.toFixed(1)}% — should be 100%.`,
        });
      }
    }

    // PI-010: Contract with no inclusions
    if (docMode === 'contract' && (!estimate.inclusions || estimate.inclusions.trim() === '')) {
      warnings.push({
        code: 'PI-010',
        name: 'No Inclusions',
        severity: 'info',
        message: 'Contracts should specify what is included in the scope of work.',
      });
    }

    return NextResponse.json(warnings);
  } catch (err) {
    console.error('[pricing-check] error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
