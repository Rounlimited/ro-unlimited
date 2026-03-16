import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer, Svg, Circle, Line, Rect } from '@react-pdf/renderer';
import React from 'react';

const LOGO_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/ro-unlimited-logo.png`;

/* ─── Helpers ────────────────────────────────────────────────── */

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
}

function fmt(n: number): string {
  return (n || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

function fmtDate(d: string | undefined): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function humanize(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/* ─── Brand Colors (Ref #3 — corrected palette, NO gold #C9A84C) ── */

const c = {
  navy: '#1B2A4A',
  orange: '#D4772C',
  orangeLight: '#E8944D',
  text: '#1a1a1a',
  textMed: '#333333',
  textLight: '#555555',
  label: '#777777',
  labelLight: '#999999',
  border: '#d4d4d4',
  borderLight: '#e8e8e8',
  bgSubtle: '#f7f7f5',
  bgWarm: '#f5f2ed',
  white: '#ffffff',
};

/* ─── Styles (Ref #1 — generous spacing throughout) ──────────── */

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: c.text,
    paddingTop: 72,
    paddingBottom: 56,
    paddingHorizontal: 50,
  },

  /* ── Fixed page header (Ref #2 — logo only, no competing text) ── */
  pageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 50,
    paddingTop: 18,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: c.orange,
  },
  pageHeaderRight: { fontSize: 7.5, color: c.label, textAlign: 'right', lineHeight: 1.4 },

  /* ── Fixed page footer (Ref #8 — complete professional signal) ── */
  pageFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 50,
    paddingBottom: 14,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: c.orange,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pageFooterLeft: { fontSize: 7, color: c.label, lineHeight: 1.4 },
  pageFooterRight: { fontSize: 7, color: c.label },

  /* ── Section label (Ref #3 — orange, not gold) ── */
  sectionLabel: {
    fontSize: 8.5,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: c.orange,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 6,
  },

  /* ── Client box (Ref #3 — orange left border) ── */
  clientBox: {
    backgroundColor: c.bgWarm,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 3,
    padding: '12 16',
    borderLeftWidth: 3,
    borderLeftColor: c.orange,
  },

  /* ── Detail table ── */
  detailTable: { borderWidth: 1, borderColor: c.border, borderRadius: 3, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.borderLight },
  detailRowLast: { flexDirection: 'row' },
  detailLabel: { width: 110, padding: '7 14', fontSize: 9, color: c.label, backgroundColor: c.bgSubtle },
  detailValue: { flex: 1, padding: '7 14', fontSize: 10, color: c.text, fontFamily: 'Helvetica-Bold' },
  detailValueNormal: { flex: 1, padding: '7 14', fontSize: 10, color: c.textMed },

  /* ── Phase header (Ref #3 — navy, not black) ── */
  phaseHeader: { backgroundColor: c.navy, padding: '6 12', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  phaseHeaderText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: c.white, textTransform: 'uppercase', letterSpacing: 1 },

  /* ── Table header ── */
  tableHeader: { flexDirection: 'row', backgroundColor: c.bgSubtle, borderBottomWidth: 1, borderBottomColor: c.border },
  tableHeaderCell: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.6, color: c.label, fontFamily: 'Helvetica-Bold', padding: '5 8' },

  /* ── Table rows (Ref #1 — more vertical padding) ── */
  tableRow: { flexDirection: 'row' },
  tableRowAlt: { flexDirection: 'row', backgroundColor: c.bgSubtle },
  tableCell: { fontSize: 9, color: c.textLight, padding: '6 8', borderBottomWidth: 0.5, borderBottomColor: c.borderLight },
  tableCellBold: { fontSize: 9, color: c.text, fontFamily: 'Helvetica-Bold', padding: '6 8', borderBottomWidth: 0.5, borderBottomColor: c.borderLight },

  /* ── Phase subtotal (Ref #3 — orange accent) ── */
  phaseFooter: { flexDirection: 'row', backgroundColor: c.bgWarm, borderTopWidth: 1.5, borderTopColor: c.orange },
  phaseFooterLabel: { flex: 1, padding: '6 8', fontSize: 8, color: c.orange, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'right' },
  phaseFooterValue: { width: 80, padding: '6 8', fontSize: 10, color: c.text, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  /* ── Financial summary (Ref #4 — dramatic total) ── */
  summaryBox: { width: 260, borderWidth: 1, borderColor: c.border, borderRadius: 3, overflow: 'hidden' },
  summaryHeader: { backgroundColor: c.navy, padding: '6 16', fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Helvetica-Bold', color: c.white },
  summaryBody: { padding: '8 16' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5 },
  summaryLabel: { fontSize: 9.5, color: c.label },
  summaryValue: { fontSize: 9.5, color: c.text },

  /* ── Disclaimers (Ref #6 — scannable blocks) ── */
  disclaimerBlock: { marginBottom: 10, paddingBottom: 8, borderBottomWidth: 0.5, borderBottomColor: c.borderLight },
  disclaimerNumber: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: c.navy, marginRight: 6 },
  disclaimerTitle: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: c.navy },
  disclaimerBody: { fontSize: 8.5, color: c.textLight, lineHeight: 1.6, marginTop: 3, paddingLeft: 20 },

  /* ── Exclusions ── */
  exclusionItem: { flexDirection: 'row', marginBottom: 3, paddingLeft: 4 },
  exclusionBullet: { fontSize: 9, color: c.orange, width: 12 },
  exclusionText: { fontSize: 9, color: c.textLight, flex: 1, lineHeight: 1.5 },

  /* ── Acceptance block (Ref #7 — with doc ID) ── */
  acceptBox: { borderWidth: 1, borderColor: c.navy, borderRadius: 3, padding: 22 },
  acceptIntro: { fontSize: 9, color: c.textLight, lineHeight: 1.7, marginBottom: 16 },
  sigRow: { flexDirection: 'row', gap: 30 },
  sigCol: { flex: 1 },
  sigColLabel: { fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 1.2, color: c.navy, fontFamily: 'Helvetica-Bold', marginBottom: 8 },
  sigLine: { borderBottomWidth: 1.5, borderBottomColor: c.text, minHeight: 32, marginBottom: 3 },
  sigLineLight: { borderBottomWidth: 0.5, borderBottomColor: c.border, minHeight: 16, marginTop: 10, marginBottom: 3 },
  sigLabel: { fontSize: 7, color: c.labelLight },
});

/* ─── Column widths ─────────────────────────────────────────── */
const colW = { num: 24, qty: 40, unit: 44, price: 70, total: 78 };

/* ─── PDF Document ──────────────────────────────────────────── */

interface PDFProps { estimate: any; lineItems: any[]; paymentSchedule: any[]; disclaimers: any[]; }

function EstimatePDFDocument({ estimate, lineItems, paymentSchedule, disclaimers }: PDFProps) {
  const customer = estimate.customer;
  const scopeText = estimate.scope_of_work || estimate.project_description || '';
  const projectAddr = [estimate.project_address, estimate.project_city, estimate.project_state, estimate.project_zip].filter(Boolean).join(', ');

  const grouped: Record<string, any[]> = {};
  (lineItems || []).forEach((item: any) => {
    const p = item.phase || 'Other';
    if (!grouped[p]) grouped[p] = [];
    grouped[p].push(item);
  });

  const subtotal = (lineItems || []).reduce(
    (sum: number, item: any) => sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100), 0
  );
  const overheadAmt = (subtotal * (estimate.overhead_percent || 0)) / 100;
  const markupAmt = (subtotal * (estimate.markup_percent || 0)) / 100;
  const taxable = subtotal + overheadAmt + markupAmt;
  const taxAmt = (taxable * (estimate.tax_percent || 0)) / 100;
  const contingencyAmt = (subtotal * (estimate.contingency_percent || 0)) / 100;
  const grandTotal = subtotal + overheadAmt + markupAmt + taxAmt + (estimate.permit_fees || 0) + contingencyAmt;

  const exclusionsList = (estimate.exclusions || '').split('\n').map((x: string) => x.trim()).filter(Boolean);
  const validDays = estimate.valid_until
    ? Math.max(0, Math.ceil((new Date(estimate.valid_until).getTime() - new Date(estimate.created_at).getTime()) / 86400000))
    : 30;

  const phaseSubtotals: Record<string, number> = {};
  Object.entries(grouped).forEach(([phase, items]) => {
    phaseSubtotals[phase] = items.reduce((sum: number, item: any) => sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100), 0);
  });

  const milestones = (paymentSchedule || []).map((m: any) => ({
    ...m,
    computedAmount: (grandTotal * (m.percent || 0)) / 100,
  }));

  // Document ID for QR/verify (Ref #7)
  const docId = `DOC-${(estimate.estimate_number || 'EST').replace(/[^A-Z0-9]/gi, '')}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  const verifyUrl = `rounlimited.com/verify/${estimate.estimate_number}`;

  let itemCounter = 0;

  return (
    <Document>
      <Page size="LETTER" style={s.page} wrap>

        {/* ═══ FIXED HEADER — Logo only, no competing text (Ref #2) ═══ */}
        <View style={s.pageHeader} fixed>
          <Image src={LOGO_URL} style={{ width: 140, height: 'auto' }} />
          <View>
            <Text style={s.pageHeaderRight}>{estimate.estimate_number}</Text>
            <Text style={s.pageHeaderRight}>{fmtDate(estimate.created_at)}</Text>
          </View>
        </View>

        {/* ═══ FIXED FOOTER — Complete professional signal (Ref #8) ═══ */}
        <View style={s.pageFooter} fixed>
          <View>
            <Text style={s.pageFooterLeft}>RO Unlimited Construction & Development</Text>
            <Text style={s.pageFooterLeft}>(864) 304-0139 | build@rounlimited.com | rounlimited.com</Text>
            <Text style={[s.pageFooterLeft, { fontSize: 6, marginTop: 1 }]}>Licensed & Insured | Greenville, SC | Serving GA, SC, NC</Text>
          </View>
          <Text style={s.pageFooterRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

        {/* ═══ 1. MAIN HEADER — Estimate info (visually secondary) ═══ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, paddingBottom: 14, borderBottomWidth: 2, borderBottomColor: c.navy }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2.5, color: c.orange, fontFamily: 'Helvetica-Bold' }}>ESTIMATE</Text>
              <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: c.navy }}>{estimate.estimate_number}</Text>
            </View>
            <View style={{ marginTop: 6, fontSize: 9, color: c.label, lineHeight: 1.5 }}>
              <Text style={{ fontSize: 9, color: c.label }}>Date: {fmtDate(estimate.created_at)}</Text>
              {estimate.valid_until && <Text style={{ fontSize: 9, color: c.label }}>Valid Until: {fmtDate(estimate.valid_until)}</Text>}
            </View>
          </View>
        </View>

        {/* Orange accent bar */}
        <View style={{ height: 3, backgroundColor: c.orange, marginBottom: 22, borderRadius: 1 }} />

        {/* ═══ 2. CLIENT (Ref #1 — generous spacing) ═══ */}
        {customer && (
          <View style={{ marginBottom: 24 }}>
            <Text style={s.sectionLabel}>Prepared For</Text>
            <View style={s.clientBox}>
              <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', color: c.text }}>{customer.first_name} {customer.last_name}</Text>
              {customer.company_name && <Text style={{ fontSize: 10, color: c.textLight, marginTop: 2 }}>{customer.company_name}</Text>}
              <View style={{ fontSize: 9, color: c.label, lineHeight: 1.6, marginTop: 6 }}>
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
        <View style={{ marginBottom: 24 }}>
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
                <Text style={s.detailLabel}>Estimate Type</Text>
                <Text style={s.detailValueNormal}>{humanize(estimate.estimate_type)}</Text>
              </View>
            )}
            {estimate.contract_type && (
              <View style={s.detailRowLast}>
                <Text style={s.detailLabel}>Contract Type</Text>
                <Text style={s.detailValueNormal}>{humanize(estimate.contract_type)}</Text>
              </View>
            )}
          </View>

          {scopeText && scopeText !== '<p></p>' && (
            <View style={{ marginTop: 14 }}>
              <Text style={s.sectionLabel}>Scope of Work</Text>
              <Text style={{ fontSize: 10, color: c.textMed, lineHeight: 1.7 }}>{stripHtml(scopeText)}</Text>
            </View>
          )}
        </View>

        {/* ═══ 4. LINE ITEMS ═══ */}
        {Object.keys(grouped).length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={s.sectionLabel}>Itemized Cost Breakdown</Text>
            {Object.entries(grouped).map(([phase, items]) => (
              <View key={phase} style={{ marginBottom: 12 }}>
                <View style={s.phaseHeader}>
                  <Text style={s.phaseHeaderText}>{phase}</Text>
                </View>
                <View style={s.tableHeader}>
                  <Text style={[s.tableHeaderCell, { width: colW.num }]}>#</Text>
                  <Text style={[s.tableHeaderCell, { flex: 1 }]}>Description</Text>
                  <Text style={[s.tableHeaderCell, { width: colW.qty, textAlign: 'right' }]}>Qty</Text>
                  <Text style={[s.tableHeaderCell, { width: colW.unit }]}>Unit</Text>
                  <Text style={[s.tableHeaderCell, { width: colW.price, textAlign: 'right' }]}>Unit Price</Text>
                  <Text style={[s.tableHeaderCell, { width: colW.total, textAlign: 'right' }]}>Total</Text>
                </View>
                {items.map((item: any, idx: number) => {
                  itemCounter++;
                  const lineTotal = item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100);
                  return (
                    <View key={item.id || idx} style={itemCounter % 2 === 0 ? s.tableRowAlt : s.tableRow}>
                      <Text style={[s.tableCell, { width: colW.num, color: c.labelLight }]}>{itemCounter}</Text>
                      <Text style={[s.tableCellBold, { flex: 1 }]}>{item.description || '--'}</Text>
                      <Text style={[s.tableCell, { width: colW.qty, textAlign: 'right' }]}>{item.quantity}</Text>
                      <Text style={[s.tableCell, { width: colW.unit }]}>{item.unit}</Text>
                      <Text style={[s.tableCell, { width: colW.price, textAlign: 'right' }]}>{fmt(item.unit_cost * (1 + (item.markup_percent || 0) / 100))}</Text>
                      <Text style={[s.tableCellBold, { width: colW.total, textAlign: 'right' }]}>{fmt(lineTotal)}</Text>
                    </View>
                  );
                })}
                <View style={s.phaseFooter}>
                  <Text style={s.phaseFooterLabel}>{phase} Subtotal</Text>
                  <Text style={s.phaseFooterValue}>{fmt(phaseSubtotals[phase])}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ═══ 5. FINANCIAL SUMMARY (Ref #4 — dramatic total) ═══ */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 28 }} wrap={false}>
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
              {/* Dramatic total (Ref #4) */}
              <View style={{ backgroundColor: c.navy, marginTop: 8, marginHorizontal: -16, marginBottom: -8, padding: '10 16', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: c.white, textTransform: 'uppercase', letterSpacing: 1.5 }}>Total</Text>
                <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: c.white }}>{fmt(grandTotal)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ 6. PAYMENT SCHEDULE (Ref #5 — visual timeline) ═══ */}
        {milestones.length > 0 && (
          <View wrap={false} style={{ marginBottom: 28 }}>
            <Text style={s.sectionLabel}>Payment Schedule</Text>

            {/* Timeline visualization */}
            <View style={{ marginBottom: 14, paddingHorizontal: 10 }}>
              <Svg width="100%" height="28" viewBox="0 0 500 28">
                {/* Track line */}
                <Line x1="20" y1="14" x2="480" y2="14" stroke={c.borderLight} strokeWidth="2" />
                {/* Filled progress line */}
                <Line x1="20" y1="14" x2="480" y2="14" stroke={c.orange} strokeWidth="2" strokeDasharray="4,3" />
                {/* Milestone dots */}
                {milestones.map((_: any, i: number) => {
                  const x = milestones.length === 1 ? 250 : 20 + (460 * i) / (milestones.length - 1);
                  return (
                    <React.Fragment key={i}>
                      <Circle cx={x} cy={14} r={6} fill={c.navy} />
                      <Circle cx={x} cy={14} r={3} fill={c.orange} />
                    </React.Fragment>
                  );
                })}
              </Svg>
              {/* Labels under dots */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                {milestones.map((m: any, i: number) => (
                  <Text key={i} style={{ fontSize: 7, color: c.label, textAlign: 'center', width: milestones.length === 1 ? '100%' : `${100 / milestones.length}%` }}>
                    {m.milestone || `Phase ${i + 1}`}
                  </Text>
                ))}
              </View>
            </View>

            {/* Detail table */}
            <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: 3, overflow: 'hidden' }}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>Milestone</Text>
                <Text style={[s.tableHeaderCell, { width: 40, textAlign: 'center' }]}>%</Text>
                <Text style={[s.tableHeaderCell, { width: 90, textAlign: 'right' }]}>Amount</Text>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>When Due</Text>
              </View>
              {milestones.map((m: any, i: number) => (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCellBold, { flex: 1 }]}>{m.milestone || `Milestone ${i + 1}`}</Text>
                  <Text style={[s.tableCell, { width: 40, textAlign: 'center' }]}>{m.percent}%</Text>
                  <Text style={[s.tableCellBold, { width: 90, textAlign: 'right' }]}>{fmt(m.computedAmount)}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{m.due_description || m.description || '--'}</Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 8, color: c.labelLight, fontStyle: 'italic', marginTop: 6 }}>
              A deposit is required before work commences. Payment terms are net 15 days from invoice date.
            </Text>
          </View>
        )}

        {/* ═══ 7. TERMS & CONDITIONS (Ref #6 — scannable blocks) ═══ */}
        {disclaimers.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={s.sectionLabel}>Terms & Conditions</Text>
            {disclaimers.map((d: any, i: number) => (
              <View key={d.id || i} style={s.disclaimerBlock}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={s.disclaimerNumber}>{i + 1}.</Text>
                  <Text style={s.disclaimerTitle}>{d.title}</Text>
                </View>
                <Text style={s.disclaimerBody}>{d.body}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ═══ 8. EXCLUSIONS ═══ */}
        {exclusionsList.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={s.sectionLabel}>Exclusions</Text>
            <Text style={{ fontSize: 8.5, color: c.label, fontStyle: 'italic', marginBottom: 6 }}>
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

        {/* ═══ 9. ACCEPTANCE (Ref #7 — with QR placeholder + doc ID) ═══ */}
        <View style={s.acceptBox} wrap={false}>
          <Text style={s.sectionLabel}>Acceptance & Authorization</Text>
          <Text style={s.acceptIntro}>
            By signing below, you accept this estimate and authorize RO Unlimited Construction & Development to begin work as described above. This acceptance constitutes a binding agreement subject to the terms and conditions stated herein.
          </Text>
          <View style={s.sigRow}>
            <View style={s.sigCol}>
              <Text style={s.sigColLabel}>Client</Text>
              <View style={s.sigLine} />
              <Text style={s.sigLabel}>Signature</Text>
              <View style={s.sigLineLight}>
                {customer && <Text style={{ fontSize: 9, color: c.textMed }}>{customer.first_name} {customer.last_name}</Text>}
              </View>
              <Text style={s.sigLabel}>Printed Name</Text>
              <View style={s.sigLineLight} />
              <Text style={s.sigLabel}>Date</Text>
            </View>
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

          {/* QR code placeholder + Document ID (Ref #7) */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 18, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: c.borderLight }}>
            <View>
              {/* QR code visual placeholder — 5x5 grid pattern */}
              <Svg width="44" height="44" viewBox="0 0 44 44">
                <Rect x="0" y="0" width="44" height="44" fill="white" stroke={c.border} strokeWidth="1" rx="2" />
                <Rect x="4" y="4" width="12" height="12" fill={c.navy} rx="1" />
                <Rect x="28" y="4" width="12" height="12" fill={c.navy} rx="1" />
                <Rect x="4" y="28" width="12" height="12" fill={c.navy} rx="1" />
                <Rect x="18" y="18" width="8" height="8" fill={c.navy} rx="1" />
                <Rect x="7" y="7" width="6" height="6" fill="white" rx="0.5" />
                <Rect x="31" y="7" width="6" height="6" fill="white" rx="0.5" />
                <Rect x="7" y="31" width="6" height="6" fill="white" rx="0.5" />
                <Rect x="9" y="9" width="2" height="2" fill={c.navy} />
                <Rect x="33" y="9" width="2" height="2" fill={c.navy} />
                <Rect x="9" y="33" width="2" height="2" fill={c.navy} />
                <Rect x="20" y="4" width="4" height="4" fill={c.orange} rx="0.5" />
                <Rect x="4" y="20" width="4" height="4" fill={c.orange} rx="0.5" />
                <Rect x="28" y="28" width="4" height="4" fill={c.orange} rx="0.5" />
                <Rect x="34" y="20" width="4" height="4" fill={c.orange} rx="0.5" />
                <Rect x="20" y="34" width="4" height="4" fill={c.orange} rx="0.5" />
              </Svg>
              <Text style={{ fontSize: 6, color: c.labelLight, marginTop: 2, textAlign: 'center' }}>Verify Online</Text>
            </View>
            <View style={{ textAlign: 'right' }}>
              <Text style={{ fontSize: 7, color: c.labelLight }}>Document ID: {docId}</Text>
              <Text style={{ fontSize: 6.5, color: c.labelLight, marginTop: 1 }}>{verifyUrl}</Text>
              <Text style={{ fontSize: 8, color: c.label, marginTop: 3 }}>Valid for {validDays} days from date of issue</Text>
            </View>
          </View>
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
