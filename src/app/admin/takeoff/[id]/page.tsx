import { redirect } from 'next/navigation';

export default function TakeoffMoved({ params }: { params: { id: string } }) { redirect('/admin/nexabids/' + params.id); }
