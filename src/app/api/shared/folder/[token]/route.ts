import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createAdminClient();
  const { token } = params;

  const { data: share } = await supabase
    .from('folder_shares')
    .select('*')
    .eq('token', token)
    .single();

  if (!share) return NextResponse.json({ error: 'Link not found or expired' }, { status: 404 });

  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 });
  }

  // Increment access count
  await supabase.from('folder_shares').update({ accessed_count: (share.accessed_count || 0) + 1 }).eq('id', share.id);

  // Get files
  const { data: files } = await supabase
    .from('user_files')
    .select('id, original_filename, mime_type, file_size, telegram_file_id, folder')
    .eq('user_email', share.user_email)
    .like('folder', `${share.folder_path}%`)
    .order('original_filename');

  return NextResponse.json({
    folder_path: share.folder_path,
    user_email: share.user_email,
    permission: share.permission,
    files: files || [],
  });
}
