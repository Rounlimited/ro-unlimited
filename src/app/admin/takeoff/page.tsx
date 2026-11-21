import { redirect } from 'next/navigation';

/** Bid from Plans moved into its own section, NexaBids. Old links land there. */
export default function TakeoffMoved() { redirect('/admin/nexabids'); }
