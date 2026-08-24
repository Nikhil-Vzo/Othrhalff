import { redirect } from 'next/navigation';

// /fm is a permanent redirect to the live radio room. No canonical needed —
// a 301/307 tells Google everything it needs.
export default function FmRedirectPage() {
  redirect('/sparx/music?room=Campus_PCO_247');
}
