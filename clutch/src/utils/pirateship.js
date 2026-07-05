/**
 * Pirateship CSV Generator
 * Generates a CSV file compatible with Pirate Ship's spreadsheet upload.
 * Columns: Name, Address Line 1, Address Line 2, City, State, Zip Code, Country
 * Optional: Weight (lbs), Length (in), Width (in), Height (in), Order Ref
 */

// Default LEGO package config — user can override in Settings
const DEFAULT_PACKAGE = {
  weight_lbs: 0.5,
  length_in: 9,
  width_in: 6,
  height_in: 3,
};

/**
 * Parse a shipping address field from the API.
 * May be a JSON string (BrickLink format) or plain text.
 */
function parseAddress(raw) {
  if (!raw || typeof raw !== 'string' || raw.trim() === '') return null;

  // Try JSON first (BrickLink structured address)
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return {
        name: (parsed.name?.full || parsed.name || '').trim(),
        line1: (parsed.address1 || parsed.address || '').trim(),
        line2: (parsed.address2 || '').trim(),
        city: (parsed.city || '').trim(),
        state: (parsed.state || parsed.region || '').trim(),
        zip: (parsed.postal_code || parsed.zip || '').trim(),
        country: (parsed.country_code || parsed.country || 'US').trim(),
      };
    }
  } catch {
    // Not JSON — try line-by-line parsing
  }

  // Plain text fallback — split by newlines
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  // Heuristic: last line is usually "City, State Zip"
  const lastLine = lines[lines.length - 1];
  const cityStateZip = lastLine.match(/^(.+),\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/);

  if (cityStateZip) {
    const addressLines = lines.slice(0, -1);
    return {
      name: addressLines.length > 1 ? addressLines[0] : '',
      line1: addressLines.length > 1 ? addressLines[1] : addressLines[0],
      line2: addressLines.length > 2 ? addressLines.slice(2).join(', ') : '',
      city: cityStateZip[1].trim(),
      state: cityStateZip[2],
      zip: cityStateZip[3],
      country: 'US',
    };
  }

  // Can't parse — return raw
  return null;
}

/**
 * Generate a Pirate Ship-compatible CSV from orders.
 * @param {Array} orders - Order objects from the Hold API
 * @param {Object} packageConfig - Optional { weight_lbs, length_in, width_in, height_in }
 * @returns {string} CSV content
 */
export function generatePirateShipCSV(orders, packageConfig = {}) {
  const pkg = { ...DEFAULT_PACKAGE, ...packageConfig };

  // CSV header
  const headers = [
    'Name',
    'Address Line 1',
    'Address Line 2',
    'City',
    'State',
    'Zip Code',
    'Country',
    'Weight (lbs)',
    'Length (in)',
    'Width (in)',
    'Height (in)',
    'Order Ref',
  ];

  const rows = [headers];

  let skipped = 0;

  for (const order of orders) {
    const addr = parseAddress(order.shipping_address);

    if (!addr || !addr.line1) {
      skipped++;
      // Still include with whatever we have so user can fill in manually
      rows.push([
        `"${escapeCSV(order.buyer_name || '')}"`,
        `""`,
        `""`,
        `""`,
        `""`,
        `""`,
        `"US"`,
        pkg.weight_lbs,
        pkg.length_in,
        pkg.width_in,
        pkg.height_in,
        `"${escapeCSV(`#${order.order_id} (${order.marketplace})`)}"`,
      ]);
      continue;
    }

    rows.push([
      `"${escapeCSV(addr.name || order.buyer_name || '')}"`,
      `"${escapeCSV(addr.line1)}"`,
      `"${escapeCSV(addr.line2)}"`,
      `"${escapeCSV(addr.city)}"`,
      `"${escapeCSV(addr.state)}"`,
      `"${escapeCSV(addr.zip)}"`,
      `"${escapeCSV(addr.country || 'US')}"`,
      pkg.weight_lbs,
      pkg.length_in,
      pkg.width_in,
      pkg.height_in,
      `"${escapeCSV(`#${order.order_id} (${order.marketplace})`)}"`,
    ]);
  }

  const csv = rows.map(r => r.join(',')).join('\n');

  return { csv, total: orders.length, withAddress: orders.length - skipped, skipped };
}

function escapeCSV(str) {
  return (str || '').replace(/"/g, '""');
}

/**
 * Trigger a download of CSV content in the browser.
 */
export function downloadCSV(csvContent, filename = 'pirate-ship-orders.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
