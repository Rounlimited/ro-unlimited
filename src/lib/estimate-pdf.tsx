import { Document, Page, Text, View, StyleSheet, renderToBuffer, Font } from '@react-pdf/renderer';
import React from 'react';

/* ─── Helpers ────────────────────────────────────────────────── */

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

function fmt(n: number): string {
  return (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function fmtDate(d: string | undefined): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Styles ─────────────────────────────────────────────────── */

const c = {
  dark: '#1f2937',
  text: '#111827',
  textMed: '#374151',
  textLight: '#4b5563',
  label: '#6b7280',
  labelLight: '#9ca3af',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  bgAlt: '#fafafa',
  bgHeader: '#f3f4f6',
  white: '#ffffff',
};

const s = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 11,
    color: c.text,
    paddingTop: 43,    // ~0.6in
    paddingBottom: 43,
    paddingHorizontal: 50, // ~0.7in
  },

  /* Header */
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 18, borderBottomWidth: 3, borderBottomColor: c.dark, marginBottom: 18 },
  companyName: { fontSize: 22, fontFamily: 'Times-Bold', color: c.text, letterSpacing: -0.4 },
  companyTagline: { fontSize: 14, fontFamily: 'Times-Bold', color: c.textMed, marginTop: 2 },
  companyInfo: { marginTop: 10, fontSize: 10, color: c.label, lineHeight: 1.6 },
  estLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.2, color: c.labelLight, fontFamily: 'Times-Bold', marginBottom: 3 },
  estNumber: { fontSize: 26, fontFamily: 'Times-Bold', color: c.text, letterSpacing: -0.4 },
  estMeta: { marginTop: 8, fontSize: 10, color: c.label, lineHeight: 1.8 },
  estMetaLabel: { color: c.labelLight },

  /* Section labels */
  sectionLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: c.labelLight, fontFamily: 'Times-Bold', marginBottom: 6 },

  /* Client box */
  clientBox: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: c.border, borderRadius: 3, padding: '8 14', marginBottom: 18 },
  clientName: { fontSize: 13, fontFamily: 'Times-Bold', color: c.text },
  clientCompany: { fontSize: 11, color: c.textLight, marginTop: 2 },
  clientDetail: { fontSize: 10, color: c.label, lineHeight: 1.6, marginTop: 5 },

  /* Project details table */
  detailTable: { borderWidth: 1, borderColor: c.border, borderRadius: 3, marginBottom: 18 },
  detailRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.borderLight },
  detailRowLast: { flexDirection: 'row' },
  detailLabel: { width: 120, padding: '5 14', fontSize: 11, color: c.labelLight, fontFamily: 'Times-Roman' },
  detailValue: { flex: 1, padding: '5 14', fontSize: 11, color: c.text, fontFamily: 'Times-Bold' },
  detailValueNormal: { flex: 1, padding: '5 14', fontSize: 11, color: c.textMed },

  /* Scope */
  scopeBlock: { marginTop: 12, marginBottom: 18 },
  scopeText: { fontSize: 11, color: c.textMed, lineHeight: 1.7 },

  /* Phase header */
  phaseHeader: { backgroundColor: c.dark, padding: '5 10', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  phaseHeaderText: { fontSize: 10, fontFamily: 'Times-Bold', color: c.white, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Line items table header */
  tableHeader: { flexDirection: 'row', backgroundColor: c.bgHeader },
  tableHeaderCell: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.5, color: c.label, fontFamily: 'Times-Bold', padding: '5 8' },

  /* Line items table row */
  tableRow: { flexDirection: 'row' },
  tableRowAlt: { flexDirection: 'row', backgroundColor: c.bgAlt },
  tableCell: { fontSize: 10, color: c.textLight, padding: '4 8', borderBottomWidth: 1, borderBottomColor: c.borderLight },
  tableCellBold: { fontSize: 10, color: c.text, fontFamily: 'Times-Bold', padding: '4 8', borderBottomWidth: 1, borderBottomColor: c.borderLight },

  /* Phase subtotal */
  phaseFooter: { flexDirection: 'row', backgroundColor: c.bgHeader, borderTopWidth: 2, borderTopColor: '#d1d5db' },
  phaseFooterLabel: { flex: 1, padding: '5 8', fontSize: 9, color: c.label, fontFamily: 'Times-Bold', textTransform: 'uppercase', textAlign: 'right' },
  phaseFooterValue: { width: 85, padding: '5 8', fontSize: 11, color: c.text, fontFamily: 'Times-Bold', textAlign: 'right' },

  /* Financial summary */
  summaryWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 18 },
  summaryBox: { width: 260, borderWidth: 2, borderColor: c.dark, borderRadius: 3, overflow: 'hidden' },
  summaryHeader: { backgroundColor: c.dark, padding: '5 14', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Times-Bold', color: c.white },
  summaryBody: { padding: '6 14' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  summaryLabel: { fontSize: 11, color: c.label },
  summaryValue: { fontSize: 11, color: c.text, fontFamily: 'Times-Roman' },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 2, borderTopColor: c.dark, marginTop: 5, paddingTop: 6 },
  summaryTotalLabel: { fontSize: 12, fontFamily: 'Times-Bold', color: c.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryTotalValue: { fontSize: 20, fontFamily: 'Times-Bold', color: c.text },

  /* Payment schedule */
  paymentTable: { borderWidth: 1, borderColor: c.border, marginBottom: 18 },
  paymentNote: { fontSize: 9, color: c.labelLight, fontStyle: 'italic', marginTop: 4 },

  /* Disclaimers */
  disclaimerBlock: { marginBottom: 8 },
  disclaimerTitle: { fontSize: 10, fontFamily: 'Times-Bold', color: c.dark, marginBottom: 2 },
  disclaimerBody: { fontSize: 9, color: c.textLight, lineHeight: 1.5, paddingLeft: 10 },

  /* Exclusions */
  exclusionItem: { flexDirection: 'row', marginBottom: 2 },
  exclusionBullet: { fontSize: 10, color: c.textLight, width: 12 },
  exclusionText: { fontSize: 10, color: c.textLight, flex: 1 },

  /* Acceptance block */
  acceptBox: { borderWidth: 2, borderColor: c.dark, borderRadius: 3, padding: 20, marginBottom: 18 },
  acceptIntro: { fontSize: 10, color: c.textLight, lineHeight: 1.6, marginBottom: 16 },
  sigRow: { flexDirection: 'row', gap: 30 },
  sigCol: { flex: 1 },
  sigColLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 0.8, color: c.labelLight, fontFamily: 'Times-Bold', marginBottom: 6 },
  sigLine: { borderBottomWidth: 2, borderBottomColor: c.dark, minHeight: 30, marginBottom: 3 },
  sigLineLight: { borderBottomWidth: 1, borderBottomColor: '#d1d5db', minHeight: 16, marginTop: 10, marginBottom: 3 },
  sigLabel: { fontSize: 8, color: c.labelLight },

  /* Footer */
  footer: { borderTopWidth: 3, borderTopColor: c.dark, paddingTop: 10, marginTop: 18, textAlign: 'center' },
  footerLine: { fontSize: 9, color: c.label, fontFamily: 'Times-Bold' },
  footerSub: { fontSize: 9, color: c.labelLight, marginTop: 2 },
  footerContact: { fontSize: 8, color: '#d1d5db', marginTop: 5 },

  /* Spacing */
  mb18: { marginBottom: 18 },
  mb24: { marginBottom: 24 },
  mb8: { marginBottom: 8 },
});

/* ─── Column widths for line items ───────────────────────────── */
const colW = { num: 28, desc: 'auto' as const, qty: 40, unit: 45, price: 72, total: 80 };
// We use flex for description column

/* ─── PDF Document Component ─────────────────────────────────── */

interface PDFProps {
  estimate: any;
  lineItems: any[];
  paymentSchedule: any[];
  disclaimers: any[];
}

function EstimatePDFDocument({ estimate, lineItems, paymentSchedule, disclaimers }: PDFProps) {
  const customer = estimate.customer;
  const scopeText = estimate.scope_of_work || estimate.project_description || '';
  const projectAddr = [estimate.project_address, estimate.project_city, estimate.project_state, estimate.project_zip].filter(Boolean).join(', ');

  // Group line items by phase
  const grouped: Record<string, any[]> = {};
  (lineItems || []).forEach((item: any) => {
    const p = item.phase || 'Other';
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(item);
  });

  // Calculate totals
  const subtotal = (lineItems || []).reduce(
    (sum: number, item: any) => sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100), 0
  );
  const overheadAmt = (subtotal * (estimate.overhead_percent || 0)) / 100;
  const markupAmt = (subtotal * (estimate.markup_percent || 0)) / 100;
  const taxable = subtotal + overheadAmt + markupAmt;
  const taxAmt = (taxable * (estimate.tax_percent || 0)) / 100;
  const contingencyAmt = (subtotal * (estimate.contingency_percent || 0)) / 100;
  const grandTotal = subtotal + overheadAmt + markupAmt + taxAmt + (estimate.permit_fees || 0) + contingencyAmt;

  // Exclusions
  const exclusionsList = (estimate.exclusions || '').split('\n').map((x: string) => x.trim()).filter(Boolean);

  // Valid days
  const validDays = estimate.valid_until
    ? Math.max(0, Math.ceil((new Date(estimate.valid_until).getTime() - new Date(estimate.created_at).getTime()) / 86400000))
    : 30;

  // Phase subtotals
  const phaseSubtotals: Record<string, number> = {};
  Object.entries(grouped).forEach(([phase, items]) => {
    phaseSubtotals[phase] = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100), 0);
  });

  // Payment milestones with computed amounts
  const milestones = (paymentSchedule || []).map((m: any) => ({
    ...m,
    computedAmount: (grandTotal * (m.percent || 0)) / 100,
  }));

  let itemCounter = 0;

  return (
    <Document>
      <Page size="LETTER" style={s.page} wrap>

        {/* ═══ 1. HEADER ═══ */}
        <View style={s.headerRow} fixed>
          <View style={{ flex: 1 }}>
            <Text style={s.companyName}>RO Unlimited</Text>
            <Text style={s.companyTagline}>Construction & Development</Text>
            <View style={s.companyInfo}>
              <Text>Greenville, SC</Text>
              <Text>(864) 304-0139</Text>
              <Text>rounlimited.com</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.estLabel}>Estimate</Text>
            <Text style={s.estNumber}>{estimate.estimate_number}</Text>
            <View style={s.estMeta}>
              <Text><Text style={s.estMetaLabel}>Date: </Text>{fmtDate(estimate.created_at)}</Text>
              {estimate.valid_until && (
                <Text><Text style={s.estMetaLabel}>Valid Until: </Text>{fmtDate(estimate.valid_until)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* ═══ 2. CLIENT INFO ═══ */}
        {customer && (
          <View style={s.mb18}>
            <Text style={s.sectionLabel}>Prepared For</Text>
            <View style={s.clientBox}>
              <Text style={s.clientName}>{customer.first_name} {customer.last_name}</Text>
              {customer.company_name && <Text style={s.clientCompany}>{customer.company_name}</Text>}
              <View style={s.clientDetail}>
                {(customer.address || customer.city) && (
                  <Text>{[customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</Text>
                )}
                {customer.phone && <Text>{customer.phone}</Text>}
                {customer.email && <Text>{customer.email}</Text>}
              </View>
            </View>
          </View>
        )}

        {/* ═══ 3. PROJECT DETAILS ═══ */}
        <View style={s.mb18}>
          <Text style={s.sectionLabel}>Project Details</Text>
          <View style={s.detailTable}>
            {estimate.project_name && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Project</Text>
                <Text style={s.detailValue}>{estimate.project_name}</Text>
              </View>
            )}
            {projectAddr && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Address</Text>
                <Text style={s.detailValueNormal}>{projectAddr}</Text>
              </View>
            )}
            {estimate.division && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Division</Text>
                <Text style={s.detailValueNormal}>{humanize(estimate.division)}</Text>
              </View>
            )}
            {estimate.estimate_type && (
              <View style={s.detailRow}>
                <Text style={s.detailLabel}>Type</Text>
                <Text style={s.detailValueNormal}>{humanize(estimate.estimate_type)}</Text>
              </View>
            )}
            {estimate.contract_type && (
              <View style={s.detailRowLast}>
                <Text style={s.detailLabel}>Contract</Text>
                <Text style={s.detailValueNormal}>{humanize(estimate.contract_type)}</Text>
              </View>
            )}
          </View>

          {/* Scope of Work */}
          {scopeText && scopeText !== '<p></p>' && (
            <View style={s.scopeBlock}>
              <Text style={s.sectionLabel}>Scope of Work</Text>
              <Text style={s.scopeText}>{stripHtml(scopeText)}</Text>
            </View>
          )}
        </View>

        {/* ═══ 4. LINE ITEMS ═══ */}
        {Object.keys(grouped).length > 0 && (
          <View style={s.mb18}>
            <Text style={s.sectionLabel}>Itemized Cost Breakdown</Text>
            {Object.entries(grouped).map(([phase, items]) => (
              <View key={phase} style={s.mb8} wrap={false}>
                {/* Phase header */}
                <View style={s.phaseHeader}>
                  <Text style={s.phaseHeaderText}>{phase}</Text>
                </View>
                {/* Column headers */}
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { width: colW.num }]}>#</Text>
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>Description</Text>
                  <Text style={[s.tableHeaderCell, { width: colW.qty, textAlign: 'right' }]}>Qty</Text>
                  <Text style={[s.tableHeaderCell, { width: colW.unit }]}>Unit</Text>
                  <Text style={[s.tableHeaderCell, { width: colW.price, textAlign: 'right' }]}>Unit Price</Text>
                  <Text style={[s.tableHeaderCell, { width: colW.total, textAlign: 'right' }]}>Total</Text>
                </View>
                {/* Rows */}
                {items.map((item: any, idx: number) => {
                  itemCounter++;
                  const lineTotal = item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100);
                  const rowStyle = itemCounter % 2 === 0 ? s.tableRowAlt : s.tableRow;
                  return (
                    <View key={item.id || idx} style={rowStyle}>
                      <Text style={[s.tableCell, { width: colW.num, color: c.labelLight }]}>{itemCounter}</Text>
                      <Text style={[s.tableCellBold, { flex: 1 }]}>{item.description || '--'}</Text>
                      <Text style={[s.tableCell, { width: colW.qty, textAlign: 'right' }]}>{item.quantity}</Text>
                      <Text style={[s.tableCell, { width: colW.unit, color: c.label }]}>{item.unit}</Text>
                      <Text style={[s.tableCell, { width: colW.price, textAlign: 'right' }]}>{fmt(item.unit_cost * (1 + (item.markup_percent || 0) / 100))}</Text>
                      <Text style={[s.tableCellBold, { width: colW.total, textAlign: 'right' }]}>{fmt(lineTotal)}</Text>
                    </View>
                  );
                })}
                {/* Phase subtotal */}
                <View style={s.phaseFooter}>
                  <Text style={s.phaseFooterLabel}>{phase} Subtotal</Text>
                  <Text style={s.phaseFooterValue}>{fmt(phaseSubtotals[phase])}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ═══ 5. FINANCIAL SUMMARY ═══ */}
        <View style={s.summaryWrap} wrap={false}>
          <View style={s.summaryBox}>
            <Text style={s.summaryHeader}>Financial Summary</Text>
            <View style={s.summaryBody}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Subtotal</Text>
                <Text style={s.summaryValue}>{fmt(subtotal)}</Text>
              </View>
              {(estimate.overhead_percent || 0) > 0 && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Overhead ({estimate.overhead_percent}%)</Text>
                  <Text style={s.summaryValue}>{fmt(overheadAmt)}</Text>
                </View>
              )}
              {(estimate.markup_percent || 0) > 0 && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Markup ({estimate.markup_percent}%)</Text>
                  <Text style={s.summaryValue}>{fmt(markupAmt)}</Text>
                </View>
              )}
              {(estimate.tax_percent || 0) > 0 && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Tax ({estimate.tax_percent}%)</Text>
                  <Text style={s.summaryValue}>{fmt(taxAmt)}</Text>
                </View>
              )}
              {(estimate.permit_fees || 0) > 0 && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Permit Fees</Text>
                  <Text style={s.summaryValue}>{fmt(estimate.permit_fees)}</Text>
                </View>
              )}
              {(estimate.contingency_percent || 0) > 0 && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Contingency ({estimate.contingency_percent}%)</Text>
                  <Text style={s.summaryValue}>{fmt(contingencyAmt)}</Text>
                </View>
              )}
              <View style={s.summaryTotalRow}>
                <Text style={s.summaryTotalLabel}>Total</Text>
                <Text style={s.summaryTotalValue}>{fmt(grandTotal)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ 6. PAYMENT SCHEDULE ═══ */}
        {milestones.length > 0 && (
          <View style={s.mb18} wrap={false}>
            <Text style={s.sectionLabel}>Payment Schedule</Text>
            <View style={s.paymentTable}>
              {/* Header */}
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>Milestone</Text>
                <Text style={[s.tableHeaderCell, { width: 50, textAlign: 'center' }]}>%</Text>
                <Text style={[s.tableHeaderCell, { width: 95, textAlign: 'right' }]}>Amount</Text>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>When Due</Text>
              </View>
              {milestones.map((m: any, i: number) => (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCellBold, { flex: 1 }]}>{m.milestone || `Milestone ${i + 1}`}</Text>
                  <Text style={[s.tableCell, { width: 50, textAlign: 'center' }]}>{m.percent}%</Text>
                  <Text style={[s.tableCellBold, { width: 95, textAlign: 'right' }]}>{fmt(m.computedAmount)}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{m.due_description || m.description || '--'}</Text>
                </View>
              ))}
            </View>
            <Text style={s.paymentNote}>
              A deposit may be required before work commences. Payment terms are net 15 days from invoice date unless otherwise specified.
            </Text>
          </View>
        )}

        {/* ═══ 7. TERMS & CONDITIONS ═══ */}
        {disclaimers.length > 0 && (
          <View style={s.mb18}>
            <Text style={s.sectionLabel}>Terms & Conditions</Text>
            {disclaimers.map((d: any, i: number) => (
              <View key={d.id || i} style={s.disclaimerBlock}>
                <Text style={s.disclaimerTitle}>{i + 1}. {d.title}</Text>
                <Text style={s.disclaimerBody}>{d.body}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ═══ 8. EXCLUSIONS ═══ */}
        {exclusionsList.length > 0 && (
          <View style={s.mb18}>
            <Text style={s.sectionLabel}>Exclusions</Text>
            <Text style={{ fontSize: 9, color: c.label, fontStyle: 'italic', marginBottom: 4 }}>
              The following items are NOT included in this estimate:
            </Text>
            {exclusionsList.map((item: string, i: number) => (
              <View key={i} style={s.exclusionItem}>
                <Text style={s.exclusionBullet}>{'\u2022'}</Text>
                <Text style={s.exclusionText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ═══ 9. ACCEPTANCE BLOCK ═══ */}
        <View style={s.acceptBox} wrap={false}>
          <Text style={s.sectionLabel}>Acceptance & Authorization</Text>
          <Text style={s.acceptIntro}>
            By signing below, you accept this estimate and authorize RO Unlimited Construction & Development to begin work as described above.
          </Text>
          <View style={s.sigRow}>
            {/* Client side */}
            <View style={s.sigCol}>
              <Text style={s.sigColLabel}>Client</Text>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Signature</Text>
              <View style={s.sigLineLight}>
                {customer && (
                  <Text style={{ fontSize: 10, color: c.textMed }}>{customer.first_name} {customer.last_name}</Text>
                )}
              </View>
              <Text style={s.sigLabel}>Printed Name</Text>
              <View style={s.sigLineLight} />
              <Text style={s.sigLabel}>Date</Text>
            </View>
            {/* Contractor side */}
            <View style={s.sigCol}>
              <Text style={s.sigColLabel}>Contractor</Text>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Signature</Text>
              <View style={s.sigLineLight} />
              <Text style={s.sigLabel}>Printed Name</Text>
              <View style={s.sigLineLight} />
              <Text style={s.sigLabel}>Date</Text>
            </View>
          </View>
        </View>

        {/* ═══ 10. FOOTER ═══ */}
        <View style={s.footer} fixed>
          <Text style={s.footerLine}>Licensed and Insured | RO Unlimited Construction & Development</Text>
          <Text style={s.footerSub}>This estimate is valid for {validDays} days from date of issue.</Text>
          <Text style={s.footerContact}>(864) 304-0139 | rounlimited.com</Text>
        </View>

      </Page>
    </Document>
  );
}

/* ─── Public API ─────────────────────────────────────────────── */

export async function generateEstimatePDF(
  estimate: any,
  lineItems: any[],
  paymentSchedule: any[],
  disclaimers: any[],
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <EstimatePDFDocument
      estimate={estimate}
      lineItems={lineItems}
      paymentSchedule={paymentSchedule}
      disclaimers={disclaimers}
    />
  );
  return Buffer.from(buffer);
}
