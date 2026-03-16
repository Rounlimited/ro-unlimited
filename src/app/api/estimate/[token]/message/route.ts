import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

type RouteContext = { params: { token: string } };

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { token } = params;
    const { name, message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify token is valid
    const { data: estimate, error } = await supabase
      .from('estimates')
      .select('id, estimate_number, project_name, customer_id')
      .eq('share_token', token)
      .single();

    if (error || !estimate) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    // Insert admin notification
    await supabase.from('admin_notifications').insert({
      type: 'estimate_message',
      title: `Message on ${estimate.estimate_number}`,
      body: `${name || 'Customer'}: ${message}`,
      link: `/admin/estimates/${estimate.id}`,
      read: false,
    });

    // Send email notification to build@rounlimited.com
    try {
      await resend.emails.send({
        from: 'RO Unlimited <notifications@rounlimited.com>',
        to: 'build@rounlimited.com',
        subject: `Customer Message on Estimate ${estimate.estimate_number}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
            <h2 style="color:#C9A84C;margin-bottom:4px;">New Customer Message</h2>
            <p style="color:#666;margin-top:0;">Estimate ${estimate.estimate_number}${estimate.project_name ? ` — ${estimate.project_name}` : ''}</p>
            <div style="background:#f5f5f5;border-left:4px solid #C9A84C;padding:16px;border-radius:4px;margin:16px 0;">
              <p style="margin:0 0 8px;font-weight:600;color:#333;">${name || 'Customer'}</p>
              <p style="margin:0;color:#444;white-space:pre-wrap;">${message}</p>
            </div>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://rounlimited.com'}/admin/estimates/${estimate.id}"
               style="display:inline-block;background:#C9A84C;color:#000;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px;">
              View Estimate
            </a>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[estimate/message] Email notification failed:', emailErr);
      // Don't fail the request if email fails — notification is already saved
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[estimate/message] POST error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
