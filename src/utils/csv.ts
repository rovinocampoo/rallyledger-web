export function escapeCsvValue(value: string | number): string {
  const str = value === null || value === undefined ? "" : String(value);

  // If value contains any special CSV characters, wrap in double quotes
  // and escape existing double quotes by doubling them.
  if (/[",\n\r]/.test(str) || str.includes(",")) {
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return str;
}
