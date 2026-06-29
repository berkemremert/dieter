import { redirect } from 'next/navigation';

// Templates page simply redirects to plans with template filter
// This could be expanded into a dedicated page later
export default function TemplatesPage() {
  redirect('/plans?filter=template');
}
