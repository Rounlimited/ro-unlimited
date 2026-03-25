import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import {
  RFP_PROJECT_TYPES,
  RFP_SCOPES,
  RFP_BUDGET_RANGES,
  RFP_REFERRAL_SOURCES,
  type RfpPayload,
} from '@/lib/rfp-contact';
import { sanityWriteClient } from '@/lib/sanity/client';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function labelFor<T extends { value: string; label: string }>(list: readonly T[], value: string): string {
  const hit = list.find((x) => x.value === value);
  return hit?.label || value || '—';
}

function subjectSafe(s: string, max = 100): string {
  return s.replace(/[\r\n]+/g, ' ').replace(/[^\w\s\-–—.,&$%()+/'`]/gi, '').trim().slice(0, max);
}

const NOTIFY_TO = ['build@rounlimited.com', 'Rounlimitedco@gmail.com'];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<RfpPayload> & Record<string, unknown>;

    const organizationName = String(body.organizationName ?? '').trim();
    const contactName = String(body.contactName ?? '').trim();
    const email = String(body.email ?? '').trim();
    const phone = String(body.phone ?? '').trim();
    const projectType = String(body.projectType ?? '').trim();
    const scope = String(body.scope ?? '').trim();
    const squareFootage = String(body.squareFootage ?? '').trim();
    const locationCityState = String(body.locationCityState ?? '').trim();
    const desiredStartDate = String(body.desiredStartDate ?? '').trim();
    const budgetRange = String(body.budgetRange ?? '').trim();
    const description = String(body.description ?? '').trim();
    const referralSource = String(body.referralSource ?? '').trim();

    if (!organizationName || !contactName || !email || !phone) {
      return NextResponse.json(
        { error: 'Company / organization, contact name, email, and phone are required.' },
        { status: 400 }
      );
    }
    if (!projectType || !scope) {
      return NextResponse.json({ error: 'Project type and scope are required.' }, { status: 400 });
    }

    const payload: RfpPayload = {
      organizationName,
      contactName,
      email,
      phone,
      projectType,
      scope,
      squareFootage,
      locationCityState,
      desiredStartDate,
      budgetRange,
      description,
      referralSource,
    };

    const ptLabel = labelFor(RFP_PROJECT_TYPES, projectType);
    const scopeLabel = labelFor(RFP_SCOPES, scope);
    const budgetLabel = labelFor(RFP_BUDGET_RANGES, budgetRange);
    const refLabel = labelFor(RFP_REFERRAL_SOURCES, referralSource);

    const row = (k: string, v: string) => `
      <tr>
        <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;width:200px;vertical-align:top;">${escapeHtml(k)}</td>
        <td style="padding:10px 0;color:#fff;font-size:15px;line-height:1.5;">${escapeHtml(v)}</td>
      </tr>`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;background:#1a1a1a;color:#fff;padding:32px;border-radius:4px;">
        <div style="border-bottom:2px solid #C9A84C;padding-bottom:16px;margin-bottom:24px;">
          <h1 style="color:#C9A84C;font-size:22px;margin:0;letter-spacing:2px;text-transform:uppercase;">Commercial RFP</h1>
          <p style="color:#888;margin:6px 0 0;font-size:12px;letter-spacing:1px;">RO Unlimited — site inquiry</p>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${row('Organization', organizationName)}
          ${row('Contact', contactName)}
          ${row('Email', email)}
          ${row('Phone', phone)}
          ${row('Project type', ptLabel)}
          ${row('Scope', scopeLabel)}
          ${squareFootage ? row('Est. square footage', squareFootage) : ''}
          ${locationCityState ? row('Location', locationCityState) : ''}
          ${desiredStartDate ? row('Desired start', desiredStartDate) : ''}
          ${budgetRange ? row('Budget range', budgetLabel) : ''}
          ${referralSource ? row('How they heard about us', refLabel) : ''}
          ${description ? `<tr>
            <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">Description</td>
            <td style="padding:10px 0;color:#ccc;font-size:14px;line-height:1.6;">${escapeHtml(description).replace(/\n/g, '<br/>')}</td>
          </tr>` : ''}
        </table>
        <div style="margin-top:28px;padding-top:16px;border-top:1px solid #333;color:#555;font-size:11px;">
          Submitted via rounlimited.com/contact (commercial RFP form)
        </div>
      </div>`;

    await resend.emails.send({
      from: 'RO Unlimited Website <noreply@rounlimited.com>',
      to: NOTIFY_TO,
      replyTo: email,
      subject: `Commercial RFP — ${subjectSafe(ptLabel)} — ${subjectSafe(organizationName, 60)}`,
      html,
    });

    const submittedFromHost =
      req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
      req.headers.get('host')?.trim() ||
      '';

    if (process.env.SANITY_API_WRITE_TOKEN) {
      try {
        await sanityWriteClient.create({
          _type: 'commercialRfp',
          organizationName,
          contactName,
          email,
          phone,
          projectType,
          scope,
          squareFootage,
          locationCityState,
          desiredStartDate,
          budgetRange,
          description,
          referralSource,
          status: 'new',
          notes: '',
          submittedAt: new Date().toISOString(),
          submittedFromHost,
        });
      } catch (sanityErr) {
        console.error('Commercial RFP Sanity create failed:', sanityErr);
      }
    } else {
      console.warn('SANITY_API_WRITE_TOKEN missing; commercial RFP not stored in Sanity');
    }

    if (email) {
      await resend.emails.send({
        from: 'RO Unlimited <noreply@rounlimited.com>',
        to: [email],
        subject: 'We received your RFP',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#1a1a1a;color:#fff;padding:32px;border-radius:4px;">
            <div style="border-bottom:2px solid #C9A84C;padding-bottom:16px;margin-bottom:24px;">
              <h1 style="color:#C9A84C;font-size:22px;margin:0;letter-spacing:2px;text-transform:uppercase;">RO Unlimited</h1>
              <p style="color:#888;margin:4px 0 0;font-size:12px;">Construction &amp; Development</p>
            </div>
            <p style="font-size:16px;color:#ccc;line-height:1.6;">Hi ${escapeHtml(contactName)},</p>
            <p style="font-size:15px;color:#ccc;line-height:1.6;">We received your commercial project request and will follow up shortly.</p>
            <div style="margin:24px 0;padding:20px;background:#111;border-left:3px solid #C9A84C;">
              <p style="margin:0 0 8px;color:#C9A84C;font-size:18px;font-weight:bold;">(864) 304-0139</p>
              <p style="margin:0;color:#888;font-size:13px;">build@rounlimited.com</p>
            </div>
            <p style="font-size:14px;color:#666;margin-top:28px;">— RO Unlimited Team</p>
          </div>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact RFP error:', error);
    return NextResponse.json({ error: 'Failed to send. Please call (864) 304-0139.' }, { status: 500 });
  }
}
