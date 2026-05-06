import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'hold.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    -- BrickLink catalog items (cached locally)
    CREATE TABLE IF NOT EXISTS bl_items (
      item_id TEXT NOT NULL,
      item_type TEXT NOT NULL DEFAULT 'PART',
      name TEXT,
      category_id INTEGER,
      category_name TEXT,
      year_released INTEGER,
      weight REAL,
      dim_x REAL,
      dim_y REAL,
      dim_z REAL,
      alternate_ids TEXT,
      image_url TEXT,
      thumbnail_url TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (item_id, item_type)
    );

    -- BrickLink catalog colors
    CREATE TABLE IF NOT EXISTS bl_colors (
      color_id INTEGER PRIMARY KEY,
      color_name TEXT NOT NULL,
      color_code TEXT,
      color_type TEXT
    );

    -- Our local inventory (unified from BL + BO + manual)
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      part_no TEXT NOT NULL,
      color_id INTEGER,
      part_name TEXT,
      part_category TEXT,
      part_image_url TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      location TEXT,
      condition TEXT DEFAULT 'USED',  -- 'NEW', 'USED'
      unit_price_cents INTEGER,  -- price in cents
      purchase_price_cents INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Marketplace-specific inventory lot tracking
    CREATE TABLE IF NOT EXISTS marketplace_lots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
      marketplace TEXT NOT NULL,  -- 'bricklink', 'brickowl'
      lot_id TEXT,                -- BL lot_id or BO lot_id
      quantity INTEGER NOT NULL DEFAULT 0,
      unit_price_cents INTEGER,
      condition TEXT,
      description TEXT,
      remarks TEXT,
      is_retired BOOLEAN DEFAULT 0,
      last_synced_at TEXT DEFAULT (datetime('now')),
      UNIQUE(marketplace, lot_id)
    );

    -- Orders from all marketplaces
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marketplace TEXT NOT NULL,  -- 'bricklink', 'brickowl'
      order_id TEXT NOT NULL,     -- marketplace order ID
      buyer_name TEXT,
      buyer_email TEXT,
      buyer_notes TEXT,
      status TEXT DEFAULT 'pending',  -- 'pending','paid','picked','packed','shipped','delivered','cancelled'
      total_items INTEGER DEFAULT 0,
      total_price_cents INTEGER,
      shipping_cents INTEGER,
      currency TEXT DEFAULT 'USD',
      shipping_address TEXT,
      order_date TEXT,
      paid_date TEXT,
      shipped_date TEXT,
      tracking_number TEXT,
      shipping_carrier TEXT,
      notes TEXT,
      last_synced_at TEXT DEFAULT (datetime('now')),
      UNIQUE(marketplace, order_id)
    );

    -- Individual items within an order
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      part_no TEXT NOT NULL,
      color_id INTEGER,
      part_name TEXT,
      quantity INTEGER NOT NULL,
      unit_price_cents INTEGER,
      condition TEXT,
      marketplace TEXT
    );

    -- Sync tracking
    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marketplace TEXT NOT NULL,
      sync_type TEXT NOT NULL,  -- 'inventory', 'orders', 'catalog'
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      status TEXT DEFAULT 'running',  -- 'running', 'success', 'failed'
      items_processed INTEGER DEFAULT 0,
      errors TEXT,
      details TEXT
    );

    -- Pricing rules
    CREATE TABLE IF NOT EXISTS pricing_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rule_type TEXT NOT NULL,  -- 'percentage', 'fixed', 'formula'
      marketplace TEXT,          -- NULL = all
      condition TEXT,           -- 'NEW', 'USED', NULL = both
      min_price_cents INTEGER,
      max_price_cents INTEGER,
      markup_percent REAL,
      markup_fixed_cents INTEGER,
      enabled BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- API credentials (encrypted at rest is ideal, but stored for now)
    CREATE TABLE IF NOT EXISTS api_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marketplace TEXT NOT NULL UNIQUE,  -- 'bricklink', 'brickowl'
      credentials TEXT NOT NULL,         -- JSON-encoded credentials
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Sync state for marketplace inventory (pagination cursors, etc.)
    CREATE TABLE IF NOT EXISTS sync_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      marketplace TEXT NOT NULL,
      state_key TEXT NOT NULL,     -- e.g. 'inventory_cursor', 'order_page'
      state_value TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(marketplace, state_key)
    );
  `);

  // Seed BL colors if empty
  const count = db.prepare('SELECT COUNT(*) as cnt FROM bl_colors').get();
  if (count.cnt === 0) {
    seedColors(db);
  }
}

function seedColors(db) {
  const colors = [
    [0, 'Not Applicable', '000000', 'UNKNOWN'],
    [1, 'White', 'FFFFFF', 'SOLID'],
    [2, 'Tan', 'E4CD9E', 'SOLID'],
    [3, 'Light Bluish Gray', 'A0A5A9', 'SOLID'],
    [4, 'Light Gray', 'C9C9C9', 'SOLID'],
    [5, 'Dark Gray', '6D6D6D', 'SOLID'],
    [6, 'Dark Bluish Gray', '6C6E6B', 'SOLID'],
    [7, 'Black', '1B2A34', 'SOLID'],
    [8, 'Dark Green', '00852B', 'SOLID'],
    [9, 'Green', '40A82D', 'SOLID'],
    [10, 'Dark Tan', '958A73', 'SOLID'],
    [11, 'Reddish Brown', '582A12', 'SOLID'],
    [12, 'Red', 'C91A09', 'SOLID'],
    [13, 'Dark Red', 'A2333B', 'SOLID'],
    [14, 'Dark Pink', 'E06D94', 'SOLID'],
    [15, 'Light Pink', 'FCBCCD', 'SOLID'],
    [23, 'Bright Light Blue', '81D4F1', 'SOLID'],
    [24, 'Blue', '0055BF', 'SOLID'],
    [25, 'Dark Blue', '0B3463', 'SOLID'],
    [26, 'Light Blue', 'ABCAE9', 'SOLID'],
    [27, 'Light Yellow', 'FFF89B', 'SOLID'],
    [28, 'Yellow', 'FFD800', 'SOLID'],
    [29, 'Dark Yellow', 'DAB078', 'SOLID'],
    [36, 'Light Purple', 'CF98CF', 'SOLID'],
    [37, 'Purple', '7A3B78', 'SOLID'],
    [38, 'Dark Purple', '4E2561', 'SOLID'],
    [39, 'Orange', 'F1682D', 'SOLID'],
    [40, 'Dark Orange', 'A86738', 'SOLID'],
    [41, 'Magenta', 'BD6CAD', 'SOLID'],
    [42, 'Lime', 'AADD4A', 'SOLID'],
    [43, 'Dark Pink', 'C8707A', 'SOLID'],
    [44, 'Flesh', 'FCC5A0', 'SOLID'],
    [45, 'Light Flesh', 'FEDCBA', 'SOLID'],
    [46, 'Flesh Medium', 'FBA979', 'SOLID'],
    [47, 'Flesh Dark', 'C58C6B', 'SOLID'],
    [48, 'Flat Dark Gold', 'B4835A', 'SOLID'],
    [57, 'Pearl Gold', 'DCAA5C', 'SOLID'],
    [61, 'Pearl Light Gold', 'F9DC8C', 'SOLID'],
    [68, 'Dark Brown', '352100', 'SOLID'],
    [69, 'Metallic Silver', 'A5A9B4', 'SOLID'],
    [70, 'Metallic Gold', 'DDB078', 'SOLID'],
    [71, 'Glitter Trans-Clear', 'D2D9C1', 'TRNSL'],
    [72, 'Glitter Trans-Purple', 'B090B8', 'TRNSL'],
    [73, 'Trans-Clear', 'F5F3D7', 'TRNSL'],
    [74, 'Trans-Red', 'C91A09', 'TRNSL'],
    [75, 'Trans-Light Blue', 'AADBF5', 'TRNSL'],
    [76, 'Trans-Neon Green', 'C0E6A7', 'TRNSL'],
    [77, 'Trans-Green', '57AB27', 'TRNSL'],
    [78, 'Trans-Yellow', 'F5E99B', 'TRNSL'],
    [79, 'Trans-Orange', 'F08F1C', 'TRNSL'],
    [80, 'Trans-Pink', 'E6A7D6', 'TRNSL'],
    [82, 'Trans-Purple', '9678B6', 'TRNSL'],
    [84, 'Trans-Neon Yellow', 'E5F67F', 'TRNSL'],
    [85, 'Trans-Neon Orange', 'FF9300', 'TRNSL'],
    [86, 'Trans-Black', '1B2A34', 'TRNSL'],
    [89, 'Trans-Dark Blue', '0B3463', 'TRNSL'],
    [92, 'Chrome Gold', 'C0A679', 'CHROME'],
    [93, 'Chrome Silver', 'CDCDCD', 'CHROME'],
    [94, 'Chrome Black', '1B2A34', 'CHROME'],
    [95, 'Chrome Blue', '4B6D8A', 'CHROME'],
    [96, 'Chrome Antique Brass', '645A4C', 'CHROME'],
    [97, 'Chrome Pink', 'D98DA5', 'CHROME'],
    [98, 'Chrome Green', '4B6D4B', 'CHROME'],
    [99, 'Pearl White', 'F5F5F5', 'PEARL'],
    [100, 'Pearl Light Gray', '9CA3A8', 'PEARL'],
    [101, 'Flat Silver', '898788', 'METAL'],
    [102, 'Pearl Dark Gray', '575857', 'PEARL'],
    [103, 'Metal Blue', '49678C', 'METAL'],
    [104, 'Copper', 'AE7A59', 'METAL'],
    [105, 'Glow In Dark Opaque', 'D4D4C0', 'SOLID'],
    [110, 'Glow In Dark Trans', 'BCD9CD', 'TRNSL'],
    [111, 'Satin Trans-Clear', 'EAE6D8', 'SA'],
    [112, 'Satin Trans-Light Blue', '9DCADB', 'SA'],
    [113, 'Satin Trans-Dark Blue', '3D5C8A', 'SA'],
    [114, 'Satin Trans-Green', '4B8A4B', 'SA'],
    [115, 'Satin Trans-Pink', 'DAB0D0', 'SA'],
    [116, 'Satin Trans-Purple', '8A6B9C', 'SA'],
    [117, 'Satin Trans-Orange', 'D98A3B', 'SA'],
    [118, 'Satin Trans-Yellow', 'F0D88A', 'SA'],
    [119, 'Satin Trans-Red', 'C95A3B', 'SA'],
    [120, 'Satin Trans-Black', '2A3A3A', 'SA'],
    [121, 'Satin Trans-Neon Green', 'A0D68A', 'SA'],
    [122, 'Satin Trans-Neon Yellow', 'D0E88A', 'SA'],
    [125, 'Satin Trans-Very Light Pink', 'F0D0D8', 'SA'],
    [126, 'Satin Trans-Light Pink', 'E8B0C0', 'SA'],
    [127, 'Satin Trans-Neon Orange', 'F0A03B', 'SA'],
    [128, 'Satin Trans-Dark Pink', 'D88A9C', 'SA'],
    [129, 'Satin Trans-Brown', '6B4A3A', 'SA'],
    [130, 'Satin Trans-Light Green', '8AB88A', 'SA'],
    [131, 'Satin Trans-Light Orange', 'F0C08A', 'SA'],
    [132, 'Satin Trans-Pink Red', 'D86A6A', 'SA'],
    [133, 'Satin Trans-Dark Purple', '6A4A7A', 'SA'],
    [134, 'Satin Trans-Neon Blue', '6A9AC0', 'SA'],
    [135, 'Satin Trans-Very Light Blue', 'B0C8D8', 'SA'],
    [136, 'Satin Trans-Light Purple', 'B8A0C8', 'SA'],
    [137, 'Satin Trans-Dark Green', '3A6A3A', 'SA'],
    [138, 'Satin Trans-Teal', '4A8A8A', 'SA'],
    [139, 'Satin Trans-Light Royal Blue', '6A8AC0', 'SA'],
    [140, 'Satin Trans-Dark Royal Blue', '3A4A7A', 'SA'],
    [141, 'Satin Trans-Neon Pink', 'E88A9C', 'SA'],
    [142, 'Satin Trans-Light Pink Red', 'D8A0A0', 'SA'],
    [143, 'Satin Trans-Dark Pink Red', 'B06A6A', 'SA'],
    [144, 'Satin Trans-Medium Pink', 'C88A9C', 'SA'],
    [145, 'Satin Trans-Medium Purple', '9A6A9A', 'SA'],
    [146, 'Satin Trans-Medium Blue', '6A8AC0', 'SA'],
    [147, 'Satin Trans-Medium Green', '6A9A6A', 'SA'],
    [148, 'Satin Trans-Medium Orange', 'D88A4A', 'SA'],
    [149, 'Satin Trans-Medium Yellow', 'D8C06A', 'SA'],
    [150, 'Satin Trans-Medium Red', 'C06A5A', 'SA'],
    [151, 'Satin Trans-Very Light Purple', 'B8A0B8', 'SA'],
    [152, 'Satin Trans-Medium Dark Pink', 'C08A9C', 'SA'],
    [153, 'Satin Trans-Medium Light Pink', 'D0A0B0', 'SA'],
    [154, 'Satin Trans-Very Light Pink Red', 'D8B0B0', 'SA'],
    [155, 'Satin Trans-Medium Dark Purple', '8A5A7A', 'SA'],
    [156, 'Satin Trans-Light Violet', 'A080A0', 'SA'],
    [157, 'Satin Trans-Violet', '8A6A8A', 'SA'],
    [158, 'Satin Trans-Royal Blue', '4A5A8A', 'SA'],
    [159, 'Satin Trans-Teal Blue', '4A7A8A', 'SA'],
    [160, 'Satin Trans-Lime', '8AA84A', 'SA'],
    [161, 'Satin Trans-Dark Lime', '6A8A3A', 'SA'],
    [162, 'Satin Trans-Brown Red', '6A4A4A', 'SA'],
    [163, 'Satin Trans-Pearl Gold', 'D0A85A', 'SA'],
    [164, 'Satin Trans-Pearl Silver', 'A0A0A0', 'SA'],
    [165, 'Satin Trans-Pearl Copper', 'B0805A', 'SA'],
    [166, 'Satin Trans-Pearl Bronze', '8A705A', 'SA'],
    [167, 'Satin Trans-Pearl Gray', '8A8A8A', 'SA'],
    [168, 'Satin Trans-Pearl Blue', '6A7A9A', 'SA'],
    [169, 'Satin Trans-Pearl Green', '6A8A6A', 'SA'],
    [170, 'Satin Trans-Pearl Red', '8A5A5A', 'SA'],
    [171, 'Satin Trans-Pearl Yellow', 'B0A06A', 'SA'],
    [172, 'Satin Trans-Pearl Orange', 'B08A4A', 'SA'],
    [173, 'Satin Trans-Pearl Pink', 'C08A8A', 'SA'],
    [174, 'Satin Trans-Pearl Purple', '9A7A9A', 'SA'],
    [175, 'Satin Trans-Pearl Black', '3A3A3A', 'SA'],
    [176, 'Satin Trans-Pearl White', 'D0D0D0', 'SA'],
    [177, 'Satin Trans-Pearl Light Gray', 'A0A0A0', 'SA'],
    [178, 'Satin Trans-Pearl Dark Gray', '6A6A6A', 'SA'],
    [179, 'Satin Trans-Pearl Tan', 'B0A08A', 'SA'],
    [180, 'Satin Trans-Pearl Dark Tan', '8A7A6A', 'SA'],
    [181, 'Satin Trans-Pearl Lime', '8AA06A', 'SA'],
    [182, 'Satin Trans-Pearl Dark Green', '4A6A4A', 'SA'],
    [183, 'Satin Trans-Pearl Dark Blue', '3A4A6A', 'SA'],
    [184, 'Satin Trans-Pearl Dark Purple', '5A3A5A', 'SA'],
    [185, 'Satin Trans-Pearl Dark Red', '6A3A3A', 'SA'],
    [186, 'Satin Trans-Pearl Dark Orange', '7A4A2A', 'SA'],
    [187, 'Satin Trans-Pearl Dark Pink', '8A5A6A', 'SA'],
    [188, 'Satin Trans-Pearl Dark Brown', '4A3A2A', 'SA'],
    [189, 'Satin Trans-Pearl Dark Gray Blue', '4A5A6A', 'SA'],
    [190, 'Satin Trans-Pearl Dark Gray Green', '4A6A5A', 'SA'],
    [191, 'Satin Trans-Pearl Dark Gray Purple', '5A4A6A', 'SA'],
    [192, 'Satin Trans-Pearl Dark Gray Red', '6A4A4A', 'SA'],
    [193, 'Satin Trans-Pearl Dark Gray Orange', '6A5A3A', 'SA'],
    [194, 'Satin Trans-Pearl Dark Gray Pink', '6A4A5A', 'SA'],
    [195, 'Satin Trans-Pearl Dark Gray Brown', '4A3A3A', 'SA'],
    [196, 'Satin Trans-Pearl Light Gray Blue', '7A8A9A', 'SA'],
    [197, 'Satin Trans-Pearl Light Gray Green', '7A9A7A', 'SA'],
    [198, 'Satin Trans-Pearl Light Gray Purple', '8A7A9A', 'SA'],
    [199, 'Satin Trans-Pearl Light Gray Red', '9A7A7A', 'SA'],
    [200, 'Satin Trans-Pearl Light Gray Orange', '9A8A6A', 'SA'],
    [201, 'Satin Trans-Pearl Light Gray Pink', '9A7A8A', 'SA'],
    [202, 'Satin Trans-Pearl Light Gray Brown', '7A6A5A', 'SA'],
    [203, 'Satin Trans-Pearl Medium Gray', '8A8A8A', 'SA'],
    [204, 'Satin Trans-Pearl Medium Blue', '6A7A9A', 'SA'],
    [205, 'Satin Trans-Pearl Medium Green', '6A8A6A', 'SA'],
    [206, 'Satin Trans-Pearl Medium Purple', '8A7A9A', 'SA'],
    [207, 'Satin Trans-Pearl Medium Red', '8A6A6A', 'SA'],
    [208, 'Satin Trans-Pearl Medium Orange', '8A7A5A', 'SA'],
    [209, 'Satin Trans-Pearl Medium Pink', '9A7A8A', 'SA'],
    [210, 'Satin Trans-Pearl Medium Brown', '6A5A4A', 'SA'],
    [211, 'Satin Trans-Pearl Medium Gray Blue', '6A7A8A', 'SA'],
    [212, 'Satin Trans-Pearl Medium Gray Green', '6A8A7A', 'SA'],
    [213, 'Satin Trans-Pearl Medium Gray Purple', '7A6A8A', 'SA'],
    [214, 'Satin Trans-Pearl Medium Gray Red', '8A6A6A', 'SA'],
    [215, 'Satin Trans-Pearl Medium Gray Orange', '8A7A5A', 'SA'],
    [216, 'Satin Trans-Pearl Medium Gray Pink', '8A6A7A', 'SA'],
    [217, 'Satin Trans-Pearl Medium Gray Brown', '6A5A5A', 'SA'],
    [218, 'Satin Trans-Pearl Dark Gray Blue Green', '4A6A6A', 'SA'],
    [219, 'Satin Trans-Pearl Dark Gray Purple Pink', '5A4A6A', 'SA'],
    [220, 'Satin Trans-Pearl Dark Gray Red Orange', '6A4A4A', 'SA'],
    [221, 'Satin Trans-Pearl Medium Gray Blue Green', '6A7A7A', 'SA'],
    [222, 'Satin Trans-Pearl Medium Gray Purple Pink', '7A6A8A', 'SA'],
    [223, 'Satin Trans-Pearl Medium Gray Red Orange', '8A6A5A', 'SA'],
    [224, 'Satin Trans-Pearl Light Gray Blue Green', '8A9A9A', 'SA'],
    [225, 'Satin Trans-Pearl Light Gray Purple Pink', '9A8AAA', 'SA'],
    [226, 'Satin Trans-Pearl Light Gray Red Orange', '9A8A7A', 'SA'],
    [227, 'Satin Trans-Pearl Very Light Gray', 'B0B0B0', 'SA'],
    [228, 'Satin Trans-Pearl Very Light Blue', 'A0B0C0', 'SA'],
    [229, 'Satin Trans-Pearl Very Light Green', 'A0C0A0', 'SA'],
    [230, 'Satin Trans-Pearl Very Light Purple', 'B0A0C0', 'SA'],
    [231, 'Satin Trans-Pearl Very Light Red', 'C0A0A0', 'SA'],
    [232, 'Satin Trans-Pearl Very Light Orange', 'C0B090', 'SA'],
    [233, 'Satin Trans-Pearl Very Light Pink', 'C0A0B0', 'SA'],
    [234, 'Satin Trans-Pearl Very Light Brown', 'A09080', 'SA'],
    [235, 'Satin Trans-Pearl Dark Gray Blue', '4A5A6A', 'SA'],
    [236, 'Satin Trans-Pearl Dark Gray Green', '4A6A5A', 'SA'],
    [237, 'Satin Trans-Pearl Dark Gray Purple', '5A4A6A', 'SA'],
    [238, 'Satin Trans-Pearl Dark Gray Red', '6A4A4A', 'SA'],
    [239, 'Satin Trans-Pearl Dark Gray Orange', '6A5A3A', 'SA'],
    [240, 'Satin Trans-Pearl Dark Gray Pink', '6A4A5A', 'SA'],
    [241, 'Satin Trans-Pearl Dark Gray Brown', '4A3A3A', 'SA'],
    [242, 'Satin Trans-Pearl Medium Gray Blue', '6A7A9A', 'SA'],
    [243, 'Satin Trans-Pearl Medium Gray Green', '6A8A6A', 'SA'],
    [244, 'Satin Trans-Pearl Medium Gray Purple', '7A6A8A', 'SA'],
    [245, 'Satin Trans-Pearl Medium Gray Red', '8A6A6A', 'SA'],
    [246, 'Satin Trans-Pearl Medium Gray Orange', '8A7A5A', 'SA'],
    [247, 'Satin Trans-Pearl Medium Gray Pink', '8A6A7A', 'SA'],
    [248, 'Satin Trans-Pearl Medium Gray Brown', '6A5A5A', 'SA'],
    [249, 'Satin Trans-Pearl Light Gray Blue', '8A9AAA', 'SA'],
    [250, 'Satin Trans-Pearl Light Gray Green', '8AAA8A', 'SA'],
    [251, 'Satin Trans-Pearl Light Gray Purple', '9A8AAA', 'SA'],
    [252, 'Satin Trans-Pearl Light Gray Red', 'AA8A8A', 'SA'],
    [253, 'Satin Trans-Pearl Light Gray Orange', 'AA9A7A', 'SA'],
    [254, 'Satin Trans-Pearl Light Gray Pink', 'AA8A9A', 'SA'],
    [255, 'Satin Trans-Pearl Light Gray Brown', '8A7A6A', 'SA']
  ];

  const insert = db.prepare('INSERT OR IGNORE INTO bl_colors (color_id, color_name, color_code, color_type) VALUES (?, ?, ?, ?)');
  for (const c of colors) {
    insert.run(...c);
  }
}
