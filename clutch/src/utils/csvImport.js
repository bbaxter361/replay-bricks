/**
 * CSV Import utility for Hold Inventory
 * Handles BrickLink XML export, standard CSV, and simple comma/tab formats
 */

/**
 * Parse a BrickLink XML order/inventory export
 * Extracts items with part_no, color_name, condition (NEW/USED), quantity
 */
function parseBrickLinkXML(text) {
  const items = [];
  // Match each <ITEM>...</ITEM> block
  const itemRegex = /<ITEM>([\s\S]*?)<\/ITEM>/gi;
  let match;
  while ((match = itemRegex.exec(text)) !== null) {
    const block = match[1];
    const getTag = (tag) => {
      const m = block.match(new RegExp(`<${tag}>(.*?)</${tag}>`, 'i'));
      return m ? m[1].trim() : '';
    };
    const item = {
      part_no: getTag('ITEMID') || getTag('ITEMNO'),
      part_name: getTag('ITEMNAME'),
      color_name: getTag('COLOR'),
      color_id: parseInt(getTag('COLORID')) || null,
      condition: getTag('CONDITION') === 'N' ? 'NEW' : 'USED',
      quantity: parseInt(getTag('QTY') || getTag('MINQTY')) || 1,
      unit_price_cents: null,
      location: getTag('REMARKS') || '',
    };
    if (item.part_no) items.push(item);
  }
  return items;
}

/**
 * Parse a standard CSV with headers.
 * Expected columns (case-insensitive): part_no/partno/itemid, color/color_name, condition, quantity/qty, price/unit_price, part_name/name/description, location/remarks
 */
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Map headers to canonical fields
  const map = {};
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i].toLowerCase().trim();
    if (h.includes('part') && (h.includes('no') || h.includes('id') || h.includes('item'))) map.part_no = i;
    else if (h === 'color' || h === 'color_name' || h === 'color_name') map.color_name = i;
    else if (h === 'color_id' || h === 'colour_id') map.color_id = i;
    else if (h === 'condition') map.condition = i;
    else if (h === 'quantity' || h === 'qty') map.quantity = i;
    else if (h === 'price' || h === 'unit_price' || h === 'price_cents') map.price = i;
    else if (h === 'part_name' || h === 'name' || h === 'description') map.part_name = i;
    else if (h === 'location' || h === 'remarks' || h === 'notes') map.location = i;
    else if (h === 'set_number' || h === 'set_no') map.set_number = i;
  }

  // Must have part_no at minimum
  if (map.part_no === undefined) {
    // Try to find a column that looks like a part number
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].toLowerCase().includes('item') || headers[i].toLowerCase().includes('part')) {
        map.part_no = i;
        break;
      }
    }
    if (map.part_no === undefined) return []; // Can't parse
  }

  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const partNo = (cols[map.part_no] || '').trim();
    if (!partNo) continue;

    const item = {
      part_no: partNo,
      part_name: map.part_name !== undefined ? (cols[map.part_name] || '').trim() : '',
      color_name: map.color_name !== undefined ? (cols[map.color_name] || '').trim() : '',
      color_id: map.color_id !== undefined ? parseInt(cols[map.color_id]) || null : null,
      condition: map.condition !== undefined ? ((cols[map.condition] || '').trim().toUpperCase() === 'NEW' ? 'NEW' : 'USED') : 'USED',
      quantity: map.quantity !== undefined ? (parseInt(cols[map.quantity]) || 1) : 1,
      unit_price_cents: map.price !== undefined ? Math.round(parseFloat(cols[map.price]) * 100) || null : null,
      location: map.location !== undefined ? (cols[map.location] || '').trim() : '',
    };
    items.push(item);
  }
  return items;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((ch === ',' || ch === '\t') && !inQuotes) {
      cols.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cols.push(current);
  return cols;
}

/**
 * Auto-detect format and parse file content
 * @param {string} text - File content
 * @param {string} filename - Original filename (hint)
 * @returns {Array} Parsed items
 */
export function parseInventoryImport(text, filename = '') {
  // Detect BrickLink XML
  if (text.includes('<INVENTORY>') || text.includes('<ITEM>')) {
    return parseBrickLinkXML(text);
  }

  // Detect CSV (has commas or tabs and multiple lines)
  if (text.includes(',') || text.includes('\t')) {
    return parseCSV(text);
  }

  // Fallback: try line-by-line simple format
  // Format: part_no,color,condition,quantity
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];

  const items = [];
  for (const line of lines) {
    const parts = line.split(/[,\t]+/);
    if (parts.length >= 2) {
      items.push({
        part_no: parts[0].trim(),
        part_name: '',
        color_name: parts.length > 1 ? parts[1].trim() : '',
        color_id: null,
        condition: parts.length > 2 ? (parts[2].trim().toUpperCase() === 'NEW' ? 'NEW' : 'USED') : 'USED',
        quantity: parts.length > 3 ? (parseInt(parts[3]) || 1) : 1,
        unit_price_cents: null,
        location: '',
      });
    }
  }
  return items;
}
