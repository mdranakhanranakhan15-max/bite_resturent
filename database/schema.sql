-- ============================================================================
-- Bite POS — MySQL 8+ schema
-- Import:  mysql -u root -p < database/schema.sql
-- ============================================================================
CREATE DATABASE IF NOT EXISTS bite_pos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bite_pos;
SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  role ENUM('admin', 'manager', 'cashier', 'waiter', 'chef') NOT NULL DEFAULT 'waiter',
  pin_hash VARCHAR(255) DEFAULT NULL,
  shift VARCHAR(60) DEFAULT NULL,
  phone VARCHAR(40) DEFAULT NULL,
  email VARCHAR(160) DEFAULT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME(3) DEFAULT NULL,
  updated_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_users_role (role),
  KEY idx_users_active (active),
  KEY idx_users_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(80) NOT NULL,
  letter VARCHAR(4) DEFAULT NULL,
  tint VARCHAR(16) DEFAULT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) DEFAULT NULL,
  updated_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_categories_name (name),
  KEY idx_categories_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(64) NOT NULL,
  name VARCHAR(120) NOT NULL,
  unit VARCHAR(16) NOT NULL DEFAULT 'piece',
  stock DECIMAL(14,3) NOT NULL DEFAULT 0,
  min_stock DECIMAL(14,3) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  supplier VARCHAR(120) DEFAULT NULL,
  created_at DATETIME(3) DEFAULT NULL,
  updated_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_inventory_name (name),
  KEY idx_inventory_supplier (supplier),
  KEY idx_inventory_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_logs (
  id VARCHAR(64) NOT NULL,
  inventory_id VARCHAR(64) NOT NULL,
  delta DECIMAL(14,3) NOT NULL DEFAULT 0,
  balance DECIMAL(14,3) NOT NULL DEFAULT 0,
  reason VARCHAR(80) DEFAULT NULL,
  ref VARCHAR(64) DEFAULT NULL,
  user_id VARCHAR(64) DEFAULT NULL,
  logged_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_inventory_logs_item (inventory_id),
  KEY idx_inventory_logs_time (logged_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id VARCHAR(64) NOT NULL,
  category_id VARCHAR(64) DEFAULT NULL,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(500) DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  station VARCHAR(24) DEFAULT NULL,
  available TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) DEFAULT NULL,
  updated_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_menu_category (category_id),
  KEY idx_menu_name (name),
  KEY idx_menu_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_recipes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  menu_id VARCHAR(64) NOT NULL,
  inventory_id VARCHAR(64) NOT NULL,
  qty DECIMAL(14,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_recipe (menu_id, inventory_id),
  KEY idx_recipe_inventory (inventory_id),
  CONSTRAINT fk_recipe_menu FOREIGN KEY (menu_id) REFERENCES menu_items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id VARCHAR(16) NOT NULL,
  name VARCHAR(32) NOT NULL,
  zone VARCHAR(40) DEFAULT NULL,
  seats INT NOT NULL DEFAULT 0,
  kind ENUM('dinein', 'takeaway', 'delivery') NOT NULL DEFAULT 'dinein',
  updated_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) NOT NULL,
  order_no VARCHAR(32) NOT NULL,
  table_id VARCHAR(16) DEFAULT NULL,
  guests INT NOT NULL DEFAULT 0,
  waiter_id VARCHAR(64) DEFAULT NULL,
  waiter_name VARCHAR(120) DEFAULT NULL,
  customer_name VARCHAR(120) DEFAULT NULL,
  status ENUM('open', 'closed', 'cancelled') NOT NULL DEFAULT 'open',
  note VARCHAR(255) DEFAULT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  sent_at DATETIME(3) DEFAULT NULL,
  created_at DATETIME(3) DEFAULT NULL,
  updated_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_orders_table (table_id),
  KEY idx_orders_status (status),
  KEY idx_orders_no (order_no),
  KEY idx_orders_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  menu_id VARCHAR(64) DEFAULT NULL,
  name VARCHAR(160) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  qty INT NOT NULL DEFAULT 1,
  notes VARCHAR(200) DEFAULT NULL,
  status ENUM('unsent', 'cooking', 'ready', 'served') NOT NULL DEFAULT 'unsent',
  sent_at DATETIME(3) DEFAULT NULL,
  stock_deducted TINYINT(1) NOT NULL DEFAULT 0,
  category_id VARCHAR(64) DEFAULT NULL,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_status (status),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(64) NOT NULL,
  invoice_no VARCHAR(32) NOT NULL,
  order_id VARCHAR(64) DEFAULT NULL,
  order_no VARCHAR(32) DEFAULT NULL,
  table_id VARCHAR(16) DEFAULT NULL,
  table_name VARCHAR(32) DEFAULT NULL,
  guests INT NOT NULL DEFAULT 0,
  waiter_id VARCHAR(64) DEFAULT NULL,
  waiter_name VARCHAR(120) DEFAULT NULL,
  cashier_id VARCHAR(64) DEFAULT NULL,
  cashier_name VARCHAR(120) DEFAULT NULL,
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  vat_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  vat_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  service_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  service_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  method ENUM('cash', 'card', 'mobile') NOT NULL DEFAULT 'cash',
  cash_received DECIMAL(12,2) NOT NULL DEFAULT 0,
  change_due DECIMAL(12,2) NOT NULL DEFAULT 0,
  note VARCHAR(255) DEFAULT NULL,
  created_at DATETIME(3) DEFAULT NULL,
  updated_at DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_invoices_no (invoice_no),
  KEY idx_invoices_created (created_at),
  KEY idx_invoices_table (table_id),
  KEY idx_invoices_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(64) NOT NULL,
  invoice_id VARCHAR(64) NOT NULL,
  menu_id VARCHAR(64) DEFAULT NULL,
  name VARCHAR(160) NOT NULL,
  category_id VARCHAR(64) DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  qty INT NOT NULL DEFAULT 1,
  notes VARCHAR(200) DEFAULT NULL,
  line_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_invoice_items_invoice (invoice_id),
  CONSTRAINT fk_invoice_items_invoice FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  client_event_id VARCHAR(64) NOT NULL,
  event_type VARCHAR(48) NOT NULL,
  entity_id VARCHAR(64) DEFAULT NULL,
  status ENUM('applied', 'duplicate', 'failed') NOT NULL DEFAULT 'applied',
  message VARCHAR(255) DEFAULT NULL,
  ip VARCHAR(45) DEFAULT NULL,
  payload_hash CHAR(64) DEFAULT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_sync_event (client_event_id),
  KEY idx_sync_created (created_at),
  KEY idx_sync_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default floor plan. The browser also keeps its own copy for offline use.
INSERT IGNORE INTO restaurant_tables (id, name, zone, seats, kind, updated_at) VALUES
  ('T-01', 'T-01', 'Main hall', 2, 'dinein', UTC_TIMESTAMP(3)),
  ('T-02', 'T-02', 'Main hall', 2, 'dinein', UTC_TIMESTAMP(3)),
  ('T-03', 'T-03', 'Window', 2, 'dinein', UTC_TIMESTAMP(3)),
  ('T-04', 'T-04', 'Window', 4, 'dinein', UTC_TIMESTAMP(3)),
  ('T-05', 'T-05', 'Main hall', 4, 'dinein', UTC_TIMESTAMP(3)),
  ('T-06', 'T-06', 'Main hall', 6, 'dinein', UTC_TIMESTAMP(3)),
  ('T-07', 'T-07', 'Patio', 4, 'dinein', UTC_TIMESTAMP(3)),
  ('T-08', 'T-08', 'Patio', 4, 'dinein', UTC_TIMESTAMP(3)),
  ('T-09', 'T-09', 'Patio', 6, 'dinein', UTC_TIMESTAMP(3)),
  ('T-10', 'T-10', 'Bar', 2, 'dinein', UTC_TIMESTAMP(3)),
  ('TAKEAWAY', 'Takeaway', 'Counter', 0, 'takeaway', UTC_TIMESTAMP(3)),
  ('DELIVERY', 'Delivery', 'Dispatch', 0, 'delivery', UTC_TIMESTAMP(3));

