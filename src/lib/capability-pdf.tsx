import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';
import { COMPANY } from '@/lib/constants';

/**
 * Capability statement — the one-page prequal sheet a GC's estimator drops
 * into a vendor packet. Same document brand as the estimate PDF (navy +
 * orange on white, Helvetica). Everything on it is owner-confirmed: the
 * seven license classifications, the three license numbers off the Utility
 * Division badge, and the tri-state footprint. No invented numbers — no
 * bonding capacity, EMR, or GL limits until JR supplies them; those are
 * "furnished on request."
 */

const LOGO_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/ro-unlimited-logo.png`;
const BADGE_URL = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/images/utilities/utility-division-badge.png`;

const c = {
  navy: '#1B2A4A',
  orange: '#D4772C',
  text: '#1a1a1a',
  textMed: '#333333',
  label: '#777777',
  border: '#d4d4d4',
  borderLight: '#e8e8e8',
  bgSubtle: '#f7f7f5',
  white: '#ffffff',
};

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 9.5, color: c.text, paddingTop: 26, paddingBottom: 30, paddingHorizontal: 44 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 3, borderBottomColor: c.orange, paddingBottom: 12, marginBottom: 14 },
  docTitle: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: c.navy, letterSpacing: 1.5 },
  docSub: { fontSize: 8, color: c.label, marginTop: 3, letterSpacing: 0.5 },
  sectionLabel: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: c.orange, textTransform: 'uppercase', letterSpacing: 1.8, marginBottom: 6 },
  block: { marginBottom: 13 },
  body: { fontSize: 9.5, color: c.textMed, lineHeight: 1.55 },
  twoCol: { flexDirection: 'row', gap: 18 },
  col: { flex: 1 },
  licRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.borderLight, paddingVertical: 4.5 },
  licName: { flex: 1, fontSize: 9.5, color: c.textMed },
  licNum: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: c.navy },
  bullet: { flexDirection: 'row', marginBottom: 3.5 },
  bulletDot: { width: 10, fontSize: 9.5, color: c.orange },
  bulletText: { flex: 1, fontSize: 9.5, color: c.textMed, lineHeight: 1.45 },
  statStrip: { flexDirection: 'row', backgroundColor: c.navy, borderRadius: 3, paddingVertical: 10, paddingHorizontal: 8, marginBottom: 14 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: c.orange },
  statLabel: { fontSize: 6.8, color: '#c9d2e4', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 44, paddingBottom: 12, paddingTop: 6, borderTopWidth: 1, borderTopColor: c.border, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 7.2, color: c.label, lineHeight: 1.4 },
});

const LICENSES: Array<{ name: string; num?: string }> = [
  { name: 'General Contractor — Building', num: 'CLG 127704' },
  { name: 'Onsite Wastewater (Septic)', num: 'OSWW10837' },
  { name: 'Mechanical', num: 'CLM119115' },
  { name: 'Water & Sewer Lines' },
  { name: 'Boring & Tunneling' },
  { name: 'Highway — Roads & Bridges' },
  { name: 'Grading' },
  { name: 'Specialty Concrete' },
  { name: 'Specialty Masonry' },
];

const UTILITIES_CAPS = [
  'Water main taps & hot taps on live mains',
  'Ductile iron & C900 water lines — domestic and fire',
  'Sanitary sewer mains, laterals & manholes',
  'Storm drainage systems & structures',
  'Tier 2 commercial septic systems',
  'Grease interceptors & traps',
];

const SITE_CAPS = [
  'Site development, clearing & mass grading',
  'Commercial construction — ground-up & buildouts',
  'Specialty concrete & masonry',
  'Full-service repairs division',
];

function CapabilityDoc() {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return (
    <Document title="RO Unlimited — Capability Statement" author={COMPANY.fullName}>
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.docTitle}>CAPABILITY STATEMENT</Text>
            <Text style={s.docSub}>{COMPANY.fullName} · Prepared {today}</Text>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={LOGO_URL} style={{ width: 120, height: 'auto' }} />
        </View>

        {/* Stat strip */}
        <View style={s.statStrip}>
          {[
            ['25+', 'Years Building'],
            ['9', 'State Licenses Held'],
            ['3', 'States Licensed'],
            ['100%', 'Utilities Self-Performed'],
          ].map(([v, l]) => (
            <View key={l} style={s.stat}>
              <Text style={s.statVal}>{v}</Text>
              <Text style={s.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Who we are */}
        <View style={s.block}>
          <Text style={s.sectionLabel}>Company</Text>
          <Text style={s.body}>
            {COMPANY.fullName} is a self-performing sitework, underground utility, and construction
            contractor based in Easley, South Carolina. Our crews and equipment handle the full
            path from first cut to finished build — land development, underground utilities, and
            vertical construction — under one contract with one accountable contractor. Licensed in
            South Carolina, North Carolina, and Georgia; the Greenville–Easley market is home
            ground and we mobilize across all three states.
          </Text>
        </View>

        {/* Licenses + capabilities side by side */}
        <View style={[s.twoCol, s.block]}>
          <View style={s.col}>
            <Text style={s.sectionLabel}>Licenses & Credentials</Text>
            {LICENSES.map((l) => (
              <View key={l.name} style={s.licRow}>
                <Text style={s.licName}>{l.name}</Text>
                {l.num ? <Text style={s.licNum}>#{l.num}</Text> : null}
              </View>
            ))}
            <Text style={{ fontSize: 8, color: c.label, marginTop: 6, lineHeight: 1.5 }}>
              Licensed in SC, NC & GA. Fully insured — certificates of insurance and license
              documentation furnished on request for prequalification and lender packages.
            </Text>
          </View>

          <View style={s.col}>
            <Text style={s.sectionLabel}>Self-Performed Utilities</Text>
            {UTILITIES_CAPS.map((t) => (
              <View key={t} style={s.bullet}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletText}>{t}</Text>
              </View>
            ))}
            <Text style={[s.sectionLabel, { marginTop: 8 }]}>Sitework & Construction</Text>
            {SITE_CAPS.map((t) => (
              <View key={t} style={s.bullet}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={s.bulletText}>{t}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Differentiators */}
        <View style={[s.block, { backgroundColor: c.bgSubtle, borderRadius: 3, padding: 10 }]}>
          <Text style={s.sectionLabel}>Why GCs & Developers Use RO</Text>
          <View style={s.twoCol}>
            <View style={s.col}>
              <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>Sitework and the underground package under one contractor — the critical path never waits on a sub</Text></View>
              <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>Every utility run photographed before backfill — permanent as-built documentation</Text></View>
            </View>
            <View style={s.col}>
              <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>License classifications most GCs don&apos;t hold — live-main taps, onsite wastewater, boring</Text></View>
              <View style={s.bullet}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>Send plans and specs — scoped bids returned fast, with current authority fee schedules built in</Text></View>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={s.block}>
          <Text style={s.sectionLabel}>Contact</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={[s.body, { fontFamily: 'Helvetica-Bold', color: c.navy }]}>{COMPANY.phone}</Text>
              <Text style={s.body}>{COMPANY.email}</Text>
              <Text style={s.body}>rounlimited.com · Easley, SC</Text>
              <Text style={{ fontSize: 8, color: c.label, marginTop: 4 }}>
                References and project history available on request.
              </Text>
            </View>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={BADGE_URL} style={{ width: 86, height: 86 }} />
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{COMPANY.fullName} — Capability Statement</Text>
          <Text style={s.footerText}>GC #CLG 127704 · OSWW #OSWW10837 · Mech #CLM119115</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCapabilityPdf(): Promise<Buffer> {
  return renderToBuffer(<CapabilityDoc />);
}
