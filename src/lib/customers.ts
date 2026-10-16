/**
 * JR says "Miller" or "Hartwell Ridge LLC" — that's a customer. Accept a full
 * name, a single name, or just a company; the first/last split is ours to do.
 */
export function resolveCustomerName(body: any): { first_name: string; last_name: string; company_name: string | null } | null {
  const clean = (v: any) => String(v ?? '').trim();
  let first = clean(body.first_name), last = clean(body.last_name);
  const company = clean(body.company_name) || null;
  if (!first && !last && body.name) {
    const parts = clean(body.name).split(/\s+/).filter(Boolean);
    first = parts[0] || ''; last = parts.slice(1).join(' ');
  }
  if (!first && last) { first = last; last = ''; }
  if (!first && company) first = company;
  if (!first) return null;
  return { first_name: first, last_name: last, company_name: company };
}
