import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { COMPANY } from '@/lib/letters';

/**
 * Company letterhead. Logo and rule at the top, licenses along the bottom —
 * the things that make a page read as coming from a real licensed contractor.
 */

const LOGO_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/ro-unlimited-logo.png`;

const c = {
  ink: '#1a1a1a',
  body: '#2f2f2f',
  muted: '#6b7280',
  gold: '#8a6d20',
  rule: '#d8cba6',
  faint: '#e8e4da',
};

const s = StyleSheet.create({
  page: { paddingTop: 44, paddingBottom: 76, paddingHorizontal: 56, fontSize: 11, color: c.body, lineHeight: 1.55 },

  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  logo: { width: 168 },
  headRight: { alignItems: 'flex-end' },
  headLine: { fontSize: 9, color: c.muted },
  rule: { height: 2, backgroundColor: c.gold, marginBottom: 4 },
  ruleThin: { height: 0.75, backgroundColor: c.rule, marginBottom: 26 },

  date: { fontSize: 10.5, color: c.muted, marginBottom: 22 },

  toBlock: { marginBottom: 20 },
  toName: { fontSize: 11.5, color: c.ink, fontWeight: 'bold' },
  toLine: { fontSize: 11 },

  subjectRow: { flexDirection: 'row', marginBottom: 18 },
  subjectLabel: { fontSize: 11, color: c.gold, fontWeight: 'bold', marginRight: 6 },
  subject: { fontSize: 11, color: c.ink, fontWeight: 'bold', flex: 1 },

  para: { marginBottom: 12, textAlign: 'left' },

  closing: { marginTop: 26 },
  signLine: { width: 210, height: 0.75, backgroundColor: '#9ca3af', marginTop: 42, marginBottom: 5 },
  signName: { fontSize: 11, color: c.ink, fontWeight: 'bold' },
  signTitle: { fontSize: 10, color: c.muted },

  footer: {
    position: 'absolute', bottom: 30, left: 56, right: 56,
    borderTopWidth: 0.75, borderTopColor: c.faint, paddingTop: 8,
  },
  footLic: { fontSize: 7.5, color: c.muted, textAlign: 'center', lineHeight: 1.4 },
  footContact: { fontSize: 8, color: c.gold, textAlign: 'center', marginTop: 3 },
});

export interface LetterDoc {
  title?: string | null;
  subject?: string | null;
  recipient_name?: string | null;
  recipient_company?: string | null;
  recipient_address?: string | null;
  body: string;
  closing?: string | null;
  signer_name?: string | null;
  signer_title?: string | null;
  created_at?: string | null;
}

const longDate = (d?: string | null) =>
  new Date(d || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function LetterDocument({ letter }: { letter: LetterDoc }) {
  const paragraphs = (letter.body || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const addressLines = (letter.recipient_address || '').split('\n').map((l) => l.trim()).filter(Boolean);

  return (
    <Document title={letter.title || 'Letter'} author={COMPANY.name}>
      <Page size="LETTER" style={s.page}>
        {/* ── Letterhead ── */}
        <View style={s.head} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={LOGO_URL} style={s.logo} />
          <View style={s.headRight}>
            {COMPANY.address ? <Text style={s.headLine}>{COMPANY.address}</Text> : null}
            <Text style={s.headLine}>{COMPANY.phone}</Text>
            <Text style={s.headLine}>{COMPANY.email}</Text>
            <Text style={s.headLine}>{COMPANY.site}</Text>
          </View>
        </View>
        <View style={s.rule} fixed />
        <View style={s.ruleThin} fixed />

        <Text style={s.date}>{longDate(letter.created_at)}</Text>

        {(letter.recipient_name || letter.recipient_company || addressLines.length) ? (
          <View style={s.toBlock}>
            {letter.recipient_name ? <Text style={s.toName}>{letter.recipient_name}</Text> : null}
            {letter.recipient_company ? <Text style={s.toLine}>{letter.recipient_company}</Text> : null}
            {addressLines.map((l, i) => <Text key={i} style={s.toLine}>{l}</Text>)}
          </View>
        ) : null}

        {letter.subject ? (
          <View style={s.subjectRow}>
            <Text style={s.subjectLabel}>RE:</Text>
            <Text style={s.subject}>{letter.subject}</Text>
          </View>
        ) : null}

        {paragraphs.map((p, i) => <Text key={i} style={s.para}>{p}</Text>)}

        <View style={s.closing} wrap={false}>
          <Text>{letter.closing || 'Sincerely'},</Text>
          <View style={s.signLine} />
          <Text style={s.signName}>{letter.signer_name || COMPANY.signer}</Text>
          <Text style={s.signTitle}>{letter.signer_title || COMPANY.signerTitle}</Text>
          <Text style={s.signTitle}>{COMPANY.name}</Text>
        </View>

        {/* ── Licenses: the part that makes it read as official ── */}
        <View style={s.footer} fixed>
          <Text style={s.footLic}>
            Licensed &amp; Insured · {COMPANY.licenses.join(' · ')}
          </Text>
          <Text style={s.footContact}>
            {COMPANY.name} · {COMPANY.phone} · {COMPANY.site}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderLetterPDF(letter: LetterDoc): Promise<Buffer> {
  return renderToBuffer(<LetterDocument letter={letter} />);
}
