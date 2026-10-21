import { store } from '../store/syncStore.js';
import { money, escapeHtml } from '../utils/format.js';


const CATEGORY_EMOJI = {
  Burgers: '🍔',
  Sandwiches: '🥪',
  Pizza: '🍕',
  Sides: '🍟',
  Beverages: '🥤',
  Desserts: '🍰'
};

const ICONS = {
  utensils: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v5.5a2.5 2.5 0 0 0 5 0V3"/><path d="M7.5 11v10"/><path d="M18 3c-1.5 1.6-2.3 3.8-2.3 6 0 1.9 1 2.9 2.3 2.9h1V3h-1Z"/><path d="M19 12v9"/></svg>`,
  check: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8.5 12.2 2.4 2.4 4.7-4.9"/></svg>`,
  eyeOff: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6 0 9 7 9 7a16 16 0 0 1-2.2 3"/><path d="M6.3 6.6A15.7 15.7 0 0 0 3 12s3 7 9 7a9.8 9.8 0 0 0 4.6-1.1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="m3 3 18 18"/></svg>`,
  box: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>`,
  receipt: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 2h14v20l-2.3-1.6-2.4 1.6-2.3-1.6L9.7 22 7.3 20.4 5 22V2Z"/><path d="M9 7h6M9 11h6M9 15h4"/></svg>`,
  bag: `<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1.5 14h-15L6 7Z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>`
};

export function kpiCard({ label, value, note, tone = 'peach', icon = '', action = '', small = false }) {
  return `
    <div class="kpi kpi--${tone}">
      <span class="kpi-blob"></span>
      <span class="kpi-watermark">${icon}</span>
      <p class="kpi-label">${label}</p>
      <p class="kpi-value serif${small ? ' small' : ''}">${value}</p>
      <p class="kpi-note">${action || note}</p>
    </div>
  `;
}

const trashIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 15h10l1-15"/><path d="M10 11v6M14 11v6"/></svg>`;

const UNIT_OPTIONS = ['pcs', 'g', 'kg', 'ml', 'l', 'serv', 'pack'];

function recipeRowsHtml(recipe = [], inventory) {
  const rows = (recipe || []).map((r) => {
    const id = r.ingredientId ?? r.ingId;
    const ing = inventory.find((i) => i.id === id);
    const unit = r.unit || (ing ? ing.unit : 'pcs');
    return `<div class="recipe-row flex items-center gap-2 rounded-xl border border-[#e4dbc9] bg-[#fffdf9] p-2">
      <select name="recipe-ing" class="rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2 py-1.5 text-[10px] outline-none focus:border-[#f59e0b] flex-1">
        ${inventory.map((i) => `<option value="${i.id}" ${id === i.id ? 'selected' : ''}>${escapeHtml(i.name)}</option>`).join('')}
      </select>
      <input name="recipe-qty" type="number" step="0.01" min="0" value="${Number(r.qty || 1)}" class="w-20 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2 py-1.5 text-[10px] outline-none focus:border-[#f59e0b]" />
      <select name="recipe-unit" class="w-[76px] shrink-0 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2 py-1.5 text-[10px] outline-none focus:border-[#f59e0b]">
        ${UNIT_OPTIONS.map((u) => `<option value="${u}" ${u === unit ? 'selected' : ''}>${u}</option>`).join('')}
      </select>
      <button type="button" class="mini-btn red" data-remove-recipe-row>${trashIcon}</button>
    </div>`;
  }).join('');
  return rows || `<div class="text-[10px] text-[#8a8578]">No ingredients</div>`;
}

function dishCard(dish) {
  const category = escapeHtml(dish.category);
  const station = escapeHtml(dish.station);
  const ingredientCount = Number(dish.ingredients || (dish.recipe || []).length);
  const emoji = CATEGORY_EMOJI[dish.category] || '🍽';

  return `
    <article class="dish-card">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="dish-cat">${category} · ${station}</p>
          <h3 class="dish-title serif">${escapeHtml(dish.name)}</h3>
        </div>
        <label class="stock-toggle" title="Toggle POS availability">
          <span class="stock-label${dish.available ? '' : ' off'}">${dish.available ? 'In stock' : 'Sold out'}</span>
          <input type="checkbox" data-toggle-dish="${dish.id}" ${dish.available ? 'checked' : ''} aria-label="Toggle availability for ${escapeHtml(dish.name)}" />
          <span class="switch-track"></span>
        </label>
      </div>

      <p class="dish-desc">${escapeHtml(dish.desc || '')}</p>

      <div class="dish-tags">
        <span class="dish-tag">⚙ ${ingredientCount} ingredients</span>
        <span class="dish-tag">🔥 ${station}</span>
        <span class="dish-tag">${emoji} ${category}</span>
      </div>

      <div class="dish-foot">
        <div>
          <p class="dish-price serif">${money(dish.price)}</p>
          <p class="dish-note">${dish.available ? 'Visible on the POS' : 'Hidden from the POS'}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button type="button" data-edit-dish="${dish.id}" class="edit-btn">✎ Edit</button>
          <button type="button" data-del-dish="${dish.id}" class="del-btn" aria-label="Delete ${escapeHtml(dish.name)}">${trashIcon}</button>
        </div>
      </div>
    </article>
  `;
}


function openDishModal(dish = null) {
  const modalRoot = document.getElementById('modal-root');
  const { categories, kitchenStations, inventory } = store.state;
  const isEdit = Boolean(dish);
  const isAdmin = store.state.currentUser?.role === 'Admin';

  modalRoot.innerHTML = `
    <div class="modal-shell">
      <form id="dish-form" class="modal-panel space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">${isEdit ? 'Edit dish' : 'Add a dish'}</h3>
            <p class="modal-sub">${isEdit ? 'Update the listing, station and recipe link.' : 'Publish a new dish to the POS menu.'}</p>
          </div>
          <button type="button" id="close-dish-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <div class="field">
            <label for="dish-code">Code</label>
            <input id="dish-code" name="code" required value="${escapeHtml(dish?.code || 'BG-09')}" />
          </div>
          <div class="field col-span-2">
            <label for="dish-name">Dish name</label>
            <input id="dish-name" name="name" required value="${escapeHtml(dish?.name || '')}" placeholder="e.g. Smoked Brisket Bun" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field flex items-baseline gap-2">
            <label for="dish-category">Category</label>${isAdmin ? `<button type="button" data-manage="categories" class="manage-btn" title="Manage food categories">⚙️ Manage</button>` : ''}
            <select id="dish-category" name="category">
              ${categories.map((category) => `<option value="${escapeHtml(category)}" ${dish?.category === category ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('')}
            </select>
          </div>
          <div class="field flex items-baseline gap-2">
            <label for="dish-station">Kitchen station</label>${isAdmin ? `<button type="button" data-manage="stations" class="manage-btn" title="Manage kitchen stations">⚙️ Manage</button>` : ''}
            <select id="dish-station" name="station">
              ${kitchenStations.map((station) => `<option value="${station}" ${dish?.station === station ? 'selected' : ''}>${station}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div class="field">
            <label for="dish-price">Selling price (৳)</label>
            <input id="dish-price" name="price" type="number" step="0.01" min="0" required value="${Number(dish?.price ?? 12.5)}" />
          </div>
          <div class="field">
            <label for="dish-cost">Unit cost (৳)</label>
            <input id="dish-cost" name="cost" type="number" step="0.01" min="0" required value="${Number(dish?.cost ?? 4)}" />
          </div>
        </div>

        <div class="field">
          <label for="dish-desc">Description</label>
          <textarea id="dish-desc" name="desc" placeholder="Short menu description shown on the dish card...">${escapeHtml(dish?.desc || '')}</textarea>
        </div>

        <div class="field flex items-baseline gap-2">
          <label>Recipe Ingredients & Quantities</label>${isAdmin ? `<button type="button" data-manage="ingredients" class="manage-btn" title="Manage recipe ingredients">⚙️ Manage</button>` : ''}
        </div>
        <div id="recipe-rows" class="space-y-2">
          ${recipeRowsHtml(dish?.recipe, inventory)}
        </div>
        <div class="field">
          <button type="button" id="add-recipe-row" class="btn-cream" style="width:fit-content;padding:7px 14px">+ Add ingredient</button>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button type="button" id="close-dish-modal" class="btn-cream">Cancel</button>
          <button type="submit" class="btn-primary">Save dish</button>
        </div>
      </form>
    </div>
  `;

  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('close-dish-x').onclick = close;
  document.getElementById('close-dish-modal').onclick = close;

  document.getElementById('dish-form').onsubmit = (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const recipeLines = [];
    document.querySelectorAll('.recipe-row').forEach((row) => {
      const ingId = row.querySelector('[name="recipe-ing"]').value;
      const qty = Number(row.querySelector('[name="recipe-qty"]').value || 1);
      const ing = inventory.find((i) => i.id === ingId);
      const unitSelect = row.querySelector('[name="recipe-unit"]');
      if (ingId) recipeLines.push({ ingredientId: ingId, name: ing ? ing.name : '', qty, unit: (unitSelect && unitSelect.value) || (ing ? ing.unit : '') });
    });
    const payload = {
      id: dish?.id || 'm' + Date.now(),
      code: String(fd.get('code') || '').trim(),
      name: String(fd.get('name') || '').trim(),
      category: fd.get('category'),
      station: fd.get('station'),
      price: Number(fd.get('price')),
      cost: Number(fd.get('cost')),
      available: dish ? dish.available : true,
      desc: String(fd.get('desc') || '').trim(),
      ingredients: recipeLines.length,
      recipe: recipeLines
    };
    store.mutate(isEdit ? 'EDIT_DISH' : 'ADD_DISH', (state) => {
      if (isEdit) {
        const index = state.menu.findIndex((item) => item.id === dish.id);
        if (index > -1) state.menu[index] = payload;
      } else {
        state.menu.unshift(payload);
      }
    }, payload);
    modalRoot.innerHTML = '';
  };

  modalRoot.querySelectorAll('[data-manage]').forEach((btn) => {
    btn.onclick = () => {
      modalRoot.innerHTML = '';
      openManageModal(btn.dataset.manage);
    };
  });

  const readRecipeRows = () => {
    const rows = [];
    document.querySelectorAll('.recipe-row').forEach((row) => {
      const ingId = row.querySelector('[name="recipe-ing"]').value;
      const qty = Number(row.querySelector('[name="recipe-qty"]').value || 1);
      const ing = inventory.find((i) => i.id === ingId);
      const unit = row.querySelector('[name="recipe-unit"]').value;
      if (ingId) rows.push({ ingredientId: ingId, name: ing ? ing.name : '', qty, unit: unit || (ing ? ing.unit : '') });
    });
    return rows;
  };

  const refreshRecipeRows = (nextRows) => {
    const rows = nextRows || readRecipeRows();
    document.getElementById('recipe-rows').innerHTML = recipeRowsHtml(rows, inventory);
    bindRecipeRowControls();
  };
  const bindRecipeRowControls = () => {
    document.querySelectorAll('[data-remove-recipe-row]').forEach((btn) => {
      btn.onclick = () => { btn.closest('.recipe-row').remove(); refreshRecipeRows(); };
    });
    document.querySelectorAll('[name="recipe-ing"]').forEach((select) => {
      select.onchange = () => {
        const row = select.closest('.recipe-row');
        const ing = inventory.find((i) => i.id === select.value);
        const unitSelect = row.querySelector('[name="recipe-unit"]');
        if (ing && unitSelect && Array.from(unitSelect.options).some((o) => o.value === ing.unit)) {
          unitSelect.value = ing.unit;
        }
      };
    });
  };
  bindRecipeRowControls();
  document.getElementById('add-recipe-row').onclick = () => {
    refreshRecipeRows([...readRecipeRows(), { ingredientId: '', name: '', qty: 1, unit: 'pcs' }]);
  };
}


function openCategoryModal() {
  const modalRoot = document.getElementById('modal-root');
  const { categories, menu } = store.state;

  modalRoot.innerHTML = `
    <div class="modal-shell">
      <div class="modal-panel space-y-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">Categories</h3>
            <p class="modal-sub">${categories.length} categories · ${menu.length} dishes</p>
          </div>
          <button type="button" id="close-cat-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="space-y-1.5">
          ${categories.map((category) => {
            const count = menu.filter((dish) => dish.category === category).length;
            return `
              <div class="flex items-center justify-between rounded-xl border border-[#ece4d6] bg-[#fffdf9] px-3 py-2">
                <div class="flex items-center gap-2">
                  <span class="text-[13px]">${CATEGORY_EMOJI[category] || '🍽'}</span>
                  <div>
                    <p class="text-[11px] font-semibold text-[#1c1a17]">${escapeHtml(category)}</p>
                    <p class="text-[8.5px] text-[#a39c8d]">${count} ${count === 1 ? 'dish' : 'dishes'}</p>
                  </div>
                </div>
                <button type="button" data-del-cat="${escapeHtml(category)}" class="mini-btn red">Remove</button>
              </div>
            `;
          }).join('')}
        </div>

        <form id="add-cat-form" class="flex gap-2 border-t border-[#ece4d6] pt-3">
          <input name="catName" required placeholder="New category name..." class="min-w-0 flex-1 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2.5 py-2 text-[11px] outline-none focus:border-[#f59e0b]" />
          <button type="submit" class="btn-dark">Add</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('close-cat-x').onclick = () => { modalRoot.innerHTML = ''; };

  modalRoot.querySelectorAll('[data-del-cat]').forEach((btn) => {
    btn.onclick = () => {
      store.mutate('REMOVE_CATEGORY', (state) => {
        state.categories = state.categories.filter((category) => category !== btn.dataset.delCat);
      }, { category: btn.dataset.delCat });
      openCategoryModal();
    };
  });

  document.getElementById('add-cat-form').onsubmit = (event) => {
    event.preventDefault();
    const value = String(new FormData(event.target).get('catName') || '').trim();
    if (value && !store.state.categories.includes(value)) {
      store.mutate('ADD_CATEGORY', (state) => { state.categories.push(value); }, { category: value });
      openCategoryModal();
    }
  };
}


function openManageModal(kind = 'categories') {
  const modalRoot = document.getElementById('modal-root');
  const { categories, kitchenStations, inventory, menu } = store.state;

  const domains = [
    { key: 'categories', label: 'Food categories' },
    { key: 'stations', label: 'Kitchen stations' },
    { key: 'ingredients', label: 'Recipe ingredients' }
  ];
  const domain = domains.find((d) => d.key === kind) || domains[0];
  const items = kind === 'categories' ? categories : kind === 'stations' ? kitchenStations : inventory;

  const usageCount = (value) => {
    if (kind === 'categories') return menu.filter((dish) => dish.category === value).length;
    if (kind === 'stations') return menu.filter((dish) => dish.station === value).length;
    return menu.filter((dish) => Array.isArray(dish.recipe) && dish.recipe.some((line) => (line.ingredientId ?? line.ingId) === value)).length;
  };

  const itemName = (item) => (kind === 'ingredients' ? item.name : item);
  const itemId = (item) => (kind === 'ingredients' ? item.id : item);
  let renaming = null; // { kind, id, name }

  modalRoot.innerHTML = `
    <div class="modal-shell">
      <form id="manage-form" class="modal-panel space-y-3" style="max-width:540px">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="modal-title serif">Manage Options</h3>
            <p class="modal-sub">Updates dish dropdowns, filter pills and cards everywhere.</p>
          </div>
          <button type="button" id="close-mgr-x" class="mini-btn" aria-label="Close">✕</button>
        </div>

        <div class="seg" role="group" aria-label="Manage domain">
          ${domains.map((d) => `<button type="button" data-mgr-tab="${d.key}" class="seg-btn${d.key === kind ? ' is-active' : ''}">${d.label}</button>`).join('')}
        </div>

        <div class="space-y-1.5">
          ${items.length
            ? items.map((item) => {
                const name = itemName(item);
                const key = itemId(item);
                const used = usageCount(key);
                return `
                  <div class="flex items-center justify-between rounded-xl border border-[#ece4d6] bg-[#fffdf9] px-3 py-2 gap-2">
                    <p class="text-[11px] font-semibold text-[#1c1a17] truncate flex-1">${escapeHtml(name)}${used ? ` <span class="text-[9px] text-[#a39c8d]">${used} dish${used === 1 ? '' : 's'}</span>` : ''}</p>
                    <div class="flex items-center gap-1">
                      ${renaming && renaming.kind === kind && renaming.id === key
                        ? `<input name="rename-value" value="${escapeHtml(name)}" class="rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2 py-1.5 text-[10px] outline-none focus:border-[#f59e0b] w-40" /><button type="button" data-mgr-save-rename="${kind}" data-mgr-id="${escapeHtml(String(key))}" class="mini-btn green">Save</button><button type="button" data-mgr-cancel-rename="${kind}" data-mgr-id="${escapeHtml(String(key))}" class="mini-btn">Cancel</button>`
                        : `<button type="button" data-mgr-rename="${kind}" data-mgr-id="${escapeHtml(String(key))}" data-mgr-name="${escapeHtml(name)}" class="mini-btn">Rename</button>`}
                      <button type="button" data-mgr-delete="${kind}" data-mgr-id="${escapeHtml(String(key))}" data-mgr-name="${escapeHtml(name)}" class="mini-btn red">${trashIcon}</button>
                    </div>
                  </div>
                `;
              }).join('')
            : `<p class="text-[10px] text-[#8a8578]">None yet</p>`}
        </div>

        <form id="mgr-add-${kind}" class="flex gap-2 border-t border-[#ece4d6] pt-3">
          ${kind === 'ingredients'
            ? `<input name="name" required placeholder="Ingredient name" class="min-w-0 flex-1 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2.5 py-2 text-[11px] outline-none focus:border-[#f59e0b]" /><select name="unit" class="rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2.5 py-2 text-[11px] outline-none focus:border-[#f59e0b]"><option>pcs</option><option>slice</option><option>g</option><option>kg</option><option>L</option><option>ml</option><option>serv</option></select>`
            : `<input name="value" required placeholder="New ${domain.label.toLowerCase()}..." class="min-w-0 flex-1 rounded-lg border border-[#e4dbc9] bg-[#fffdf9] px-2.5 py-2 text-[11px] outline-none focus:border-[#f59e0b]" />`}
          <button type="submit" class="btn-dark">Add</button>
        </form>
      </form>
    </div>
  `;

  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('close-mgr-x').onclick = close;

  modalRoot.querySelectorAll('[data-mgr-tab]').forEach((btn) => {
    btn.onclick = () => openManageModal(btn.dataset.mgrTab);
  });

  modalRoot.querySelectorAll('[data-mgr-delete]').forEach((btn) => {
    btn.onclick = () => {
      const key = btn.dataset.mgrDelete;
      const id = btn.dataset.mgrId;
      const name = btn.dataset.mgrName;
      const state = store.state;

      const used = usageCount(id);
      if (key === 'categories') {
        if (state.categories.length <= 1) { window.alert('Keep at least one food category.'); return; }
        const replacement = state.categories.find((c) => c !== name);
        if (used && !window.confirm('Delete "' + name + '"? ' + used + ' dish' + (used === 1 ? '' : 's') + ' will be moved to "' + replacement + '".')) return;
      } else if (key === 'stations') {
        if (state.kitchenStations.length <= 1) { window.alert('Keep at least one kitchen station.'); return; }
        const replacement = state.kitchenStations.find((s) => s !== name);
        if (used && !window.confirm('Delete "' + name + '"? ' + used + ' dish' + (used === 1 ? '' : 's') + ' will be moved to "' + replacement + '".')) return;
      } else {
        if (state.inventory.length <= 1) { window.alert('Keep at least one ingredient.'); return; }
        if (used && !window.confirm('Delete "' + name + '"? ' + used + ' dish' + (used === 1 ? '' : 's') + ' use it; their recipe lines will be removed.')) return;
      }

      store.mutate(`MANAGE_DELETE_${key.toUpperCase()}`, (state) => {
        if (key === 'categories') {
          const replacement = state.categories.find((c) => c !== name);
          state.menu.forEach((dish) => { if (dish.category === name) dish.category = replacement; });
          state.categories = state.categories.filter((c) => c !== name);
        } else if (key === 'stations') {
          const replacement = state.kitchenStations.find((s) => s !== name);
          state.menu.forEach((dish) => { if (dish.station === name) dish.station = replacement; });
          state.kitchenStations = state.kitchenStations.filter((s) => s !== name);
        } else {
          state.inventory = state.inventory.filter((item) => item.id !== id);
          state.menu.forEach((dish) => {
            if (!Array.isArray(dish.recipe)) return;
            const kept = dish.recipe.filter((line) => (line.ingredientId ?? line.ingId) !== id);
            if (kept.length !== dish.recipe.length) {
              dish.recipe = kept;
              dish.ingredients = Math.max(1, kept.length);
            }
          });
        }
      }, { key, id, name });
      openManageModal(kind);
    };
  });

  modalRoot.querySelectorAll('[data-mgr-rename]').forEach((btn) => {
    btn.onclick = () => {
      renaming = { kind, id: btn.dataset.mgrId, name: btn.dataset.mgrName };
      openManageModal(kind);
    };
  });
  modalRoot.querySelectorAll('[data-mgr-save-rename]').forEach((btn) => {
    btn.onclick = () => {
      const key = btn.dataset.mgrSaveRename;
      const id = btn.dataset.mgrId;
      const input = modalRoot.querySelector('input[name="rename-value"]');
      if (!input) return;
      const value = String(input.value || '').trim();
      const name = (renaming && renaming.id === id && renaming.kind === kind) ? renaming.name : '';
      if (!value || value === name) { renaming = null; openManageModal(kind); return; }
      if (key !== 'ingredients' && store.state[key].includes(value)) { window.alert('That name already exists.'); return; }

      store.mutate(`MANAGE_RENAME_${key.toUpperCase()}`, (state) => {
        if (key === 'categories' || key === 'stations') {
          state[key] = state[key].map((v) => (v === name ? value : v));
          state.menu.forEach((dish) => {
            if (key === 'categories' && dish.category === name) dish.category = value;
            if (key === 'stations' && dish.station === name) dish.station = value;
          });
        } else {
          const item = state.inventory.find((item) => item.id === id);
          if (item) {
            item.name = value;
            state.menu.forEach((dish) => {
              if (Array.isArray(dish.recipe)) dish.recipe.forEach((line) => { if ((line.ingredientId ?? line.ingId) === id) line.name = value; });
            });
          }
        }
      }, { key, id, name, value });
      renaming = null;
      openManageModal(kind);
    };
  });
  modalRoot.querySelectorAll('[data-mgr-cancel-rename]').forEach((btn) => {
    btn.onclick = () => { renaming = null; openManageModal(kind); };
  });

  const addForm = document.getElementById(`mgr-add-${kind}`);
  addForm.onsubmit = (event) => {
    event.preventDefault();
    const fd = new FormData(event.target);
    const state = store.state;
    if (kind === 'ingredients') {
      const name = String(fd.get('name') || '').trim();
      const unit = String(fd.get('unit') || 'pcs');
      if (!name) return;
      if (state.inventory.some((item) => item.name.toLowerCase() === name.toLowerCase())) { window.alert('That ingredient already exists.'); return; }
      store.mutate('MANAGE_ADD_INGREDIENTS', (state) => {
        state.inventory.push({ id: 'ing-' + Date.now(), name, unit, qty: 0, minAlert: 0, unitCost: 0, supplier: '' });
      }, { kind, name, unit });
    } else {
      const value = String(fd.get('value') || '').trim();
      if (!value || state[kind].includes(value)) return;
      store.mutate(`MANAGE_ADD_${kind.toUpperCase()}`, (state) => { state[kind].push(value); }, { kind, value });
    }
    openManageModal(kind);
  };
}


export function renderMenuView(container, uiState, rerender) {
  const menu = Array.isArray(store.state.menu) ? store.state.menu : [];
  const categories = Array.isArray(store.state.categories) ? store.state.categories : [];
  const query = String(uiState.menuSearch || '').trim().toLowerCase();
  const category = uiState.menuCat || 'All';
  const availability = uiState.menuAvail || 'All';

  const filtered = menu.filter((dish) => {
    const haystack = `${dish.name} ${dish.code} ${dish.category} ${dish.station}`.toLowerCase();
    const matchQuery = !query || haystack.includes(query);
    const matchCategory = category === 'All' || dish.category === category;
    const matchAvailability =
      availability === 'All' ||
      (availability === 'InStock' ? dish.available : !dish.available);
    return matchQuery && matchCategory && matchAvailability;
  });

  const availableCount = menu.filter((dish) => dish.available).length;
  const soldOutCount = menu.length - availableCount;
  const canEdit = ['Admin', 'Manager', 'Chef'].includes(store.state.currentUser?.role);
  const availabilityOptions = [
    { key: 'All', label: 'All' },
    { key: 'InStock', label: 'Available' },
    { key: 'SoldOut', label: 'Sold out' }
  ];

  container.innerHTML = `
    <div class="pb-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="serif text-[30px] font-bold leading-[1.08] text-[#1c1a17]">Food menu</h2>
          <p class="mt-1.5 text-[11.5px] text-[#8a8578]">Read-only access. Chefs, managers and admins can edit the menu.</p>
        </div>
        ${canEdit ? '<button type="button" id="open-add-dish" class="btn-primary mt-1">+ Add dish</button>' : ''}
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        ${kpiCard({
          label: 'Dishes',
          value: menu.length,
          tone: 'peach',
          icon: ICONS.utensils,
          action: `<button type="button" id="open-cat-mgr">${categories.length} categories</button>`
        })}
        ${kpiCard({
          label: 'Available',
          value: availableCount,
          note: 'Orderable right now',
          tone: 'mint',
          icon: ICONS.check
        })}
        ${kpiCard({
          label: 'Sold out',
          value: soldOutCount,
          note: 'Hidden from the POS',
          tone: 'pink',
          icon: ICONS.eyeOff
        })}
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-2.5">
        <label class="filter-search" for="menu-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>
          <input id="menu-search" type="text" autocomplete="off" value="${escapeHtml(uiState.menuSearch || '')}" placeholder="Search dishes, stations, categories..." />
        </label>

        <div class="filter-select">
          <select id="menu-cat-filter" aria-label="Filter by category">
            <option value="All" ${category === 'All' ? 'selected' : ''}>All categories</option>
            ${categories.map((item) => `<option value="${escapeHtml(item)}" ${category === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
          </select>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </div>

        <div class="seg" role="group" aria-label="Availability">
          ${availabilityOptions.map((option) => `<button type="button" data-avail="${option.key}" class="seg-btn${availability === option.key ? ' is-active' : ''}">${option.label}</button>`).join('')}
        </div>

        <span class="count-badge">${filtered.length} DISHES</span>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        ${filtered.map(dishCard).join('')}
        ${filtered.length === 0 ? `
          <div class="col-span-1 rounded-2xl border border-dashed border-[#ddd3bf] bg-[#faf6ee] px-6 py-14 text-center sm:col-span-2 lg:col-span-3">
            <p class="serif text-lg font-bold text-[#1c1a17]">No dishes match this view</p>
            <p class="mt-1 text-[10.5px] text-[#8a8578]">Try another search, category or availability filter.</p>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  const categoryLink = document.getElementById('open-cat-mgr');
  if (categoryLink) categoryLink.onclick = openCategoryModal;

  const headerManage = document.getElementById('header-manage-options');
  if (headerManage) headerManage.onclick = () => openManageModal('categories');

  const addDishBtn = document.getElementById('open-add-dish');
  if (addDishBtn) addDishBtn.onclick = () => openDishModal();

  const search = document.getElementById('menu-search');
  search.oninput = (event) => {
    uiState.menuSearch = event.target.value;
    rerender();
    const next = document.getElementById('menu-search');
    if (next) {
      next.focus();
      const end = next.value.length;
      next.setSelectionRange(end, end);
    }
  };

  document.getElementById('menu-cat-filter').onchange = (event) => {
    uiState.menuCat = event.target.value;
    rerender();
  };

  container.querySelectorAll('[data-avail]').forEach((btn) => {
    btn.onclick = () => {
      uiState.menuAvail = btn.dataset.avail;
      rerender();
    };
  });

  container.querySelectorAll('[data-toggle-dish]').forEach((input) => {
    input.onchange = () => {
      store.mutate('TOGGLE_DISH_STOCK', (state) => {
        const target = state.menu.find((dish) => dish.id === input.dataset.toggleDish);
        if (target) target.available = input.checked;
      }, { dishId: input.dataset.toggleDish, available: input.checked });
    };
  });

  container.querySelectorAll('[data-edit-dish]').forEach((btn) => {
    btn.onclick = () => {
      const target = menu.find((dish) => dish.id === btn.dataset.editDish);
      if (target) openDishModal(target);
    };
  });

  container.querySelectorAll('[data-del-dish]').forEach((btn) => {
    btn.onclick = () => {
      const target = menu.find((dish) => dish.id === btn.dataset.delDish);
      if (!target) return;
      if (!window.confirm(`Delete "${target.name}" from the menu?`)) return;
      store.mutate('DELETE_DISH', (state) => {
        state.menu = state.menu.filter((dish) => dish.id !== target.id);
      }, { dishId: target.id });
    };
  });
}

