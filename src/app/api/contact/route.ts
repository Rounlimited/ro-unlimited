import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, projectType, message } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 });
    }

    const projectLabels: Record<string, string> = {
      residential: 'Residential / Custom Home',
      commercial: 'Commercial Build',
      grading: 'Land Grading / Site Prep',
      renovation: 'Renovation / Remodel',
      other: 'Other',
    };

    const projectLabel = projectType ? (projectLabels[projectType] || projectType) : 'Not specified';

    // Notification email to RO Unlimited
    await resend.emails.send({
      from: 'RO Unlimited Website <noreply@rounlimited.com>',
      to: ['Rounlimitedco@gmail.com'],
      subject: `New Project Inquiry — ${projectLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 32px; border-radius: 4px;">
          <div style="border-bottom: 2px solid #C9A84C; padding-bottom: 16px; margin-bottom: 24px;">
            <h1 style="color: #C9A84C; font-size: 24px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">RO Unlimited</h1>
            <p style="color: #888; margin: 4px 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">New Project Inquiry</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; width: 120px;">Name</td>
              <td style="padding: 10px 0; color: #ffffff; font-size: 15px;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Phone</td>
              <td style="padding: 10px 0; color: #C9A84C; font-size: 15px; font-weight: bold;">${phone}</td>
            </tr>
            ${email ? `<tr>
              <td style="padding: 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</td>
              <td style="padding: 10px 0; color: #ffffff; font-size: 15px;">${email}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Project Type</td>
              <td style="padding: 10px 0; color: #ffffff; font-size: 15px;">${projectLabel}</td>
            </tr>
            ${message ? `<tr>
              <td style="padding: 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; vertical-align: top;">Details</td>
              <td style="padding: 10px 0; color: #cccccc; font-size: 14px; line-height: 1.6;">${message.replace(/\n/g, '<br/>')}</td>
            </tr>` : ''}
          </table>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #333; color: #555; font-size: 11px;">
            Submitted via rounlimited.com contact form
          </div>
        </div>
      `,
    });

    // Auto-reply to prospect if they gave an email
    if (email) {
      await resend.emails.send({
        from: 'RO Unlimited <noreply@rounlimited.com>',
        to: [email],
        subject: 'We received your project inquiry',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #ffffff; padding: 32px; border-radius: 4px;">
            <div style="border-bottom: 2px solid #C9A84C; padding-bottom: 16px; margin-bottom: 24px;">
              <h1 style="color: #C9A84C; font-size: 24px; margin: 0; letter-spacing: 2px; text-transform: uppercase;">RO Unlimited</h1>
              <p style="color: #888; margin: 4px 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Construction &amp; Development</p>
            </div>
            <p style="font-size: 16px; color: #cccccc; line-height: 1.6;">Hi ${name},</p>
            <p style="font-size: 15px; color: #cccccc; line-height: 1.6;">We've received your project inquiry and will be in touch shortly.</p>
            <p style="font-size: 15px; color: #cccccc; line-height: 1.6;">In the meantime, feel free to reach us directly:</p>
            <div style="margin: 24px 0; padding: 20px; background: #111; border-left: 3px solid #C9A84C;">
              <p style="margin: 0 0 8px; color: #C9A84C; font-size: 18px; font-weight: bold;">(864) 304-0139</p>
              <p style="margin: 0; color: #888; font-size: 13px;">Rounlimitedco@gmail.com</p>
            </div>
            <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 32px;">
              — RO Unlimited Team<br/>
              <span style="color: #555;">Upstate South Carolina / 864</span>
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message. Please call us directly.' }, { status: 500 });
  }
}
