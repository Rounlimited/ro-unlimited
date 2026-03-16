import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import React from 'react';

// Logo URL — works on both local dev and Vercel production
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

/* ─── Brand Colors ──────────────────────────────────────────── */

const brand = {
  gold: '#C9A84C',
  goldDark: '#A8893D',
  goldLight: '#E8D5A0',
  orange: '#D4772C',
  navy: '#0f1a2e',
  dark: '#1a1a1a',
  text: '#1a1a1a',
  textMed: '#333333',
  textLight: '#555555',
  label: '#777777',
  labelLight: '#999999',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  bgSubtle: '#fafaf8',
  bgWarm: '#f8f6f2',
  white: '#ffffff',
};

/* ─── Styles ─────────────────────────────────────────────────── */

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: brand.text,
    paddingTop: 80,      // space for fixed header
    paddingBottom: 60,   // space for fixed footer
    paddingHorizontal: 50,
  },

  /* ── Fixed page header (repeats every page) ── */
  pageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 50,
    paddingTop: 24,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: brand.gold,
  },
  pageHeaderCompany: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: brand.dark, letterSpacing: 0.3 },
  pageHeaderRight: { fontSize: 8, color: brand.label, textAlign: 'right' },

  /* ── Fixed page footer (repeats every page) ── */
  pageFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 50,
    paddingBottom: 18,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: brand.gold,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageFooterLeft: { fontSize: 7, color: brand.label },
  pageFooterRight: { fontSize: 7, color: brand.label },

  /* ── Main header block (first page only) ── */
  mainHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: brand.borderLight },
  companyBlock: { flex: 1 },
  companyName: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: brand.dark, letterSpacing: -0.5 },
  companyTagline: { fontSize: 11, color: brand.gold, fontFamily: 'Helvetica-Bold', marginTop: 1, letterSpacing: 0.5 },
  companyInfo: { marginTop: 8, fontSize: 9, color: brand.label, lineHeight: 1.5 },
  estBlock: { alignItems: 'flex-end' },
  estLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 2, color: brand.gold, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  estNumber: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: brand.dark },
  estMeta: { marginTop: 6, fontSize: 9, color: brand.label, lineHeight: 1.6, textAlign: 'right' },
  estMetaLabel: { color: brand.labelLight },

  /* ── Gold accent bar ── */
  goldBar: { height: 3, backgroundColor: brand.gold, marginBottom: 16, borderRadius: 1 },

  /* ── Section label ── */
  sectionLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.5, color: brand.gold, fontFamily: 'Helvetica-Bold', marginBottom: 6, marginTop: 4 },

  /* ── Client box ── */
  clientBox: { backgroundColor: brand.bgWarm, borderWidth: 1, borderColor: brand.border, borderRadius: 4, padding: '10 14', marginBottom: 16, borderLeftWidth: 3, borderLeftColor: brand.gold },
  clientName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: brand.text },
  clientCompany: { fontSize: 10, color: brand.textLight, marginTop: 2 },
  clientDetail: { fontSize: 9, color: brand.label, lineHeight: 1.5, marginTop: 4 },

  /* ── Detail table ── */
  detailTable: { borderWidth: 1, borderColor: brand.border, borderRadius: 4, marginBottom: 16, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: brand.borderLight },
  detailRowLast: { flexDirection: 'row' },
  detailLabel: { width: 110, padding: '5 12', fontSize: 9, color: brand.label, backgroundColor: brand.bgSubtle },
  detailValue: { flex: 1, padding: '5 12', fontSize: 10, color: brand.text, fontFamily: 'Helvetica-Bold' },
  detailValueNormal: { flex: 1, padding: '5 12', fontSize: 10, color: brand.textMed },

  /* ── Scope ── */
  scopeBlock: { marginTop: 8, marginBottom: 16, paddingLeft: 2 },
  scopeText: { fontSize: 10, color: brand.textMed, lineHeight: 1.65 },

  /* ── Phase header ── */
  phaseHeader: { backgroundColor: brand.navy, padding: '5 10', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  phaseHeaderText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: brand.goldLight, textTransform: 'uppercase', letterSpacing: 0.8 },

  /* ── Table header ── */
  tableHeader: { flexDirection: 'row', backgroundColor: brand.bgSubtle, borderBottomWidth: 1, borderBottomColor: brand.border },
  tableHeaderCell: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 0.5, color: brand.label, fontFamily: 'Helvetica-Bold', padding: '4 8' },

  /* ── Table rows ── */
  tableRow: { flexDirection: 'row' },
  tableRowAlt: { flexDirection: 'row', backgroundColor: brand.bgSubtle },
  tableCell: { fontSize: 9, color: brand.textLight, padding: '3.5 8', borderBottomWidth: 0.5, borderBottomColor: brand.borderLight },
  tableCellBold: { fontSize: 9, color: brand.text, fontFamily: 'Helvetica-Bold', padding: '3.5 8', borderBottomWidth: 0.5, borderBottomColor: brand.borderLight },

  /* ── Phase subtotal ── */
  phaseFooter: { flexDirection: 'row', backgroundColor: brand.bgWarm, borderTopWidth: 1.5, borderTopColor: brand.gold },
  phaseFooterLabel: { flex: 1, padding: '5 8', fontSize: 8, color: brand.goldDark, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', textAlign: 'right' },
  phaseFooterValue: { width: 80, padding: '5 8', fontSize: 10, color: brand.dark, fontFamily: 'Helvetica-Bold', textAlign: 'right' },

  /* ── Financial summary ── */
  summaryWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  summaryBox: { width: 250, borderWidth: 1.5, borderColor: brand.gold, borderRadius: 4, overflow: 'hidden' },
  summaryHeader: { backgroundColor: brand.navy, padding: '5 14', fontSize: 8, textTransform: 'uppercase', letterSpacing: 1.5, fontFamily: 'Helvetica-Bold', color: brand.goldLight },
  summaryBody: { padding: '6 14' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  summaryLabel: { fontSize: 9, color: brand.label },
  summaryValue: { fontSize: 9, color: brand.text },
  summaryDivider: { borderTopWidth: 1.5, borderTopColor: brand.gold, marginTop: 4, paddingTop: 6 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryTotalLabel: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: brand.dark, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryTotalValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: brand.gold },

  /* ── Payment schedule ── */
  paymentTable: { borderWidth: 1, borderColor: brand.border, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  paymentNote: { fontSize: 8, color: brand.labelLight, fontStyle: 'italic', marginTop: 4, marginBottom: 16 },

  /* ── Disclaimers ── */
  disclaimerBlock: { marginBottom: 6 },
  disclaimerTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: brand.dark, marginBottom: 1 },
  disclaimerBody: { fontSize: 8, color: brand.textLight, lineHeight: 1.5, paddingLeft: 10 },

  /* ── Exclusions ── */
  exclusionItem: { flexDirection: 'row', marginBottom: 2 },
  exclusionBullet: { fontSize: 9, color: brand.gold, width: 12 },
  exclusionText: { fontSize: 9, color: brand.textLight, flex: 1, lineHeight: 1.4 },

  /* ── Acceptance block ── */
  acceptBox: { borderWidth: 1.5, borderColor: brand.gold, borderRadius: 4, padding: 20, marginBottom: 16 },
  acceptIntro: { fontSize: 9, color: brand.textLight, lineHeight: 1.6, marginBottom: 14 },
  sigRow: { flexDirection: 'row', gap: 30 },
  sigCol: { flex: 1 },
  sigColLabel: { fontSize: 7, textTransform: 'uppercase', letterSpacing: 1, color: brand.gold, fontFamily: 'Helvetica-Bold', marginBottom: 6 },
  sigLine: { borderBottomWidth: 1.5, borderBottomColor: brand.dark, minHeight: 28, marginBottom: 2 },
  sigLineLight: { borderBottomWidth: 0.5, borderBottomColor: brand.border, minHeight: 14, marginTop: 8, marginBottom: 2 },
  sigLabel: { fontSize: 7, color: brand.labelLight },

  /* ── Spacing ── */
  mb16: { marginBottom: 16 },
  mb8: { marginBottom: 8 },
});

/* ─── Column widths ─────────────────────────────────────────── */
const colW = { num: 24, qty: 38, unit: 42, price: 68, total: 76 };

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

  // Group line items
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

  let itemCounter = 0;

  return (
    <Document>
      <Page size="LETTER" style={s.page} wrap>

        {/* ═══ FIXED HEADER (every page) ═══ */}
        <View style={s.pageHeader} fixed>
          <Text style={s.pageHeaderCompany}>RO Unlimited Construction & Development</Text>
          <View>
            <Text style={s.pageHeaderRight}>{estimate.estimate_number}</Text>
            <Text style={[s.pageHeaderRight, { marginTop: 1 }]}>{fmtDate(estimate.created_at)}</Text>
          </View>
        </View>

        {/* ═══ FIXED FOOTER (every page) ═══ */}
        <View style={s.pageFooter} fixed>
          <Text style={s.pageFooterLeft}>(864) 304-0139 | rounlimited.com | Licensed & Insured</Text>
          <Text style={s.pageFooterRight} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

        {/* ═══ 1. MAIN HEADER (first page) ═══ */}
        <View style={s.mainHeader}>
          <View style={s.companyBlock}>
            <Image src={LOGO_URL} style={{ width: 180, height: 'auto', marginBottom: 6 }} />
            <View style={s.companyInfo}>
              <Text>Greenville, SC</Text>
              <Text>(864) 304-0139</Text>
              <Text>rounlimited.com</Text>
            </View>
          </View>
          <View style={s.estBlock}>
            <Text style={s.estLabel}>ESTIMATE</Text>
            <Text style={s.estNumber}>{estimate.estimate_number}</Text>
            <View style={s.estMeta}>
              <Text><Text style={s.estMetaLabel}>Date: </Text>{fmtDate(estimate.created_at)}</Text>
              {estimate.valid_until && (
                <Text><Text style={s.estMetaLabel}>Valid Until: </Text>{fmtDate(estimate.valid_until)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Gold accent bar */}
        <View style={s.goldBar} />

        {/* ═══ 2. CLIENT ═══ */}
        {customer && (
          <View style={s.mb16}>
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
        <View style={s.mb16}>
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
            <View style={s.scopeBlock}>
              <Text style={s.sectionLabel}>Scope of Work</Text>
              <Text style={s.scopeText}>{stripHtml(scopeText)}</Text>
            </View>
          )}
        </View>

        {/* ═══ 4. LINE ITEMS ═══ */}
        {Object.keys(grouped).length > 0 && (
          <View style={s.mb16}>
            <Text style={s.sectionLabel}>Itemized Cost Breakdown</Text>
            {Object.entries(grouped).map(([phase, items]) => (
              <View key={phase} style={s.mb8}>
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
                      <Text style={[s.tableCell, { width: colW.num, color: brand.labelLight }]}>{itemCounter}</Text>
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
              <View style={s.summaryDivider}>
                <View style={s.summaryTotalRow}>
                  <Text style={s.summaryTotalLabel}>Total</Text>
                  <Text style={s.summaryTotalValue}>{fmt(grandTotal)}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ═══ 6. PAYMENT SCHEDULE ═══ */}
        {milestones.length > 0 && (
          <View wrap={false}>
            <Text style={s.sectionLabel}>Payment Schedule</Text>
            <View style={s.paymentTable}>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>Milestone</Text>
                <Text style={[s.tableHeaderCell, { width: 40, textAlign: 'center' }]}>%</Text>
                <Text style={[s.tableHeaderCell, { width: 85, textAlign: 'right' }]}>Amount</Text>
                <Text style={[s.tableHeaderCell, { flex: 1 }]}>When Due</Text>
              </View>
              {milestones.map((m: any, i: number) => (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <Text style={[s.tableCellBold, { flex: 1 }]}>{m.milestone || `Milestone ${i + 1}`}</Text>
                  <Text style={[s.tableCell, { width: 40, textAlign: 'center' }]}>{m.percent}%</Text>
                  <Text style={[s.tableCellBold, { width: 85, textAlign: 'right' }]}>{fmt(m.computedAmount)}</Text>
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
          <View style={s.mb16}>
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
          <View style={s.mb16}>
            <Text style={s.sectionLabel}>Exclusions</Text>
            <Text style={{ fontSize: 8, color: brand.label, fontStyle: 'italic', marginBottom: 4 }}>
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

        {/* ═══ 9. ACCEPTANCE ═══ */}
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
                {customer && <Text style={{ fontSize: 9, color: brand.textMed }}>{customer.first_name} {customer.last_name}</Text>}
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
        </View>

        {/* ═══ 10. VALIDITY NOTE ═══ */}
        <View style={{ textAlign: 'center', paddingTop: 8 }}>
          <Text style={{ fontSize: 8, color: brand.labelLight }}>
            This estimate is valid for {validDays} days from date of issue.
          </Text>
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
