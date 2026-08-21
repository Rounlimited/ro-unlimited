import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

/**
 * Invoice PDF — same document brand as the estimate PDF and capability
 * statement (navy + orange on white, Helvetica) so RO's paper trail reads
 * as one company. Paid invoices render a PAID stamp and double as receipts.
 */

const LOGO_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/ro-unlimited-logo.png`;

const c = {
  navy: '#1B2A4A',
  orange: '#D4772C',
  green: '#1e9e5c',
  red: '#c0392b',
  text: '#1a1a1a',
  textMed: '#333333',
  label: '#777777',
  border: '#d4d4d4',
  borderLight: '#e8e8e8',
  bgSubtle: '#f7f7f5',
};

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, color: c.text, paddingTop: 30, paddingBottom: 60, paddingHorizontal: 46 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 3, borderBottomColor: c.orange, paddingBottom: 14, marginBottom: 16 },
  docTitle: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: c.navy, letterSpacing: 2 },
  invNum: { fontSize: 11, color: c.textMed, marginTop: 4 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.orange, textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 5 },
  twoCol: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  col: { flex: 1 },
  body: { fontSize: 10, color: c.textMed, lineHeight: 1.5 },
  tableHead: { flexDirection: 'row', backgroundColor: c.navy, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 2 },
  th: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 1 },
  row: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: c.borderLight },
  cellDesc: { flex: 1, fontSize: 10, color: c.textMed, paddingRight: 8 },
  cellNum: { width: 70, fontSize: 10, color: c.textMed, textAlign: 'right' },
  totalsBox: { marginLeft: 'auto', width: 230, marginTop: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3.5 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: c.navy, borderRadius: 3, paddingVertical: 8, paddingHorizontal: 10, marginTop: 5 },
  stamp: { position: 'absolute', top: 150, right: 60, transform: 'rotate(-18deg)', borderWidth: 3, borderColor: c.green, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 18, opacity: 0.85 },
  stampText: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: c.green, letterSpacing: 4 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 46, paddingBottom: 14, paddingTop: 6, borderTopWidth: 1, borderTopColor: c.border, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7.2, color: c.label, lineHeight: 1.4 },
});

const fmt$ = (n: any) => '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d: string | null) => (d ? new Date(d.includes('T') ? d : d + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—');

function InvoicePDFDocument({ invoice, payments }: { invoice: any; payments: any[] }) {
  const who = invoice.customer
    ? {
        name: invoice.customer.company_name || [invoice.customer.first_name, invoice.customer.last_name].filter(Boolean).join(' '),
        contact: invoice.customer.company_name ? [invoice.customer.first_name, invoice.customer.last_name].filter(Boolean).join(' ') : '',
        email: invoice.customer.email,
        phone: invoice.customer.phone,
        address: [invoice.customer.address, invoice.customer.city, invoice.customer.state, invoice.customer.zip].filter(Boolean).join(', '),
      }
    : {
        name: invoice.bill_to?.company || invoice.bill_to?.name || 'Customer',
        contact: invoice.bill_to?.company ? invoice.bill_to?.name || '' : '',
        email: invoice.bill_to?.email,
        phone: invoice.bill_to?.phone,
        address: invoice.bill_to?.address || '',
      };
  const balance = Number(invoice.total) - Number(invoice.amount_paid);
  const isPaid = invoice.status === 'paid';

  return (
    <Document title={`Invoice ${invoice.invoice_number}`} author="RO Unlimited Construction & Development">
      <Page size="LETTER" style={s.page} wrap>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.docTitle}>{isPaid ? 'RECEIPT' : 'INVOICE'}</Text>
            <Text style={s.invNum}>{invoice.invoice_number}</Text>
            {invoice.milestone_label ? <Text style={{ fontSize: 9, color: c.label, marginTop: 2 }}>{invoice.milestone_label}</Text> : null}
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={LOGO_URL} style={{ width: 130, height: 'auto' }} />
        </View>

        {isPaid && (
          <View style={s.stamp}>
            <Text style={s.stampText}>PAID</Text>
          </View>
        )}

        {/* Bill to + dates */}
        <View style={s.twoCol}>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Billed To</Text>
            <Text style={[s.body, { fontFamily: 'Helvetica-Bold' }]}>{who.name}</Text>
            {who.contact ? <Text style={s.body}>{who.contact}</Text> : null}
            {who.address ? <Text style={s.body}>{who.address}</Text> : null}
            {who.email ? <Text style={s.body}>{who.email}</Text> : null}
            {who.phone ? <Text style={s.body}>{who.phone}</Text> : null}
          </View>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Details</Text>
            {invoice.project_name ? <Text style={s.body}>Project: {invoice.project_name}</Text> : null}
            {invoice.project_address ? <Text style={s.body}>Site: {invoice.project_address}</Text> : null}
            <Text style={s.body}>Issued: {fmtDate(invoice.issued_date)}</Text>
            <Text style={[s.body, !isPaid && balance > 0 ? { fontFamily: 'Helvetica-Bold' } : {}]}>
              Due: {fmtDate(invoice.due_date)}
            </Text>
          </View>
        </View>

        {/* Line items */}
        <View style={s.tableHead}>
          <Text style={[s.th, { flex: 1 }]}>Description</Text>
          <Text style={[s.th, { width: 70, textAlign: 'right' }]}>Qty</Text>
          <Text style={[s.th, { width: 70, textAlign: 'right' }]}>Rate</Text>
          <Text style={[s.th, { width: 70, textAlign: 'right' }]}>Amount</Text>
        </View>
        {(invoice.line_items || []).map((li: any) => (
          <View key={li.id} style={s.row} wrap={false}>
            <Text style={s.cellDesc}>{li.description}</Text>
            <Text style={s.cellNum}>{li.quantity}{li.unit && li.unit !== 'each' ? ' ' + li.unit : ''}</Text>
            <Text style={s.cellNum}>{fmt$(li.unit_price)}</Text>
            <Text style={s.cellNum}>{fmt$(li.amount)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totalsBox}>
          {Number(invoice.tax_amount) > 0 && (
            <>
              <View style={s.totalRow}>
                <Text style={{ fontSize: 10, color: c.label }}>Subtotal</Text>
                <Text style={{ fontSize: 10, color: c.textMed }}>{fmt$(invoice.subtotal)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={{ fontSize: 10, color: c.label }}>Tax ({invoice.tax_percent}%)</Text>
                <Text style={{ fontSize: 10, color: c.textMed }}>{fmt$(invoice.tax_amount)}</Text>
              </View>
            </>
          )}
          <View style={s.totalRow}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: c.navy }}>Total</Text>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: c.navy }}>{fmt$(invoice.total)}</Text>
          </View>
          {Number(invoice.amount_paid) > 0 && (
            <View style={s.totalRow}>
              <Text style={{ fontSize: 10, color: c.green }}>Payments received</Text>
              <Text style={{ fontSize: 10, color: c.green }}>−{fmt$(invoice.amount_paid)}</Text>
            </View>
          )}
          <View style={s.balanceRow}>
            <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#fff' }}>
              {isPaid ? 'Paid in Full' : 'Balance Due'}
            </Text>
            <Text style={{ fontSize: 13, fontFamily: 'Helvetica-Bold', color: isPaid ? '#7fe0ae' : c.orange }}>
              {fmt$(isPaid ? 0 : balance)}
            </Text>
          </View>
        </View>

        {/* Payment history */}
        {payments.length > 0 && (
          <View style={{ marginTop: 16 }} wrap={false}>
            <Text style={s.sectionLabel}>Payment History</Text>
            {payments.map((p: any) => (
              <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 }}>
                <Text style={{ fontSize: 9.5, color: c.textMed }}>
                  {fmtDate(p.paid_date)} · {String(p.method || '').toUpperCase()}{p.reference ? ' ' + p.reference : ''}
                </Text>
                <Text style={{ fontSize: 9.5, color: c.green }}>{fmt$(p.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* How to pay */}
        {!isPaid && (
          <View style={{ marginTop: 16, backgroundColor: c.bgSubtle, borderRadius: 3, padding: 10 }} wrap={false}>
            <Text style={s.sectionLabel}>How to Pay</Text>
            <Text style={s.body}>
              {invoice.payment_instructions ||
                'Checks payable to RO Unlimited Construction & Development. For ACH or any payment questions, call (864) 304-0139.'}
            </Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes ? (
          <View style={{ marginTop: 14 }} wrap={false}>
            <Text style={s.sectionLabel}>Notes</Text>
            <Text style={s.body}>{invoice.notes}</Text>
          </View>
        ) : null}

        {/* Job photos — fm=jpg forced (react-pdf can't decode webp) */}
        {Array.isArray(invoice.photos) && invoice.photos.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={s.sectionLabel}>Job-Site Photos</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {invoice.photos.slice(0, 6).map((photo: any, i: number) => (
                <View key={i} wrap={false} style={{ width: '48%', marginBottom: 6 }}>
                  <Image
                    src={photo.url.includes('cdn.sanity.io')
                      ? `${photo.url}${photo.url.includes('?') ? '&' : '?'}w=800&fm=jpg`
                      : photo.url}
                    style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 3 }}
                  />
                  {photo.caption ? (
                    <Text style={{ fontSize: 8, color: c.label, marginTop: 2 }}>{photo.caption}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            RO Unlimited Construction & Development · (864) 304-0139 · rounlimited.com · Easley, SC
          </Text>
          <Text style={s.footerText}>GC #CLG 127704 · Licensed SC · NC · GA</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePDF(invoice: any, payments: any[] = []): Promise<Buffer> {
  return renderToBuffer(<InvoicePDFDocument invoice={invoice} payments={payments} />);
}
