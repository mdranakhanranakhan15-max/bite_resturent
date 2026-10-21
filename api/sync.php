<?php
declare(strict_types=1);

/**
 * Bite POS — sync API.
 * POST /api/sync.php            { action: "push", batch: [...] }
 * GET  /api/sync.php?action=ping
 * GET  /api/sync.php?action=pull&since=ISO8601
 *
 * All requests require the X-Bite-Key header (or Bearer token).
 */

require __DIR__ . '/config.php';
require_api_key();

$action = strtolower(trim((string) ($_GET['action'] ?? '')));
if ($action === '') {
    $action = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST' ? 'push' : 'ping';
}

try {
    $pdo = db();
    switch ($action) {
        case 'ping':
            handle_ping($pdo);
            break;
        case 'push':
            if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
                fail('push requires POST.', 405);
            }
            handle_push($pdo);
            break;
        case 'pull':
            handle_pull($pdo);
            break;
        default:
            fail('Unknown action. Use ping, push or pull.', 404);
    }
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo instanceof PDO && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('[Bite] fatal sync error: ' . $exception->getMessage());
    fail('Sync failed due to a server error. Check the PHP error log.', 500);
}

function handle_ping(PDO $pdo): never
{
    $counts = [];
    foreach (['users', 'categories', 'menu_items', 'inventory_items', 'orders', 'invoices'] as $table) {
        try {
            $counts[$table] = (int) $pdo->query("SELECT COUNT(*) FROM {$table}")->fetchColumn();
        } catch (PDOException) {
            $counts[$table] = null;
        }
    }
    json_out([
        'ok' => true,
        'app' => 'Bite POS',
        'version' => BITE_APP_VERSION,
        'db' => true,
        'serverTime' => gmdate('c'),
        'counts' => $counts,
    ]);
}

function entity_id_for(string $type, array $payload): string
{
    if ($type === 'MASTER_BOOTSTRAP') {
        return 'WORKSPACE';
    }
    $map = [
        'CATEGORY_UPSERT' => ['category', 'id'],
        'CATEGORY_DELETE' => ['', 'id'],
        'MENU_UPSERT' => ['item', 'id'],
        'MENU_DELETE' => ['', 'id'],
        'INVENTORY_PUSH' => ['item', 'id'],
        'INVENTORY_DELETE' => ['', 'id'],
        'USER_UPSERT' => ['user', 'id'],
        'USER_DELETE' => ['', 'id'],
        'ORDER_UPSERT' => ['order', 'id'],
        'KOT_SENT' => ['order', 'id'],
        'ORDER_STATUS' => ['order', 'id'],
        'ORDER_CANCEL' => ['', 'orderId'],
        'INVOICE_CREATED' => ['invoice', 'id'],
    ];
    [$wrapper, $key] = $map[$type] ?? ['', 'id'];
    $source = $wrapper !== '' && isset($payload[$wrapper]) && is_array($payload[$wrapper])
        ? $payload[$wrapper]
        : $payload;
    return text_value($source[$key] ?? '', 64);
}

function event_error_message(Throwable $exception): string
{
    if ($exception instanceof InvalidArgumentException) {
        return $exception->getMessage();
    }
    if ($exception instanceof PDOException) {
        return 'Database rejected the change. Check required values and unique keys.';
    }
    return 'Unexpected server error while applying the event.';
}
function handle_push(PDO $pdo): never
{
    $body = request_json();
    $batch = $body['batch'] ?? null;
    if (!is_array($batch) || $batch === []) {
        fail('Batch must contain at least one event.');
    }
    if (count($batch) > 200) {
        fail('Batch too large. Maximum 200 events per request.', 413);
    }

    $results = [];
    $applied = 0;
    $failed = 0;
    $duplicates = 0;
    $ip = substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);

    $pdo->beginTransaction();
    foreach ($batch as $event) {
        if (!is_array($event)) {
            $failed++;
            $results[] = ['id' => '', 'status' => 'failed', 'error' => 'Event must be an object.'];
            continue;
        }
        $clientId = text_value($event['id'] ?? '', 64);
        $type = text_value($event['type'] ?? '', 48);
        if ($clientId === '' || $type === '') {
            $failed++;
            $results[] = ['id' => $clientId, 'status' => 'failed', 'error' => 'Event is missing id or type.'];
            continue;
        }

        $duplicateCheck = $pdo->prepare('SELECT id FROM sync_log WHERE client_event_id = ? LIMIT 1');
        $duplicateCheck->execute([$clientId]);
        if ($duplicateCheck->fetchColumn()) {
            $duplicates++;
            $results[] = ['id' => $clientId, 'status' => 'synced', 'duplicate' => true];
            continue;
        }

        $pdo->exec('SAVEPOINT bite_event');
        try {
            $payload = isset($event['payload']) && is_array($event['payload']) ? $event['payload'] : [];
            apply_event($pdo, $type, $payload);

            $hashSource = json_encode($payload, JSON_INVALID_UTF8_SUBSTITUTE);
            $hash = hash('sha256', $hashSource === false ? '' : $hashSource);
            $log = $pdo->prepare(
                'INSERT IGNORE INTO sync_log
                 (client_event_id, event_type, entity_id, status, ip, payload_hash, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3))'
            );
            $log->execute([$clientId, $type, entity_id_for($type, $payload), 'applied', $ip, $hash]);
            $pdo->exec('RELEASE SAVEPOINT bite_event');
            $applied++;
            $results[] = ['id' => $clientId, 'status' => 'synced', 'type' => $type];
        } catch (Throwable $exception) {
            $pdo->exec('ROLLBACK TO SAVEPOINT bite_event');
            $pdo->exec('RELEASE SAVEPOINT bite_event');
            $failed++;
            error_log('[Bite] event ' . $clientId . ' (' . $type . ') failed: ' . $exception->getMessage());
            $results[] = [
                'id' => $clientId,
                'status' => 'failed',
                'type' => $type,
                'error' => event_error_message($exception),
            ];
        }
    }
    $pdo->commit();

    json_out([
        'ok' => true,
        'results' => $results,
        'counts' => ['applied' => $applied, 'failed' => $failed, 'duplicates' => $duplicates],
        'serverTime' => gmdate('c'),
    ]);
}

function apply_event(PDO $pdo, string $type, array $payload): void
{
    switch ($type) {
        case 'CATEGORY_UPSERT':
            upsert_category($pdo, $payload);
            return;
        case 'CATEGORY_DELETE':
            delete_category($pdo, $payload);
            return;
        case 'MENU_UPSERT':
            upsert_menu($pdo, $payload);
            return;
        case 'MENU_DELETE':
            delete_menu($pdo, $payload);
            return;
        case 'INVENTORY_PUSH':
            upsert_inventory($pdo, $payload);
            return;
        case 'INVENTORY_DELETE':
            delete_inventory($pdo, $payload);
            return;
        case 'USER_UPSERT':
            upsert_user($pdo, $payload);
            return;
        case 'USER_DELETE':
            delete_user($pdo, $payload);
            return;
        case 'ORDER_UPSERT':
        case 'KOT_SENT':
        case 'ORDER_STATUS':
            upsert_order($pdo, $payload);
            return;
        case 'ORDER_CANCEL':
            cancel_order($pdo, $payload);
            return;
        case 'INVOICE_CREATED':
            upsert_invoice($pdo, $payload);
            return;
        case 'MASTER_BOOTSTRAP':
            bootstrap_master($pdo, $payload);
            return;
        default:
            throw new InvalidArgumentException('Unsupported event type: ' . $type);
    }
}
function upsert_category(PDO $pdo, array $payload): void
{
    $category = isset($payload['category']) && is_array($payload['category'])
        ? $payload['category']
        : $payload;
    $id = id_value($category['id'] ?? '', 'category');
    $name = text_value($category['name'] ?? '', 80);
    if ($name === '') {
        throw new InvalidArgumentException('Category name is required.');
    }
    $created = to_dt($category['createdAt'] ?? null) ?? now_utc();
    $updated = to_dt($category['updatedAt'] ?? null) ?? now_utc();
    $statement = $pdo->prepare(
        'INSERT INTO categories (id, name, letter, tint, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), letter = VALUES(letter), tint = VALUES(tint),
           sort_order = VALUES(sort_order), updated_at = VALUES(updated_at)'
    );
    $statement->execute([
        $id,
        $name,
        text_value($category['letter'] ?? '', 4),
        text_value($category['tint'] ?? '', 16),
        int_value($category['sort'] ?? 0),
        $created,
        $updated,
    ]);
}

function delete_category(PDO $pdo, array $payload): void
{
    $id = id_value($payload['id'] ?? '', 'category');
    $check = $pdo->prepare('SELECT COUNT(*) FROM menu_items WHERE category_id = ?');
    $check->execute([$id]);
    if ((int) $check->fetchColumn() > 0) {
        throw new InvalidArgumentException('Category still contains menu items.');
    }
    $pdo->prepare('UPDATE menu_items SET category_id = NULL WHERE category_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM categories WHERE id = ?')->execute([$id]);
}

function upsert_menu(PDO $pdo, array $payload): void
{
    $item = isset($payload['item']) && is_array($payload['item']) ? $payload['item'] : $payload;
    $id = id_value($item['id'] ?? '', 'menu item');
    $name = text_value($item['name'] ?? '', 120);
    if ($name === '') {
        throw new InvalidArgumentException('Menu item name is required.');
    }
    $categoryId = text_value($item['categoryId'] ?? '', 64);
    $created = to_dt($item['createdAt'] ?? null) ?? now_utc();
    $updated = to_dt($item['updatedAt'] ?? null) ?? now_utc();

    $statement = $pdo->prepare(
        'INSERT INTO menu_items
         (id, category_id, name, description, price, station, available, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           category_id = VALUES(category_id), name = VALUES(name), description = VALUES(description),
           price = VALUES(price), station = VALUES(station), available = VALUES(available),
           sort_order = VALUES(sort_order), updated_at = VALUES(updated_at)'
    );
    $statement->execute([
        $id,
        $categoryId === '' ? null : $categoryId,
        $name,
        text_value($item['description'] ?? '', 500),
        decimal_value($item['price'] ?? 0),
        text_value($item['station'] ?? 'Kitchen', 24),
        bool_value($item['available'] ?? true),
        int_value($item['sort'] ?? 0),
        $created,
        $updated,
    ]);

    $pdo->prepare('DELETE FROM menu_recipes WHERE menu_id = ?')->execute([$id]);
    $recipeStatement = $pdo->prepare(
        'INSERT INTO menu_recipes (menu_id, inventory_id, qty) VALUES (?, ?, ?)'
    );
    $recipe = isset($item['recipe']) && is_array($item['recipe']) ? $item['recipe'] : [];
    foreach ($recipe as $line) {
        if (!is_array($line)) {
            continue;
        }
        $inventoryId = text_value($line['inventoryId'] ?? '', 64);
        $qty = decimal_value($line['qty'] ?? 0);
        if ($inventoryId === '' || $qty <= 0) {
            continue;
        }
        $recipeStatement->execute([$id, $inventoryId, $qty]);
    }
}

function delete_menu(PDO $pdo, array $payload): void
{
    $id = id_value($payload['id'] ?? '', 'menu item');
    $pdo->prepare('DELETE FROM menu_items WHERE id = ?')->execute([$id]);
}
function upsert_inventory(PDO $pdo, array $payload): void
{
    $item = isset($payload['item']) && is_array($payload['item']) ? $payload['item'] : $payload;
    $id = id_value($item['id'] ?? '', 'inventory item');
    $name = text_value($item['name'] ?? '', 120);
    if ($name === '') {
        throw new InvalidArgumentException('Inventory item name is required.');
    }
    $created = to_dt($item['createdAt'] ?? null) ?? now_utc();
    $updated = to_dt($item['updatedAt'] ?? null) ?? now_utc();

    $statement = $pdo->prepare(
        'INSERT INTO inventory_items
         (id, name, unit, stock, min_stock, unit_cost, supplier, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), unit = VALUES(unit), stock = VALUES(stock),
           min_stock = VALUES(min_stock), unit_cost = VALUES(unit_cost),
           supplier = VALUES(supplier), updated_at = VALUES(updated_at)'
    );
    $statement->execute([
        $id,
        $name,
        text_value($item['unit'] ?? 'piece', 16),
        decimal_value($item['stock'] ?? 0),
        decimal_value($item['minStock'] ?? 0),
        decimal_value($item['unitCost'] ?? 0),
        text_value($item['supplier'] ?? '', 120),
        $created,
        $updated,
    ]);

    $log = isset($payload['log']) && is_array($payload['log']) ? $payload['log'] : null;
    if ($log !== null) {
        $logId = text_value($log['id'] ?? '', 64);
        if ($logId !== '') {
            $logStatement = $pdo->prepare(
                'INSERT IGNORE INTO inventory_logs
                 (id, inventory_id, delta, balance, reason, ref, user_id, logged_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $logStatement->execute([
                $logId,
                $id,
                decimal_value($log['delta'] ?? 0),
                decimal_value($log['balance'] ?? $item['stock'] ?? 0),
                text_value($log['reason'] ?? 'Adjustment', 80),
                text_value($log['ref'] ?? '', 64),
                text_value($log['userId'] ?? '', 64),
                to_dt($log['at'] ?? null) ?? now_utc(),
            ]);
        }
    }
}

function delete_inventory(PDO $pdo, array $payload): void
{
    $id = id_value($payload['id'] ?? '', 'inventory item');
    $pdo->prepare('DELETE FROM inventory_logs WHERE inventory_id = ?')->execute([$id]);
    $pdo->prepare('DELETE FROM inventory_items WHERE id = ?')->execute([$id]);
}

function upsert_user(PDO $pdo, array $payload): void
{
    $user = isset($payload['user']) && is_array($payload['user']) ? $payload['user'] : $payload;
    $id = id_value($user['id'] ?? '', 'user');
    $name = text_value($user['name'] ?? '', 120);
    if ($name === '') {
        throw new InvalidArgumentException('User name is required.');
    }
    $role = text_value($user['role'] ?? 'waiter', 16);
    if (!in_array($role, ['admin', 'manager', 'cashier', 'waiter', 'chef'], true)) {
        $role = 'waiter';
    }
    $pin = text_value($user['pin'] ?? '', 12);
    $pinHash = $pin !== '' ? password_hash($pin, PASSWORD_DEFAULT) : null;
    $created = to_dt($user['createdAt'] ?? null) ?? now_utc();
    $updated = to_dt($user['updatedAt'] ?? null) ?? now_utc();

    $statement = $pdo->prepare(
        'INSERT INTO users
         (id, name, role, pin_hash, shift, phone, email, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name), role = VALUES(role),
           pin_hash = COALESCE(VALUES(pin_hash), pin_hash),
           shift = VALUES(shift), phone = VALUES(phone), email = VALUES(email),
           active = VALUES(active), updated_at = VALUES(updated_at)'
    );
    $statement->execute([
        $id,
        $name,
        $role,
        $pinHash,
        text_value($user['shift'] ?? '', 60),
        text_value($user['phone'] ?? '', 40),
        text_value($user['email'] ?? '', 160),
        bool_value($user['active'] ?? true),
        $created,
        $updated,
    ]);
}

function delete_user(PDO $pdo, array $payload): void
{
    $id = id_value($payload['id'] ?? '', 'user');
    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$id]);
}
function upsert_order(PDO $pdo, array $payload): void
{
    $order = isset($payload['order']) && is_array($payload['order']) ? $payload['order'] : $payload;
    $id = id_value($order['id'] ?? '', 'order');
    $items = isset($order['items']) && is_array($order['items']) ? $order['items'] : [];
    $created = to_dt($order['createdAt'] ?? null) ?? now_utc();
    $updated = to_dt($order['updatedAt'] ?? null) ?? now_utc();
    $waiterId = text_value($order['waiterId'] ?? '', 64);
    $waiterName = null;
    if ($waiterId !== '') {
        $lookup = $pdo->prepare('SELECT name FROM users WHERE id = ? LIMIT 1');
        $lookup->execute([$waiterId]);
        $found = $lookup->fetchColumn();
        if (is_string($found) && $found !== '') {
            $waiterName = $found;
        }
    }
    $status = text_value($order['status'] ?? 'open', 16);
    if (!in_array($status, ['open', 'closed', 'cancelled'], true)) {
        $status = 'open';
    }

    $statement = $pdo->prepare(
        'INSERT INTO orders
         (id, order_no, table_id, guests, waiter_id, waiter_name, customer_name, status, note,
          discount, sent_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           order_no = VALUES(order_no), table_id = VALUES(table_id), guests = VALUES(guests),
           waiter_id = VALUES(waiter_id), waiter_name = VALUES(waiter_name),
           customer_name = VALUES(customer_name), status = VALUES(status), note = VALUES(note),
           discount = VALUES(discount), sent_at = VALUES(sent_at), updated_at = VALUES(updated_at)'
    );
    $statement->execute([
        $id,
        text_value($order['orderNo'] ?? '', 32),
        text_value($order['tableId'] ?? '', 16),
        int_value($order['guests'] ?? 0),
        $waiterId,
        $waiterName,
        text_value($order['customerName'] ?? '', 120),
        $status,
        text_value($order['note'] ?? '', 255),
        decimal_value($order['discount'] ?? 0),
        to_dt($order['sentAt'] ?? null),
        $created,
        $updated,
    ]);

    $pdo->prepare('DELETE FROM order_items WHERE order_id = ?')->execute([$id]);
    $itemStatement = $pdo->prepare(
        'INSERT INTO order_items
         (id, order_id, menu_id, name, price, qty, notes, status, sent_at, stock_deducted,
          category_id, line_total, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    foreach ($items as $index => $line) {
        if (!is_array($line)) {
            continue;
        }
        $lineId = text_value($line['lineId'] ?? $line['id'] ?? '', 64);
        if ($lineId === '') {
            $lineId = substr($id . '_' . $index, 0, 64);
        }
        $lineStatus = text_value($line['status'] ?? 'unsent', 12);
        if (!in_array($lineStatus, ['unsent', 'cooking', 'ready', 'served'], true)) {
            $lineStatus = 'unsent';
        }
        $price = decimal_value($line['price'] ?? 0);
        $qty = max(1, int_value($line['qty'] ?? 1));
        $categoryId = text_value($line['categoryId'] ?? '', 64);
        $itemStatement->execute([
            $lineId,
            $id,
            text_value($line['menuId'] ?? '', 64),
            text_value($line['name'] ?? 'Item', 160),
            $price,
            $qty,
            text_value($line['notes'] ?? '', 200),
            $lineStatus,
            to_dt($line['sentAt'] ?? null),
            bool_value($line['stockDeducted'] ?? false, false),
            $categoryId === '' ? null : $categoryId,
            round($price * $qty, 2),
            $created,
        ]);
    }
}

function cancel_order(PDO $pdo, array $payload): void
{
    $orderId = text_value($payload['orderId'] ?? ($payload['order']['id'] ?? ''), 64);
    if ($orderId === '') {
        throw new InvalidArgumentException('Order id is required to cancel an order.');
    }
    $pdo->prepare('DELETE FROM orders WHERE id = ?')->execute([$orderId]);
}
function upsert_invoice(PDO $pdo, array $payload): void
{
    $invoice = isset($payload['invoice']) && is_array($payload['invoice']) ? $payload['invoice'] : $payload;
    $id = id_value($invoice['id'] ?? '', 'invoice');
    $invoiceNo = text_value($invoice['invoiceNo'] ?? '', 32);
    if ($invoiceNo === '') {
        throw new InvalidArgumentException('Invoice number is required.');
    }
    $items = isset($invoice['items']) && is_array($invoice['items']) ? $invoice['items'] : [];
    $method = text_value($invoice['method'] ?? 'cash', 12);
    if (!in_array($method, ['cash', 'card', 'mobile'], true)) {
        $method = 'cash';
    }
    $created = to_dt($invoice['at'] ?? ($invoice['createdAt'] ?? null)) ?? now_utc();
    $updated = to_dt($invoice['updatedAt'] ?? null) ?? now_utc();
    $orderId = text_value($invoice['orderId'] ?? '', 64);

    $statement = $pdo->prepare(
        'INSERT INTO invoices
         (id, invoice_no, order_id, order_no, table_id, table_name, guests, waiter_id, waiter_name,
          cashier_id, cashier_name, subtotal, discount, vat_pct, vat_amount, service_pct,
          service_amount, total, method, cash_received, change_due, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           invoice_no = VALUES(invoice_no), order_id = VALUES(order_id), order_no = VALUES(order_no),
           table_id = VALUES(table_id), table_name = VALUES(table_name), guests = VALUES(guests),
           waiter_id = VALUES(waiter_id), waiter_name = VALUES(waiter_name),
           cashier_id = VALUES(cashier_id), cashier_name = VALUES(cashier_name),
           subtotal = VALUES(subtotal), discount = VALUES(discount), vat_pct = VALUES(vat_pct),
           vat_amount = VALUES(vat_amount), service_pct = VALUES(service_pct),
           service_amount = VALUES(service_amount), total = VALUES(total), method = VALUES(method),
           cash_received = VALUES(cash_received), change_due = VALUES(change_due), note = VALUES(note),
           updated_at = VALUES(updated_at)'
    );
    $statement->execute([
        $id,
        $invoiceNo,
        $orderId === '' ? null : $orderId,
        text_value($invoice['orderNo'] ?? '', 32),
        text_value($invoice['tableId'] ?? '', 16),
        text_value($invoice['tableName'] ?? '', 32),
        int_value($invoice['guests'] ?? 0),
        text_value($invoice['waiterId'] ?? '', 64),
        text_value($invoice['waiterName'] ?? '', 120),
        text_value($invoice['cashierId'] ?? '', 64),
        text_value($invoice['cashierName'] ?? '', 120),
        decimal_value($invoice['subtotal'] ?? 0),
        decimal_value($invoice['discount'] ?? 0),
        decimal_value($invoice['vatPct'] ?? 0),
        decimal_value($invoice['vat'] ?? 0),
        decimal_value($invoice['servicePct'] ?? 0),
        decimal_value($invoice['service'] ?? 0),
        decimal_value($invoice['total'] ?? 0),
        $method,
        decimal_value($invoice['cashReceived'] ?? 0),
        decimal_value($invoice['change'] ?? 0),
        text_value($invoice['note'] ?? '', 255),
        $created,
        $updated,
    ]);

    $pdo->prepare('DELETE FROM invoice_items WHERE invoice_id = ?')->execute([$id]);
    $itemStatement = $pdo->prepare(
        'INSERT INTO invoice_items
         (id, invoice_id, menu_id, name, category_id, price, qty, notes, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($items as $index => $line) {
        if (!is_array($line)) {
            continue;
        }
        $lineId = text_value($line['lineId'] ?? $line['id'] ?? '', 64);
        if ($lineId === '') {
            $lineId = substr($id . '_' . $index, 0, 64);
        }
        $price = decimal_value($line['price'] ?? 0);
        $qty = max(1, int_value($line['qty'] ?? 1));
        $categoryId = text_value($line['categoryId'] ?? '', 64);
        $itemStatement->execute([
            $lineId,
            $id,
            text_value($line['menuId'] ?? '', 64),
            text_value($line['name'] ?? 'Item', 160),
            $categoryId === '' ? null : $categoryId,
            $price,
            $qty,
            text_value($line['notes'] ?? '', 200),
            round($price * $qty, 2),
        ]);
    }
}
function bootstrap_master(PDO $pdo, array $payload): void
{
    foreach (($payload['categories'] ?? []) as $category) {
        if (is_array($category)) {
            upsert_category($pdo, ['category' => $category]);
        }
    }
    foreach (($payload['inventory'] ?? []) as $item) {
        if (is_array($item)) {
            upsert_inventory($pdo, ['item' => $item, 'log' => null]);
        }
    }
    foreach (($payload['users'] ?? []) as $user) {
        if (is_array($user)) {
            upsert_user($pdo, ['user' => $user]);
        }
    }
    foreach (($payload['menu'] ?? []) as $item) {
        if (is_array($item)) {
            upsert_menu($pdo, ['item' => $item]);
        }
    }
}

function handle_pull(PDO $pdo): never
{
    $since = to_dt($_GET['since'] ?? null) ?? '1970-01-01 00:00:00';
    $limit = 500;

    $categoryRows = $pdo->prepare(
        'SELECT * FROM categories WHERE updated_at >= ? ORDER BY updated_at ASC LIMIT ' . $limit
    );
    $categoryRows->execute([$since]);
    $categories = array_map(static fn(array $row): array => [
        'id' => $row['id'],
        'name' => $row['name'],
        'letter' => $row['letter'],
        'tint' => $row['tint'],
        'sort' => (int) $row['sort_order'],
        'createdAt' => from_dt($row['created_at']),
        'updatedAt' => from_dt($row['updated_at']),
    ], $categoryRows->fetchAll());

    $menuRows = $pdo->prepare(
        'SELECT * FROM menu_items WHERE updated_at >= ? ORDER BY updated_at ASC LIMIT ' . $limit
    );
    $menuRows->execute([$since]);
    $menuRaw = $menuRows->fetchAll();

    $recipeMap = [];
    if ($menuRaw !== []) {
        $ids = array_column($menuRaw, 'id');
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $recipeRows = $pdo->prepare(
            'SELECT menu_id, inventory_id, qty FROM menu_recipes WHERE menu_id IN (' . $placeholders . ')'
        );
        $recipeRows->execute($ids);
        foreach ($recipeRows->fetchAll() as $recipe) {
            $recipeMap[$recipe['menu_id']][] = [
                'inventoryId' => $recipe['inventory_id'],
                'qty' => (float) $recipe['qty'],
            ];
        }
    }

    $menu = array_map(static function (array $row) use ($recipeMap): array {
        return [
            'id' => $row['id'],
            'categoryId' => $row['category_id'],
            'name' => $row['name'],
            'description' => $row['description'],
            'price' => (float) $row['price'],
            'station' => $row['station'],
            'available' => (bool) $row['available'],
            'sort' => (int) $row['sort_order'],
            'recipe' => $recipeMap[$row['id']] ?? [],
            'createdAt' => from_dt($row['created_at']),
            'updatedAt' => from_dt($row['updated_at']),
        ];
    }, $menuRaw);

    $inventoryRows = $pdo->prepare(
        'SELECT * FROM inventory_items WHERE updated_at >= ? ORDER BY updated_at ASC LIMIT ' . $limit
    );
    $inventoryRows->execute([$since]);
    $inventory = array_map(static fn(array $row): array => [
        'id' => $row['id'],
        'name' => $row['name'],
        'unit' => $row['unit'],
        'stock' => (float) $row['stock'],
        'minStock' => (float) $row['min_stock'],
        'unitCost' => (float) $row['unit_cost'],
        'supplier' => $row['supplier'],
        'createdAt' => from_dt($row['created_at']),
        'updatedAt' => from_dt($row['updated_at']),
    ], $inventoryRows->fetchAll());

    $userRows = $pdo->prepare(
        'SELECT id, name, role, shift, phone, email, active, created_at, updated_at
         FROM users WHERE updated_at >= ? ORDER BY updated_at ASC LIMIT ' . $limit
    );
    $userRows->execute([$since]);
    $users = array_map(static fn(array $row): array => [
        'id' => $row['id'],
        'name' => $row['name'],
        'role' => $row['role'],
        'shift' => $row['shift'],
        'phone' => $row['phone'],
        'email' => $row['email'],
        'active' => (bool) $row['active'],
        'createdAt' => from_dt($row['created_at']),
        'updatedAt' => from_dt($row['updated_at']),
    ], $userRows->fetchAll());

    $tableRows = $pdo->query('SELECT * FROM restaurant_tables ORDER BY id')->fetchAll();
    $tables = array_map(static fn(array $row): array => [
        'id' => $row['id'],
        'name' => $row['name'],
        'zone' => $row['zone'],
        'seats' => (int) $row['seats'],
        'kind' => $row['kind'],
        'updatedAt' => from_dt($row['updated_at']),
    ], $tableRows);

    json_out([
        'ok' => true,
        'serverTime' => gmdate('c'),
        'since' => from_dt($since),
        'data' => [
            'categories' => $categories,
            'menu' => $menu,
            'inventory' => $inventory,
            'users' => $users,
            'tables' => $tables,
        ],
        'counts' => [
            'categories' => count($categories),
            'menu' => count($menu),
            'inventory' => count($inventory),
            'users' => count($users),
        ],
    ]);
}






