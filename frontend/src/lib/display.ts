export function joinName(first?: string, last?: string) {
  return [first, last].filter(Boolean).join(' ').trim() || '-';
}
