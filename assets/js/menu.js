/**
 * Bite Menu — category and dish management with recipe links.
 */
import {
  getState, can, findCategory, findInventory, saveState, STATIONS,
} from './store.js';
import { enqueue } from './sync.js';
import { getUser } from './auth.js';
import {
  $, esc, icon, money, openDialog, closeDialog, toast, confirmDialog, emptyState, uid,
} from './utils.js';

let menuSearch = '';
let menuCategory = 'all';
let menuAvailability = 'all';

const TINTS = ['#f7e2d2', '#f1e8d3', '#f8efd8', '#f2ddd6', '#dfe9ea', '#eee0e9', '#e4ead9'];

function filteredItems() {
  const state = getState();
  const term = menuSearch.trim().toLowerCase();
  return state.menu.filter((item) => {
    if (menuCategory !== 'all' && item.categoryId !== menuCategory) return false;
    if (menuAvailability === 'available' && item.available === false) return false;
    if (menuAvailability === 'soldout' && item.available !== false) return false;
    if (!term) return true;
    return [item.name, item.description, findCategory(item.categoryId)?.name, item.station]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });
}

function itemCard(item, canEdit) {
  const category = findCategory(item.categoryId);
  const available = item.available !== false;
  const ingredientCount = (item.recipe || []).length;
  return `<article class="admin-card">
    <div class="ac-top">
      <div style="min-width:0">
        <div class="ac-cat">${esc(category?.name || 'Uncategorised')} · ${esc(item.station || 'Kitchen')}</div>
        <h3>${esc(item.name)}</h3>
      </div>
      <button type="button" class="availability-pill ${available ? 'is-on' : ''}" data-toggle-available="${esc(item.id)}" ${canEdit ? '' : 'disabled'} title="${canEdit ? 'Toggle availability' : 'Read-only'}">
        <span class="switch"></span>
        <span>${available ? 'In stock' : 'Sold out'}</span>
      </button>
    </div>
    <p class="ac-desc">${esc(item.description || 'No description yet.')}</p>
    <div style="display:flex;gap:5px;flex-wrap:wrap">
      <span class="recipe-tag">${icon('box')} ${ingredientCount} ingredient${ingredientCount === 1 ? '' : 's'}</span>
      <span class="recipe-tag">${icon('flame')} ${esc(item.station || 'Kitchen')}</span>
      <span class="recipe-tag">${icon('menu')} ${esc(category?.name || '—')}</span>
    </div>
    <div class="ac-meta">
      <div>
        <div class="ac-price">${money(item.price)}</div>
        <div class="tiny muted">${available ? 'Visible on the POS' : 'Hidden from the POS'}</div>
      </div>
      <div class="ac-actions">
        <button class="btn btn-sm" type="button" data-edit-item="${esc(item.id)}" ${canEdit ? '' : 'disabled'} title="Edit item">${icon('pencil')} Edit</button>
        <button class="btn btn-sm btn-danger btn-icon" type="button" data-delete-item="${esc(item.id)}" ${canEdit ? '' : 'disabled'} title="Delete item" aria-label="Delete ${esc(item.name)}">${icon('trash')}</button>
      </div>
    </div>
  </article>`;
}

function gridMarkup(canEdit) {
  const items = filteredItems();
  if (!items.length) {
    return emptyState('menu', 'No dishes match', 'Adjust the filters, or add a new dish to the menu.');
  }
  return items.map((item) => itemCard(item, canEdit)).join('');
}

function refreshGrid(root) {
  const grid = $('#menu-admin-grid', root);
  const count = $('#menu-result-count', root);
  const canEdit = can(getUser(), 'menu.edit');
  if (grid) grid.innerHTML = gridMarkup(canEdit);
  if (count) count.textContent = `${filteredItems().length} dish${filteredItems().length === 1 ? '' : 'es'}`;
}
export function renderMenu(root) {
  const user = getUser();
  const canEdit = can(user, 'menu.edit');
  if (!can(user, 'view.menu')) {
    root.innerHTML = `<div class="card">${emptyState('lock', 'Menu access required', 'Your role does not include the menu workspace.')}</div>`;
    return;
  }
  const state = getState();
  const available = state.menu.filter((item) => item.available !== false).length;
  const scrollTop = root.scrollTop;

  root.innerHTML = `<div class="view-enter">
    <div class="page-head">
      <div>
        <h2>Food menu</h2>
        <p>${canEdit ? 'Edit dishes, link recipes to stock and take items off the pass in one tap.' : 'Read-only access. Chefs, managers and admins can edit the menu.'}</p>
      </div>
      <div class="page-actions">
        ${canEdit ? `<button class="btn" type="button" data-manage-categories>${icon('menu')} Manage categories</button>
          <button class="btn btn-primary" type="button" data-add-item>${icon('plus')} Add item</button>` : ''}
      </div>
    </div>
    <div class="kpi-grid" style="grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:12px">
      <div class="kpi" style="--tint:var(--saffron-wash)">
        <div class="kpi-label">Dishes</div>
        <div class="kpi-value">${state.menu.length}</div>
        <div class="kpi-foot">${state.categories.length} categories</div>
        <div class="kpi-icon">${icon('menu')}</div>
      </div>
      <div class="kpi" style="--tint:var(--sage-wash)">
        <div class="kpi-label">Available</div>
        <div class="kpi-value">${available}</div>
        <div class="kpi-foot">Orderable right now</div>
        <div class="kpi-icon">${icon('check')}</div>
      </div>
      <div class="kpi" style="--tint:var(--brick-wash)">
        <div class="kpi-label">Sold out</div>
        <div class="kpi-value">${state.menu.length - available}</div>
        <div class="kpi-foot">Hidden from the POS</div>
        <div class="kpi-icon">${icon('alert')}</div>
      </div>
    </div>
    <div class="inv-toolbar">
      <div class="search">
        ${icon('search')}
        <input id="menu-search" class="input" placeholder="Search dishes, stations, categories…" value="${esc(menuSearch)}" autocomplete="off" aria-label="Search menu">
      </div>
      <select class="select" id="menu-category-filter" style="max-width:190px;height:38px" aria-label="Filter category">
        <option value="all">All categories</option>
        ${state.categories.map((category) => `<option value="${esc(category.id)}" ${menuCategory === category.id ? 'selected' : ''}>${esc(category.name)}</option>`).join('')}
      </select>
      <div class="seg" role="group" aria-label="Availability filter">
        <button type="button" data-avail="all" class="${menuAvailability === 'all' ? 'is-active' : ''}">All</button>
        <button type="button" data-avail="available" class="${menuAvailability === 'available' ? 'is-active' : ''}">Available</button>
        <button type="button" data-avail="soldout" class="${menuAvailability === 'soldout' ? 'is-active' : ''}">Sold out</button>
      </div>
      <span class="badge badge-neutral" id="menu-result-count">${filteredItems().length} dish${filteredItems().length === 1 ? '' : 'es'}</span>
    </div>
    <div class="menu-admin-grid" id="menu-admin-grid">${gridMarkup(canEdit)}</div>
  </div>`;

  root.scrollTop = scrollTop;

  $('#menu-search', root)?.addEventListener('input', (event) => {
    menuSearch = event.target.value;
    refreshGrid(root);
  });
  $('#menu-category-filter', root)?.addEventListener('change', (event) => {
    menuCategory = event.target.value;
    refreshGrid(root);
  });

  if (!root.dataset.menuBound) {
    root.addEventListener('click', (event) => handleMenuClick(event, root));
    root.dataset.menuBound = '1';
  }
}
function handleMenuClick(event, root) {
  const target = event.target;
  if (target.closest('[data-add-item]')) {
    openMenuItemDialog();
    return;
  }
  if (target.closest('[data-manage-categories]')) {
    openCategoryManager();
    return;
  }
  const availButton = target.closest('[data-avail]');
  if (availButton) {
    menuAvailability = availButton.dataset.avail;
    renderMenu(root);
    return;
  }
  const toggleButton = target.closest('[data-toggle-available]');
  if (toggleButton) {
    toggleAvailability(toggleButton.dataset.toggleAvailable, root);
    return;
  }
  const editButton = target.closest('[data-edit-item]');
  if (editButton) {
    openMenuItemDialog(editButton.dataset.editItem);
    return;
  }
  const deleteButton = target.closest('[data-delete-item]');
  if (deleteButton) deleteMenuItem(deleteButton.dataset.deleteItem, root);
}

function toggleAvailability(itemId, root) {
  if (!can(getUser(), 'menu.edit')) {
    toast('Your role cannot change menu availability.', { type: 'error' });
    return;
  }
  const item = getState().menu.find((entry) => entry.id === itemId);
  if (!item) return;
  item.available = item.available === false;
  item.updatedAt = new Date().toISOString();
  enqueue('MENU_UPSERT', 'menu', {
    item: { ...item, recipe: (item.recipe || []).map((line) => ({ ...line })) },
  }, item.id);
  saveState();
  renderMenu(root);
  toast(`${item.name} is now ${item.available ? 'available' : 'sold out'}.`, {
    type: item.available ? 'success' : 'warn',
  });
}

async function deleteMenuItem(itemId, root) {
  if (!can(getUser(), 'menu.edit')) {
    toast('Your role cannot delete menu items.', { type: 'error' });
    return;
  }
  const state = getState();
  const item = state.menu.find((entry) => entry.id === itemId);
  if (!item) return;
  const openLines = state.orders.reduce(
    (sum, order) => sum + order.items.filter((line) => line.menuId === itemId).length, 0,
  );
  const confirmed = await confirmDialog({
    title: `Delete ${item.name}?`,
    message: `The dish and its recipe link will be removed from the menu.${openLines ? ` It appears on ${openLines} open order line(s); those ticket lines stay but will no longer deduct stock.` : ''}`,
    confirmText: 'Delete dish',
    danger: true,
    eyebrow: 'Menu cleanup',
  });
  if (!confirmed) return;
  state.menu = state.menu.filter((entry) => entry.id !== itemId);
  enqueue('MENU_DELETE', 'menu', { id: itemId }, itemId);
  saveState();
  renderMenu(root);
  toast(`${item.name} removed from the menu.`, { type: 'warn' });
}
function recipeRowMarkup(ingredient = {}) {
  const inventory = getState().inventory;
  const selected = inventory.find((item) => item.id === ingredient.inventoryId);
  return `<div class="recipe-row" data-recipe-row style="display:grid;grid-template-columns:minmax(0,1fr) 92px 54px 30px;gap:6px;align-items:center;margin-bottom:6px">
    <select class="select input-sm" data-recipe-inv aria-label="Ingredient">
      <option value="">Select ingredient…</option>
      ${inventory.map((item) => `<option value="${esc(item.id)}" ${item.id === ingredient.inventoryId ? 'selected' : ''}>${esc(item.name)} · ${esc(item.unit)}</option>`).join('')}
    </select>
    <input class="input input-sm" data-recipe-qty type="number" min="0.001" step="0.001" value="${ingredient.qty ?? ''}" placeholder="Qty" aria-label="Quantity">
    <span class="tiny muted" data-recipe-unit>${esc(selected?.unit || 'unit')}</span>
    <button type="button" class="icon-btn" style="width:30px;height:30px" data-remove-recipe aria-label="Remove ingredient">${icon('x')}</button>
  </div>`;
}

function menuItemBody(existing, state, recipe, defaultCategory) {
  return `<div class="form-grid">
    <div class="field span-2">
      <label for="mi-name">Dish name</label>
      <input id="mi-name" class="input" maxlength="80" value="${esc(existing?.name || '')}" placeholder="e.g. Smoked Brisket Burger" autocomplete="off">
    </div>
    <div class="field">
      <label for="mi-category">Category</label>
      <select id="mi-category" class="select">
        ${state.categories.map((category) => `<option value="${esc(category.id)}" ${(existing?.categoryId || defaultCategory) === category.id ? 'selected' : ''}>${esc(category.name)}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label for="mi-station">Kitchen station</label>
      <select id="mi-station" class="select">
        ${STATIONS.map((station) => `<option value="${station}" ${(existing?.station || 'Grill') === station ? 'selected' : ''}>${station}</option>`).join('')}
      </select>
    </div>
    <div class="field">
      <label for="mi-price">Price (${esc(state.settings.currency || '$')})</label>
      <input id="mi-price" class="input" type="number" min="0.01" step="0.01" inputmode="decimal" value="${existing?.price ?? ''}" placeholder="0.00">
    </div>
    <div class="field">
      <label>&nbsp;</label>
      <button type="button" class="availability-pill ${existing?.available === false ? '' : 'is-on'}" data-mi-available>
        <span class="switch"></span>
        <span data-mi-available-label>${existing?.available === false ? 'Sold out — hidden' : 'In stock — orderable'}</span>
      </button>
    </div>
    <div class="field span-2">
      <label for="mi-desc">Description</label>
      <textarea id="mi-desc" class="textarea" maxlength="200" placeholder="What makes this dish worth ordering?">${esc(existing?.description || '')}</textarea>
    </div>
  </div>
  <div class="form-section">
    <div class="form-section-title">
      <h3>Recipe &amp; stock link</h3>
      <button class="btn btn-sm" type="button" data-add-recipe>${icon('plus')} Add ingredient</button>
    </div>
    <p class="tiny muted" style="margin:-3px 0 9px">Each portion deducts these quantities when a KOT is fired or a bill is settled.</p>
    <div id="recipe-rows">${recipe.map(recipeRowMarkup).join('')}</div>
    <div id="recipe-empty" class="${recipe.length ? 'hidden' : ''}">
      <div class="q-empty">No ingredients linked. Stock will not move when this dish is sold.</div>
    </div>
  </div>`;
}
function openMenuItemDialog(itemId = null) {
  if (!can(getUser(), 'menu.edit')) {
    toast('Your role cannot edit the menu.', { type: 'error' });
    return null;
  }
  const state = getState();
  if (!state.categories.length) {
    toast('Create a menu category first.', { type: 'warn' });
    openCategoryManager();
    return null;
  }
  const existing = itemId ? state.menu.find((item) => item.id === itemId) : null;
  const defaultCategory = menuCategory !== 'all' ? menuCategory : state.categories[0].id;
  const recipe = existing?.recipe || [];

  const dialog = openDialog({
    id: 'menu-item-dialog',
    size: 'dlg-wide',
    eyebrow: existing ? 'Edit dish' : 'New dish',
    title: existing ? existing.name : 'Add a menu item',
    subtitle: 'Link ingredients so every fired KOT deducts the right stock.',
    body: menuItemBody(existing, state, recipe, defaultCategory),
    footer: `<span class="foot-note">Recipe changes apply to future tickets.</span>
      <button class="btn" type="button" data-dlg-close>Cancel</button>
      <button class="btn btn-primary" type="button" data-mi-save>${icon('check')} Save dish</button>`,
    focus: '#mi-name',
  });

  const syncEmpty = () => {
    const rows = dialog.querySelectorAll('[data-recipe-row]');
    $('#recipe-empty', dialog)?.classList.toggle('hidden', rows.length > 0);
  };

  $('[data-mi-available]', dialog)?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    const willBeAvailable = !button.classList.contains('is-on');
    button.classList.toggle('is-on', willBeAvailable);
    $('[data-mi-available-label]', button).textContent = willBeAvailable ? 'In stock — orderable' : 'Sold out — hidden';
  });

  $('[data-add-recipe]', dialog)?.addEventListener('click', () => {
    $('#recipe-rows', dialog)?.insertAdjacentHTML('beforeend', recipeRowMarkup());
    syncEmpty();
    const rows = dialog.querySelectorAll('[data-recipe-row]');
    rows[rows.length - 1]?.querySelector('[data-recipe-inv]')?.focus();
  });

  dialog.addEventListener('click', (event) => {
    if (event.target.closest('[data-remove-recipe]')) {
      event.target.closest('[data-recipe-row]')?.remove();
      syncEmpty();
    }
  });

  dialog.addEventListener('change', (event) => {
    if (event.target.matches('[data-recipe-inv]')) {
      const row = event.target.closest('[data-recipe-row]');
      const inventory = findInventory(event.target.value);
      const unit = row?.querySelector('[data-recipe-unit]');
      if (unit) unit.textContent = inventory?.unit || 'unit';
    }
  });

  $('[data-mi-save]', dialog)?.addEventListener('click', () => {
    saveMenuItem(dialog, existing, $('[data-mi-available]', dialog).classList.contains('is-on'));
  });

  return dialog;
}
function saveMenuItem(dialog, existing, available) {
  const state = getState();
  const name = $('#mi-name', dialog).value.trim();
  const categoryId = $('#mi-category', dialog).value;
  const station = $('#mi-station', dialog).value;
  const price = Number($('#mi-price', dialog).value);
  const description = $('#mi-desc', dialog).value.trim();

  if (name.length < 2) {
    toast('Enter a dish name.', { type: 'error' });
    $('#mi-name', dialog).focus();
    return;
  }
  if (!state.categories.some((category) => category.id === categoryId)) {
    toast('Choose a valid category.', { type: 'error' });
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    toast('Price must be greater than zero.', { type: 'error' });
    $('#mi-price', dialog).focus();
    return;
  }
  if (!STATIONS.includes(station)) return;

  const recipeLines = [];
  const used = new Set();
  const rows = [...dialog.querySelectorAll('[data-recipe-row]')];
  for (const row of rows) {
    const inventoryId = row.querySelector('[data-recipe-inv]').value;
    const qty = Number(row.querySelector('[data-recipe-qty]').value);
    if (!inventoryId && !qty) continue;
    if (!inventoryId || !Number.isFinite(qty) || qty <= 0) {
      toast('Every ingredient needs a positive quantity.', { type: 'error' });
      return;
    }
    if (used.has(inventoryId)) {
      toast('Each ingredient can appear only once in a recipe.', { type: 'error' });
      return;
    }
    used.add(inventoryId);
    recipeLines.push({ inventoryId, qty: Math.round(qty * 1000) / 1000 });
  }

  const now = new Date().toISOString();
  let saved;
  if (existing) {
    Object.assign(existing, {
      name, categoryId, station, price: Math.round(price * 100) / 100,
      description, available, recipe: recipeLines, updatedAt: now,
    });
    saved = existing;
  } else {
    saved = {
      id: uid('m'), name, categoryId, station, price: Math.round(price * 100) / 100,
      description, available, recipe: recipeLines,
      sort: Math.max(0, ...state.menu.map((item) => item.sort || 0)) + 1,
      createdAt: now, updatedAt: now,
    };
    state.menu.push(saved);
  }

  enqueue('MENU_UPSERT', 'menu', {
    item: { ...saved, recipe: saved.recipe.map((line) => ({ ...line })) },
  }, saved.id);
  saveState();
  closeDialog(dialog);
  toast(existing ? 'Dish updated.' : 'Dish added to the menu.', {
    type: 'success', detail: `${name} · ${recipeLines.length} linked ingredient(s)`,
  });
  document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'menu' } }));
}
function refreshCategoryManager() {
  const existing = document.querySelector('dialog[data-dialog-id="category-dialog"]');
  if (existing) closeDialog(existing);
  openCategoryManager();
  document.dispatchEvent(new CustomEvent('bite:data-changed', { detail: { reason: 'menu' } }));
}

function openCategoryManager() {
  if (!can(getUser(), 'menu.edit')) {
    toast('Your role cannot manage categories.', { type: 'error' });
    return null;
  }
  const state = getState();
  const rows = [...state.categories]
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
    .map((category) => {
      const count = state.menu.filter((item) => item.categoryId === category.id).length;
      return `<div data-cat-row="${esc(category.id)}" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:9px 0;border-bottom:1px dashed var(--line)">
        <div class="flex items-center gap-2" style="min-width:0">
          <span style="width:28px;height:28px;border-radius:8px;background:${esc(category.tint || '#f1e8d3')};display:grid;place-items:center;font-family:var(--font-display);font-weight:600;font-size:11px;flex:0 0 auto">${esc(category.letter || '?')}</span>
          <input class="input input-sm" data-cat-name value="${esc(category.name)}" maxlength="50" aria-label="Category name">
        </div>
        <div class="flex items-center gap-1">
          <span class="badge badge-neutral">${count}</span>
          <button class="btn btn-sm" type="button" data-cat-save>Save</button>
          <button class="btn btn-sm btn-danger btn-icon" type="button" data-cat-delete="${esc(category.id)}" title="${count ? `Move ${count} dish(es) first` : 'Delete category'}" aria-label="Delete ${esc(category.name)}">${icon('trash')}</button>
        </div>
      </div>`;
    }).join('');

  const dialog = openDialog({
    id: 'category-dialog',
    eyebrow: 'Menu structure',
    title: 'Manage categories',
    subtitle: 'Categories order the POS menu. Rename safely; dishes stay linked.',
    body: `<div class="field">
        <label for="new-cat-name">New category</label>
        <div class="input-group">
          <input id="new-cat-name" class="input" maxlength="50" placeholder="e.g. Breakfast" autocomplete="off">
          <button class="input-addon" type="button" data-cat-add style="cursor:pointer">${icon('plus')} Add</button>
        </div>
      </div>
      <div style="margin-top:16px">
        <div class="form-section-title" style="margin-bottom:2px">
          <h3>${state.categories.length} categories</h3>
          <span class="tiny muted">Save each rename individually</span>
        </div>
        ${rows || '<div class="q-empty">No categories yet. Add one above.</div>'}
      </div>`,
    footer: `<span class="foot-note">Deleting requires an empty category.</span>
      <button class="btn" type="button" data-dlg-close>Done</button>`,
    focus: '#new-cat-name',
  });

  wireCategoryManager(dialog);
  return dialog;
}
function wireCategoryManager(dialog) {
  const addCategory = () => {
    const state = getState();
    const input = $('#new-cat-name', dialog);
    const name = input.value.trim();
    if (name.length < 2) {
      toast('Category names need at least two characters.', { type: 'error' });
      input.focus();
      return;
    }
    if (state.categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      toast('That category already exists.', { type: 'error' });
      return;
    }
    const now = new Date().toISOString();
    const category = {
      id: uid('cat'),
      name,
      letter: name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(),
      tint: TINTS[state.categories.length % TINTS.length],
      sort: Math.max(0, ...state.categories.map((entry) => entry.sort || 0)) + 1,
      createdAt: now,
      updatedAt: now,
    };
    state.categories.push(category);
    enqueue('CATEGORY_UPSERT', 'category', { category: { ...category } }, category.id);
    saveState();
    toast(`Category “${name}” added.`, { type: 'success' });
    refreshCategoryManager();
  };

  $('[data-cat-add]', dialog)?.addEventListener('click', addCategory);
  $('#new-cat-name', dialog)?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addCategory();
    }
  });

  dialog.addEventListener('click', (event) => {
    const row = event.target.closest('[data-cat-row]');
    if (!row) return;
    const state = getState();
    const category = state.categories.find((entry) => entry.id === row.dataset.catRow);
    if (!category) return;

    if (event.target.closest('[data-cat-save]')) {
      const newName = row.querySelector('[data-cat-name]').value.trim();
      if (newName.length < 2) {
        toast('Category names need at least two characters.', { type: 'error' });
        return;
      }
      if (newName === category.name) {
        toast('That name is unchanged.', { type: 'info', timeout: 1600 });
        return;
      }
      if (state.categories.some((entry) => entry.id !== category.id && entry.name.toLowerCase() === newName.toLowerCase())) {
        toast('Another category already uses that name.', { type: 'error' });
        return;
      }
      category.name = newName;
      category.updatedAt = new Date().toISOString();
      enqueue('CATEGORY_UPSERT', 'category', { category: { ...category } }, category.id);
      saveState();
      toast(`Category renamed to “${newName}”.`, { type: 'success' });
      refreshCategoryManager();
      return;
    }

    if (event.target.closest('[data-cat-delete]')) {
      const count = state.menu.filter((item) => item.categoryId === category.id).length;
      if (count > 0) {
        toast(`Move or delete the ${count} dish(es) in “${category.name}” first.`, { type: 'error' });
        return;
      }
      if (state.categories.length <= 1) {
        toast('At least one category is required.', { type: 'error' });
        return;
      }
      confirmDialog({
        title: `Delete “${category.name}”?`,
        message: 'The empty category will be removed from the menu and POS filters.',
        confirmText: 'Delete category',
        danger: true,
        eyebrow: 'Menu cleanup',
      }).then((confirmed) => {
        if (!confirmed) return;
        const live = getState();
        live.categories = live.categories.filter((entry) => entry.id !== category.id);
        enqueue('CATEGORY_DELETE', 'category', { id: category.id }, category.id);
        saveState();
        toast(`Category “${category.name}” deleted.`, { type: 'warn' });
        refreshCategoryManager();
      });
    }
  });
}







