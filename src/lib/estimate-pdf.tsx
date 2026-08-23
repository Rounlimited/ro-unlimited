import { Document, Page, Text, View, Image, StyleSheet, Font, renderToBuffer, Svg, Circle, Line, Rect } from '@react-pdf/renderer';
import React from 'react';
import { estimateDisplayDate } from './estimates';

/* react-pdf hyphenates by default (Knuth-Liang, English). In a construction
   document that produces "con-struc-tion"-style breaks mid-word that read as
   garbled. Never break inside a word; let lines wrap at spaces only. */
Font.registerHyphenationCallback((word) => [word]);

const LOGO_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/ro-unlimited-logo.png`;

/* ─── Helpers ────────────────────────────────────────────────── */

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)));
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, '')).trim();
}

/* ─── Rich text (editor HTML → PDF blocks) ───────────────────
   The scope editor (TipTap) stores HTML: <p>, <ul>/<ol><li>, <strong>, <em>,
   <h2>… The customer link renders that HTML directly; the PDF used to strip
   every tag and print one run-on paragraph ("PROPOSALScope of WorkProvide…").
   This parser keeps paragraphs, headings, bullets and inline bold/italic. */

type Run = { text: string; bold: boolean; italic: boolean };
type Block = { type: 'h' | 'p' | 'li'; runs: Run[]; depth?: number; ordered?: boolean; index?: number };

function htmlToBlocks(html: string): Block[] {
  const blocks: Block[] = [];
  let cur = null as Block | null; // assigned through closures below — keep the union
  let bold = 0;
  let italic = 0;
  const lists: { ordered: boolean; count: number }[] = [];

  const flush = () => {
    if (cur) {
      // trim edges, drop empties
      const runs = cur.runs.filter((r) => r.text.length > 0);
      if (runs.length) {
        runs[0].text = runs[0].text.replace(/^\s+/, '');
        runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, '');
      }
      if (runs.some((r) => r.text.trim())) blocks.push({ ...cur, runs });
    }
    cur = null;
  };
  const open = (b: Block) => { flush(); cur = b; };
  const addText = (t: string) => {
    if (!t) return;
    if (!cur) {
      if (!t.trim()) return;
      cur = { type: 'p', runs: [] };
    }
    const last = cur.runs[cur.runs.length - 1];
    const isBold = bold > 0; const isItalic = italic > 0;
    if (last && last.bold === isBold && last.italic === isItalic) last.text += t;
    else cur.runs.push({ text: t, bold: isBold, italic: isItalic });
  };

  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>|[^<]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const tok = m[0];
    if (tok[0] !== '<') { addText(decodeEntities(tok).replace(/\s+/g, ' ')); continue; }
    const closing = tok[1] === '/';
    const tag = m[1].toLowerCase();
    switch (tag) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        if (closing) flush(); else open({ type: 'h', runs: [] });
        break;
      case 'ul': case 'ol':
        flush();
        if (closing) lists.pop(); else lists.push({ ordered: tag === 'ol', count: 0 });
        break;
      case 'li': {
        if (closing) { flush(); break; }
        const list = lists[lists.length - 1] || { ordered: false, count: 0 };
        list.count += 1;
        open({ type: 'li', runs: [], depth: Math.max(0, lists.length - 1), ordered: list.ordered, index: list.count });
        break;
      }
      case 'p': case 'div': case 'blockquote':
        // A <p> inside an <li> belongs to that bullet — keep the bullet open.
        if (cur && cur.type === 'li') { if (closing) addText(' '); break; }
        if (closing) flush(); else open({ type: 'p', runs: [] });
        break;
      case 'br':
        addText('\n');
        break;
      case 'strong': case 'b':
        bold += closing ? -1 : 1; if (bold < 0) bold = 0;
        break;
      case 'em': case 'i':
        italic += closing ? -1 : 1; if (italic < 0) italic = 0;
        break;
      default:
        break; // span, a, u, etc. — inline, ignored
    }
  }
  flush();
  return blocks;
}

function runFont(r: Run): string {
  if (r.bold && r.italic) return 'Helvetica-BoldOblique';
  if (r.bold) return 'Helvetica-Bold';
  if (r.italic) return 'Helvetica-Oblique';
  return 'Helvetica';
}

/** Renders editor HTML (or plain text with newlines) as structured PDF blocks. */
function RichText({ html, fontSize = 10, color = '#333333', lineHeight = 1.6 }: { html: string; fontSize?: number; color?: string; lineHeight?: number }) {
  const source = /<[a-z][^>]*>/i.test(html)
    ? html
    : html.split('\n').map((l) => `<p>${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>`).join('');
  const blocks = htmlToBlocks(source);
  return (
    <View>
      {blocks.map((b, i) => {
        const runs = b.runs.map((r, j) => <Text key={j} style={{ fontFamily: runFont(r) }}>{r.text}</Text>);
        // An all-bold short paragraph is how the editor expresses a sub-heading.
        const isHeading = b.type === 'h' || (b.type === 'p' && b.runs.every((r) => r.bold) && b.runs.reduce((n, r) => n + r.text.length, 0) <= 90);
        if (isHeading) {
          return (
            <Text key={i} minPresenceAhead={36} style={{ fontSize: fontSize + 0.5, fontFamily: 'Helvetica-Bold', color: '#1B2A4A', marginTop: i === 0 ? 0 : 9, marginBottom: 4, lineHeight: 1.4 }}>
              {b.runs.map((r, j) => <Text key={j}>{r.text}</Text>)}
            </Text>
          );
        }
        if (b.type === 'li') {
          return (
            <View key={i} style={{ flexDirection: 'row', paddingLeft: 4 + (b.depth || 0) * 12, marginBottom: 2.5 }}>
              <Text style={{ width: 14, fontSize, color: '#D4772C', lineHeight }}>{b.ordered ? `${b.index}.` : '\u2022'}</Text>
              <Text style={{ flex: 1, fontSize, color, lineHeight }}>{runs}</Text>
            </View>
          );
        }
        return (
          <Text key={i} style={{ fontSize, color, lineHeight, marginBottom: 5 }}>{runs}</Text>
        );
      })}
    </View>
  );
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
    borderBottomWidth: 3,
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
  acceptBox: { borderWidth: 1, borderColor: c.navy, borderRadius: 3, padding: 26 },
  acceptIntro: { fontSize: 9, color: c.textLight, lineHeight: 1.7, marginBottom: 18 },
  sigRow: { flexDirection: 'row', gap: 24 },
  sigCol: { flex: 1 },
  sigColLabel: { fontSize: 7.5, textTransform: 'uppercase', letterSpacing: 1.2, color: c.navy, fontFamily: 'Helvetica-Bold', marginBottom: 10 },
  sigLine: { borderBottomWidth: 1.5, borderBottomColor: c.text, minHeight: 38, marginBottom: 4 },
  sigLineLight: { borderBottomWidth: 0.5, borderBottomColor: c.border, minHeight: 20, marginTop: 12, marginBottom: 4 },
  sigLabel: { fontSize: 7, color: c.labelLight },
});

/* ─── Column widths ─────────────────────────────────────────── */
const colW = { num: 24, qty: 40, unit: 44, price: 70, total: 78 };

/* ─── Construction-logical category ordering ────────────────── */
const PHASE_ORDER: string[] = [
  'SITE PREP', 'DEMOLITION', 'EXCAVATION', 'FOUNDATION', 'GRADING',
  'CONCRETE', 'STRUCTURAL STEEL', 'FRAMING', 'ROOFING', 'EXTERIOR',
  'WINDOWS & DOORS', 'PLUMBING', 'ELECTRICAL', 'HVAC', 'INSULATION',
  'DRYWALL', 'PAINTING', 'FLOORING', 'FINISH WORK', 'CABINETRY & MILLWORK',
  'LANDSCAPING', 'PAVING',
  'CLEANUP', 'OTHER',
];

function phaseSort(a: string, b: string): number {
  const au = a.toUpperCase();
  const bu = b.toUpperCase();
  let ai = PHASE_ORDER.indexOf(au);
  let bi = PHASE_ORDER.indexOf(bu);
  // Unknown categories go before CLEANUP/OTHER (index 22)
  if (ai === -1) ai = PHASE_ORDER.length - 2.5;
  if (bi === -1) bi = PHASE_ORDER.length - 2.5;
  // If both unknown, fall back to alphabetical
  if (ai === bi) return au.localeCompare(bu);
  return ai - bi;
}

/* ─── PDF Document ──────────────────────────────────────────── */

interface PDFProps { estimate: any; lineItems: any[]; paymentSchedule: any[]; disclaimers: any[]; options?: any[]; }

/* ─── Table Header Row (reusable for continuation pages) ──── */
function TableColumnHeaders() {
  return (
    <View style={s.tableHeader}>
      <Text style={[s.tableHeaderCell, { width: colW.num }]}>#</Text>
      <Text style={[s.tableHeaderCell, { flex: 1 }]}>Description</Text>
      <Text style={[s.tableHeaderCell, { width: colW.qty, textAlign: 'right' }]}>Qty</Text>
      <Text style={[s.tableHeaderCell, { width: colW.unit }]}>Unit</Text>
      <Text style={[s.tableHeaderCell, { width: colW.price, textAlign: 'right' }]}>Unit Price</Text>
      <Text style={[s.tableHeaderCell, { width: colW.total, textAlign: 'right' }]}>Total</Text>
    </View>
  );
}

/* ─── Line Item Row (wrap={false} so rows never split) ───── */
function LineItemRow({ item, counter }: { item: any; counter: number }) {
  const lineTotal = item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100);
  return (
    <View style={counter % 2 === 0 ? s.tableRowAlt : s.tableRow} wrap={false}>
      <Text style={[s.tableCell, { width: colW.num, color: c.labelLight }]}>{counter}</Text>
      <Text style={[s.tableCellBold, { flex: 1 }]}>{item.description || '--'}</Text>
      <Text style={[s.tableCell, { width: colW.qty, textAlign: 'right' }]}>{item.quantity}</Text>
      <Text style={[s.tableCell, { width: colW.unit }]}>{item.unit ? humanize(String(item.unit)) : ''}</Text>
      <Text style={[s.tableCell, { width: colW.price, textAlign: 'right' }]}>{fmt(item.unit_cost * (1 + (item.markup_percent || 0) / 100))}</Text>
      <Text style={[s.tableCellBold, { width: colW.total, textAlign: 'right' }]}>{fmt(lineTotal)}</Text>
    </View>
  );
}

function EstimatePDFDocument({ estimate, lineItems, paymentSchedule, disclaimers, options = [] }: PDFProps) {
  const customer = estimate.customer;
  const displayDate = estimateDisplayDate(estimate);
  const scopeText = estimate.scope_of_work || estimate.project_description || '';
  const projectAddr = [estimate.project_address, estimate.project_city, estimate.project_state, estimate.project_zip].filter(Boolean).join(', ');

  /* ── Document mode labels ─────────────────────────────────── */
  const docMode = estimate.document_mode || 'estimate';
  const docTitleMap: Record<string, string> = {
    estimate: 'ESTIMATE',
    contract: 'PROPOSAL',
    change_order: 'CHANGE ORDER',
    quick_quote: 'QUICK QUOTE',
  };
  const docTitle = docTitleMap[docMode] || 'ESTIMATE';
  const isContract = docMode === 'contract';
  const isQuickQuote = docMode === 'quick_quote';

  const inclusionsList = (estimate.inclusions || '').split('\n').map((x: string) => x.trim()).filter(Boolean);

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
  const selectedPicks = (options || []).flatMap((g: any) =>
    (g.choices || []).filter((ch: any) => ch.selected).map((ch: any) => ({ group: g, choice: ch }))
  );
  const optionsMaterialized = !!estimate.options_materialized_at;
  const selectionsDelta = optionsMaterialized
    ? 0
    : selectedPicks.reduce((sum: number, { choice }: any) => sum + (Number(choice.price_delta) || 0), 0);
  const grandTotal = subtotal + overheadAmt + markupAmt + taxAmt + (estimate.permit_fees || 0) + contingencyAmt + selectionsDelta;

  // Exclusions / recommendations may be editor HTML (the customer link renders
  // them as HTML) or plain newline-separated text. Bullet the plain form;
  // hand the HTML form to RichText so its own structure survives.
  const isHtml = (v: any) => typeof v === 'string' && /<[a-z][^>]*>/i.test(v);
  const exclusionsHtml = isHtml(estimate.exclusions) && stripHtml(estimate.exclusions) ? estimate.exclusions : '';
  const exclusionsList = exclusionsHtml ? [] : (estimate.exclusions || '').split('\n').map((x: string) => x.trim()).filter(Boolean);
  const recommendationsHtml = isHtml(estimate.recommendations) && stripHtml(estimate.recommendations) ? estimate.recommendations : '';
  const recommendationsList = recommendationsHtml ? [] : (estimate.recommendations || '').split('\n').map((x: string) => x.trim()).filter(Boolean);
  const validDays = estimate.valid_until
    ? Math.max(0, Math.ceil((new Date(estimate.valid_until).getTime() - new Date(estimateDisplayDate(estimate) || estimate.created_at).getTime()) / 86400000))
    : 30;

  // Sort phases in construction-logical order
  const sortedPhases = Object.keys(grouped).sort(phaseSort);

  const phaseSubtotals: Record<string, number> = {};
  sortedPhases.forEach((phase) => {
    phaseSubtotals[phase] = grouped[phase].reduce((sum: number, item: any) => sum + item.quantity * item.unit_cost * (1 + (item.markup_percent || 0) / 100), 0);
  });

  const milestones = (paymentSchedule || []).map((m: any) => ({
    ...m,
    computedAmount: (grandTotal * (m.percent || 0)) / 100,
  }));

  // Document ID for QR/verify (Ref #7)
  const docId = `DOC-${(estimate.estimate_number || 'EST').replace(/[^A-Z0-9]/gi, '')}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  const verifyUrl = `rounlimited.com/verify/${estimate.estimate_number}`;

  let itemCounter = 0;

  /* ── Rule 9: Adaptive Spacing ─────────────────────────────── */
  const totalItems = (lineItems || []).length;
  const phaseCount = Object.keys(grouped).length;
  const isLight = totalItems <= 5;
  const isHeavy = totalItems >= 15 || phaseCount >= 4;
  const sectionGap = isLight ? 32 : isHeavy ? 16 : 24;
  const innerGap = isLight ? 16 : isHeavy ? 8 : 12;

  return (
    <Document>
      <Page size="LETTER" style={s.page} wrap>

        {/* ═══ FIXED HEADER — Logo only, no competing text (Ref #2) ═══ */}
        <View style={s.pageHeader} fixed>
          <Image src={LOGO_URL} style={{ width: 140, height: 'auto' }} />
          <View>
            <Text style={s.pageHeaderRight}>{estimate.estimate_number}</Text>
            <Text style={s.pageHeaderRight}>{fmtDate(displayDate || undefined)}</Text>
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

        {/* ═══ Page-1 block — mirrors the customer link: header card, then Project Details ═══ */}
        <View wrap={false}>
          {/* ── 1. MAIN HEADER (number, status-free, project name, dates) ── */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isLight ? 10 : 6, paddingBottom: isLight ? 14 : 10, borderBottomWidth: 2, borderBottomColor: c.navy }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 2.5, color: c.orange, fontFamily: 'Helvetica-Bold' }}>{docTitle}</Text>
                <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: c.navy }}>{estimate.estimate_number}</Text>
              </View>
              {estimate.project_name ? (
                <Text style={{ fontSize: 11.5, color: c.textMed, marginTop: 4 }}>{String(estimate.project_name).trim()}</Text>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 9, color: c.label }}>Date: <Text style={{ color: c.textMed, fontFamily: 'Helvetica-Bold' }}>{fmtDate(displayDate || undefined)}</Text></Text>
              {estimate.valid_until ? <Text style={{ fontSize: 9, color: c.label, marginTop: 3 }}>Valid Until: <Text style={{ color: c.textMed, fontFamily: 'Helvetica-Bold' }}>{fmtDate(estimate.valid_until)}</Text></Text> : null}
            </View>
          </View>

          {/* Orange accent bar */}
          <View style={{ height: 3, backgroundColor: c.orange, marginBottom: isLight ? 22 : 14, borderRadius: 1 }} />

          {/* ── 2. PROJECT DETAILS (same rows as the customer link) ── */}
          <View style={{ marginBottom: isLight ? 24 : 16 }}>
            <Text style={s.sectionLabel}>Project Details</Text>
            <View style={s.detailTable}>
              {customer && (
                <View style={s.detailRow}>
                  <Text style={s.detailLabel}>Prepared For</Text>
                  <View style={{ flex: 1, padding: '7 14' }}>
                    <Text style={{ fontSize: 10.5, color: c.text, fontFamily: 'Helvetica-Bold' }}>{[customer.first_name, customer.last_name].filter(Boolean).join(' ')}</Text>
                    {customer.company_name ? <Text style={{ fontSize: 9, color: c.textLight, marginTop: 1 }}>{customer.company_name}</Text> : null}
                    {(customer.address || customer.city) && (
                      <Text style={{ fontSize: 8.5, color: c.label, marginTop: 2 }}>{[customer.address, customer.city, customer.state, customer.zip].filter(Boolean).join(', ')}</Text>
                    )}
                    {(customer.phone || customer.email) && (
                      <Text style={{ fontSize: 8.5, color: c.label, marginTop: 1 }}>{[customer.phone, customer.email].filter(Boolean).join('  |  ')}</Text>
                    )}
                  </View>
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
                <View style={estimate.contract_type ? s.detailRow : s.detailRowLast}>
                  <Text style={s.detailLabel}>Type</Text>
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
          </View>
        </View>

        {/* ── 3. SCOPE OF WORK — rich text, flows across pages like any document ── */}
        {scopeText && stripHtml(scopeText) && (
          <View style={{ marginBottom: sectionGap }}>
            <Text style={s.sectionLabel} minPresenceAhead={60}>Scope of Work</Text>
            <RichText html={scopeText} fontSize={10} color={c.textMed} lineHeight={1.6} />
          </View>
        )}

        {/* ═══ 3A-2. JOB-SITE PHOTOS — if present ═══
            Sanity CDN urls get fm=jpg forced: @react-pdf can't decode webp,
            and auto=format would happily serve it. Two per row, captioned,
            wrap={false} per card so a photo never splits across pages. */}
        {Array.isArray(estimate.photos) && estimate.photos.length > 0 && (
          <View style={{ marginBottom: sectionGap }}>
            <Text style={s.sectionLabel}>Job-Site Photos</Text>
            {/* Three-up 4:3 grid, same as the customer link. Fixed box height +
                objectFit cover keeps portrait shots from blowing up a whole page. */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {estimate.photos.map((photo: any, i: number) => (
                <View key={i} wrap={false} style={{ width: '31.8%', marginBottom: 4 }}>
                  <Image
                    src={photo.url.includes('cdn.sanity.io')
                      ? `${photo.url}${photo.url.includes('?') ? '&' : '?'}w=800&fm=jpg`
                      : photo.url}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 3 }}
                  />
                  {photo.caption ? (
                    <Text style={{ fontSize: 8.5, color: c.textMed, marginTop: 3, lineHeight: 1.4 }}>
                      {photo.caption}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ═══ 3A-3. SELECTED OPTIONS — the customer's configured picks ═══ */}
        {selectedPicks.length > 0 && (
          <View style={{ marginBottom: sectionGap }} wrap={false}>
            <Text style={s.sectionLabel}>{optionsMaterialized ? 'Selected Options — Locked In' : 'Selected Options'}</Text>
            <View style={{ borderWidth: 1, borderColor: c.borderLight, borderRadius: 3 }}>
              {selectedPicks.map(({ group, choice }: any, i: number) => {
                const d = Number(choice.price_delta) || 0;
                const img = choice.image_url
                  ? (String(choice.image_url).includes('cdn.sanity.io')
                      ? `${choice.image_url}${String(choice.image_url).includes('?') ? '&' : '?'}w=240&h=180&fit=crop&fm=jpg`
                      : choice.image_url)
                  : null;
                return (
                  <View key={choice.id || i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: i < selectedPicks.length - 1 ? 1 : 0, borderBottomColor: c.borderLight }}>
                    {img ? (
                      /* eslint-disable-next-line jsx-a11y/alt-text */
                      <Image src={img} style={{ width: 44, height: 33, objectFit: 'cover', borderRadius: 2 }} />
                    ) : (
                      <View style={{ width: 44, height: 33, backgroundColor: c.bgSubtle, borderRadius: 2 }} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 8, color: c.label, textTransform: 'uppercase', letterSpacing: 1 }}>{group.label}</Text>
                      <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: c.text }}>{choice.label}</Text>
                      {choice.description ? <Text style={{ fontSize: 8.5, color: c.textLight }}>{choice.description}</Text> : null}
                    </View>
                    <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold', color: d > 0 ? c.orange : d < 0 ? '#1e9e5c' : c.label }}>
                      {d === 0 ? 'Included' : (d > 0 ? '+' : '−') + fmt(Math.abs(d))}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Text style={{ fontSize: 8, color: c.label, marginTop: 4 }}>
              {optionsMaterialized
                ? 'These selections were confirmed with the customer\'s signature and are reflected in the line items above.'
                : 'Selections made on the customer link. Priced options are added to the total below; they lock in at signing.'}
            </Text>
          </View>
        )}

        {/* ═══ 3B. INCLUSIONS — if present ═══ */}
        {inclusionsList.length > 0 && (
          <View style={{ marginBottom: sectionGap }} wrap={false}>
            <Text style={s.sectionLabel}>Inclusions</Text>
            <Text style={{ fontSize: 8.5, color: c.label, fontStyle: 'italic', marginBottom: 6 }}>
              The following items ARE included in this scope of work:
            </Text>
            {inclusionsList.map((item: string, i: number) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 3, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9, color: '#22c55e', width: 12 }}>+</Text>
                <Text style={{ fontSize: 9, color: c.textLight, flex: 1, lineHeight: 1.5 }}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ═══ 4. LINE ITEMS — Rules 1, 2, 10 ═══ */}
        {sortedPhases.length > 0 && (
          <View style={{ marginBottom: sectionGap }}>
            <Text style={s.sectionLabel}>Itemized Cost Breakdown</Text>
            {sortedPhases.map((phase) => {
              const items = grouped[phase];
              return (
                <View key={phase} style={{ marginBottom: innerGap }}>
                  {/* Rule 1: Category header + column headers + first 2 rows kept together */}
                  <View wrap={false}>
                    <View style={s.phaseHeader}>
                      <Text style={s.phaseHeaderText}>{phase}</Text>
                    </View>
                    <TableColumnHeaders />
                    {items.slice(0, 2).map((item: any, idx: number) => {
                      itemCounter++;
                      return <LineItemRow key={item.id || idx} item={item} counter={itemCounter} />;
                    })}
                  </View>

                  {/* Middle rows (each row is wrap={false} via LineItemRow) */}
                  {items.length > 4 && items.slice(2, items.length - 2).map((item: any, idx: number) => {
                    itemCounter++;
                    return <LineItemRow key={item.id || (idx + 2)} item={item} counter={itemCounter} />;
                  })}

                  {/* Rule 2: Last 2 rows + subtotal kept together */}
                  {items.length > 2 && (
                    <View wrap={false}>
                      {/* Rule 10: Continued header when table splits across pages */}
                      {items.length > 4 && (
                        <View style={[s.tableHeader, { borderTopWidth: 0.5, borderTopColor: c.border }]}>
                          <Text style={[s.tableHeaderCell, { width: colW.num }]}>#</Text>
                          <Text style={[s.tableHeaderCell, { flex: 1 }]}>Description</Text>
                          <Text style={[s.tableHeaderCell, { width: colW.qty, textAlign: 'right' }]}>Qty</Text>
                          <Text style={[s.tableHeaderCell, { width: colW.unit }]}>Unit</Text>
                          <Text style={[s.tableHeaderCell, { width: colW.price, textAlign: 'right' }]}>Unit Price</Text>
                          <Text style={[s.tableHeaderCell, { width: colW.total, textAlign: 'right' }]}>Total</Text>
                        </View>
                      )}
                      {(items.length <= 4 ? items.slice(2) : items.slice(items.length - 2)).map((item: any, idx: number) => {
                        itemCounter++;
                        return <LineItemRow key={item.id || (idx + 100)} item={item} counter={itemCounter} />;
                      })}
                      <View style={s.phaseFooter}>
                        <Text style={s.phaseFooterLabel}>{phase} Subtotal</Text>
                        <Text style={s.phaseFooterValue}>{fmt(phaseSubtotals[phase])}</Text>
                      </View>
                    </View>
                  )}

                  {/* Categories with exactly 2 items: subtotal stays with header block */}
                  {items.length <= 2 && (
                    <View style={s.phaseFooter}>
                      <Text style={s.phaseFooterLabel}>{phase} Subtotal</Text>
                      <Text style={s.phaseFooterValue}>{fmt(phaseSubtotals[phase])}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ═══ 5. FINANCIAL SUMMARY — Rule 3: One unbreakable block ═══ */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: sectionGap }} wrap={false}>
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
              {selectionsDelta !== 0 && (
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Selected Options</Text>
                  <Text style={s.summaryValue}>{(selectionsDelta > 0 ? '+' : '−') + fmt(Math.abs(selectionsDelta))}</Text>
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

        {/* ═══ 6. PAYMENT SCHEDULE — Rule 4: One unbreakable block ═══ */}
        {milestones.length > 0 && (
          <View wrap={false} style={{ marginBottom: sectionGap }}>
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

        {/* ═══ 7. TERMS & CONDITIONS — Fix 1: Header + first term kept together ═══ */}
        {disclaimers.length > 0 && (
          <View style={{ marginBottom: sectionGap }}>
            {/* Header + first term as one unbreakable block to prevent orphaned header */}
            <View wrap={false}>
              <Text style={s.sectionLabel}>Terms & Conditions</Text>
              {disclaimers.length > 0 && (
                <View style={s.disclaimerBlock}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={s.disclaimerNumber}>1.</Text>
                    <Text style={s.disclaimerTitle}>{disclaimers[0].title}</Text>
                  </View>
                  <Text style={s.disclaimerBody}>{disclaimers[0].body}</Text>
                </View>
              )}
            </View>
            {/* Remaining terms — each is wrap={false} so breaks only between terms */}
            {disclaimers.slice(1).map((d: any, i: number) => (
              <View key={d.id || (i + 1)} style={s.disclaimerBlock} wrap={false}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text style={s.disclaimerNumber}>{i + 2}.</Text>
                  <Text style={s.disclaimerTitle}>{d.title}</Text>
                </View>
                <Text style={s.disclaimerBody}>{d.body}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ═══ 8. EXCLUSIONS — Rule 7: One unbreakable block ═══ */}
        {/* Fix 2: minPresenceAhead pulls acceptance block onto same page if room */}
        {(exclusionsList.length > 0 || exclusionsHtml) && (
          <View style={{ marginBottom: sectionGap }} wrap={false} minPresenceAhead={200}>
            <Text style={s.sectionLabel}>Exclusions</Text>
            <Text style={{ fontSize: 8.5, color: c.label, fontStyle: 'italic', marginBottom: 6 }}>
              The following items are NOT included in this estimate:
            </Text>
            {exclusionsHtml ? <RichText html={exclusionsHtml} fontSize={9} color={c.textLight} lineHeight={1.5} /> : null}
            {exclusionsList.map((item: string, i: number) => (
              <View key={i} style={s.exclusionItem}>
                <Text style={s.exclusionBullet}>{'\u2022'}</Text>
                <Text style={s.exclusionText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ═══ 8B. RECOMMENDATIONS — optional ═══ */}
        {(recommendationsList.length > 0 || recommendationsHtml) && (
          <View style={{ marginBottom: sectionGap }} wrap={false}>
            <Text style={s.sectionLabel}>Recommendations</Text>
            <Text style={{ fontSize: 8.5, color: c.label, fontStyle: 'italic', marginBottom: 6 }}>
              Our suggestions for your consideration:
            </Text>
            {recommendationsHtml ? <RichText html={recommendationsHtml} fontSize={9.5} color={c.textMed} lineHeight={1.6} /> : null}
            {recommendationsList.map((item: string, i: number) => (
              <View key={i} style={{ flexDirection: 'row', marginBottom: 4, paddingLeft: 4 }}>
                <Text style={{ fontSize: 9, color: c.navy, width: 14, fontFamily: 'Helvetica-Bold' }}>{'\u2713'}</Text>
                <Text style={{ fontSize: 9.5, color: c.textMed, flex: 1, lineHeight: 1.6 }}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ═══ 9. ACCEPTANCE — Rule 6: One unbreakable block ═══ */}
        {!isQuickQuote && (
        <View style={s.acceptBox} wrap={false}>
          <Text style={s.sectionLabel}>Acceptance & Authorization</Text>
          <Text style={s.acceptIntro}>
            {isContract
              ? 'By signing below, you agree to enter into this construction contract with RO Unlimited Construction & Development for the work described above. This signed document constitutes a binding agreement subject to the terms and conditions stated herein.'
              : 'By signing below, you accept this estimate and authorize RO Unlimited Construction & Development to begin work as described above. This acceptance constitutes a binding agreement subject to the terms and conditions stated herein.'}
          </Text>
          <View style={s.sigRow}>
            <View style={s.sigCol}>
              <Text style={s.sigColLabel}>Client</Text>
              {estimate.signed_at && estimate.client_signature ? (
                <View>
                  {/* eslint-disable-next-line jsx-a11y/alt-text */}
                  <Image src={estimate.client_signature} style={{ width: 140, height: 40, objectFit: 'contain', marginBottom: 2 }} />
                  <View style={s.sigLine} />
                  <Text style={s.sigLabel}>Signature (signed electronically)</Text>
                  <View style={s.sigLineLight}>
                    <Text style={{ fontSize: 9, color: c.textMed }}>{estimate.signed_name}</Text>
                  </View>
                  <Text style={s.sigLabel}>Printed Name</Text>
                  <View style={s.sigLineLight}>
                    <Text style={{ fontSize: 9, color: c.textMed }}>{new Date(estimate.signed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>
                  </View>
                  <Text style={s.sigLabel}>Date</Text>
                </View>
              ) : (
                <View>
                  <View style={s.sigLine} />
                  <Text style={s.sigLabel}>Signature</Text>
                  <View style={s.sigLineLight}>
                    {customer && <Text style={{ fontSize: 9, color: c.textMed }}>{customer.first_name} {customer.last_name}</Text>}
                  </View>
                  <Text style={s.sigLabel}>Printed Name</Text>
                  <View style={s.sigLineLight} />
                  <Text style={s.sigLabel}>Date</Text>
                </View>
              )}
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
              <Svg width="58" height="58" viewBox="0 0 44 44">
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
        )}

        {/* Quick quote disclaimer — no signature block */}
        {isQuickQuote && (
          <View style={{ marginTop: sectionGap, padding: 16, backgroundColor: c.bgWarm, borderRadius: 3, borderWidth: 1, borderColor: c.border }} wrap={false}>
            <Text style={{ fontSize: 9, color: c.textLight, lineHeight: 1.7, fontStyle: 'italic' }}>
              This quick quote is provided for budgetary reference only and does not constitute a formal bid, proposal, or binding contract. Actual costs may vary based on site conditions, material availability, and scope changes. Contact us for a detailed estimate.
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <Text style={{ fontSize: 8, color: c.label }}>Valid for {validDays} days from date of issue</Text>
            </View>
          </View>
        )}

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
  options: any[] = [],
): Promise<Buffer> {
  const buffer = await renderToBuffer(
    <EstimatePDFDocument
      estimate={estimate}
      lineItems={lineItems}
      paymentSchedule={paymentSchedule}
      disclaimers={disclaimers}
      options={options}
    />
  );
  return Buffer.from(buffer);
}
