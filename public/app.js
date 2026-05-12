(function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────────────────────

  const IN_TO_CM = 2.54;

  const CATEGORY_LABELS = {
    sofa: 'Sofa', bed: 'Bed', table: 'Table', chair: 'Chair',
    desk: 'Desk', dresser: 'Dresser', shelf: 'Shelf', other: 'Other',
  };

  const WALL_LABELS = { N: 'North', S: 'South', E: 'East', W: 'West' };

  // ─── State ─────────────────────────────────────────────────────────────────

  const State = {
    unit: 'in',
    furniture: [],
    rooms: [],
    editingFurnitureId: null,
    editingRoomId: null,
    floorplan: {
      roomId:     null,
      placements: [],
      selectedId: null,
      dragging:   null,   // { id, offsetX(ft), offsetY(ft) }
      scale:      1,
    },
  };

  // ─── Storage Layer (localStorage) ──────────────────────────────────────────

  const LS_FURNITURE = 'ma_furniture';
  const LS_ROOMS     = 'ma_rooms';

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function lsGet(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
  }

  function lsSet(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function getFurniture() {
    return Promise.resolve({ items: lsGet(LS_FURNITURE) });
  }

  function createFurniture(input) {
    const items = lsGet(LS_FURNITURE);
    const now = new Date().toISOString();
    const item = {
      id: genId(),
      name: input.name.trim(),
      category: input.category,
      width: Number(input.width),
      depth: Number(input.depth),
      height: Number(input.height),
      unit: input.unit,
      weight: input.weight != null && input.weight !== '' ? Number(input.weight) : null,
      notes: input.notes ? input.notes.trim() : null,
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    lsSet(LS_FURNITURE, items);
    return Promise.resolve({ item });
  }

  function updateFurniture(id, input) {
    const items = lsGet(LS_FURNITURE);
    const idx = items.findIndex(f => f.id === id);
    if (idx === -1) return Promise.reject(new Error('Not found'));
    const item = {
      ...items[idx],
      name: input.name.trim(),
      category: input.category,
      width: Number(input.width),
      depth: Number(input.depth),
      height: Number(input.height),
      unit: input.unit,
      weight: input.weight != null && input.weight !== '' ? Number(input.weight) : null,
      notes: input.notes ? input.notes.trim() : null,
      updatedAt: new Date().toISOString(),
    };
    items[idx] = item;
    lsSet(LS_FURNITURE, items);
    return Promise.resolve({ item });
  }

  function deleteFurniture(id) {
    const items = lsGet(LS_FURNITURE);
    const idx = items.findIndex(f => f.id === id);
    if (idx === -1) return Promise.reject(new Error('Not found'));
    items.splice(idx, 1);
    lsSet(LS_FURNITURE, items);
    return Promise.resolve({ id });
  }

  function getRooms() {
    return Promise.resolve({ items: lsGet(LS_ROOMS) });
  }

  function createRoom(input) {
    const items = lsGet(LS_ROOMS);
    const now = new Date().toISOString();
    const item = {
      id: genId(),
      name: input.name.trim(),
      width: Number(input.width),
      depth: Number(input.depth),
      wallFeatures: (input.wallFeatures || []).map(wf => ({
        id: genId(),
        type: wf.type,
        wall: wf.wall,
        offset: Number(wf.offset),
        width: Number(wf.width),
        label: wf.label ? wf.label.trim() : null,
      })),
      layout: [],
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    lsSet(LS_ROOMS, items);
    return Promise.resolve({ item });
  }

  function updateRoom(id, input) {
    const items = lsGet(LS_ROOMS);
    const idx = items.findIndex(r => r.id === id);
    if (idx === -1) return Promise.reject(new Error('Not found'));
    const existing = items[idx];
    const item = {
      ...existing,
      name: input.name.trim(),
      width: Number(input.width),
      depth: Number(input.depth),
      wallFeatures: (input.wallFeatures || []).map(wf => ({
        id: wf.id || genId(),
        type: wf.type,
        wall: wf.wall,
        offset: Number(wf.offset),
        width: Number(wf.width),
        label: wf.label ? wf.label.trim() : null,
      })),
      layout: Array.isArray(input.layout) ? input.layout : existing.layout,
      updatedAt: new Date().toISOString(),
    };
    items[idx] = item;
    lsSet(LS_ROOMS, items);
    return Promise.resolve({ item });
  }

  function deleteRoom(id) {
    const items = lsGet(LS_ROOMS);
    const idx = items.findIndex(r => r.id === id);
    if (idx === -1) return Promise.reject(new Error('Not found'));
    items.splice(idx, 1);
    lsSet(LS_ROOMS, items);
    return Promise.resolve({ id });
  }

  function seedDefaultData() {
    if (localStorage.getItem(LS_FURNITURE) !== null) return;

    const now = new Date().toISOString();
    const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

    const furniture = [
      { id: id(), name: 'KIVIK Sofa',        category: 'sofa',    width: 90,  depth: 37, height: 33, unit: 'in', weight: 132, notes: 'IKEA 3-seat sofa',          createdAt: now, updatedAt: now },
      { id: id(), name: 'MALM Bed Frame',     category: 'bed',     width: 64,  depth: 84, height: 15, unit: 'in', weight: 176, notes: 'IKEA queen bed frame',       createdAt: now, updatedAt: now },
      { id: id(), name: 'HEMNES Coffee Table',category: 'table',   width: 46,  depth: 22, height: 18, unit: 'in', weight: 44,  notes: 'IKEA rectangular table',    createdAt: now, updatedAt: now },
      { id: id(), name: 'KALLAX Bookshelf',   category: 'shelf',   width: 57,  depth: 15, height: 30, unit: 'in', weight: 97,  notes: 'IKEA 4×2 shelf unit',       createdAt: now, updatedAt: now },
    ];

    const rooms = [
      {
        id: id(), name: 'Living Room', width: 16, depth: 14, layout: [],
        wallFeatures: [
          { id: id(), type: 'door',   wall: 'S', offset: 2, width: 3, label: 'Main door' },
          { id: id(), type: 'window', wall: 'N', offset: 4, width: 5, label: 'Front window' },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        id: id(), name: 'Bedroom', width: 12, depth: 11, layout: [],
        wallFeatures: [
          { id: id(), type: 'door',   wall: 'W', offset: 1, width: 3, label: 'Entry door' },
          { id: id(), type: 'window', wall: 'N', offset: 3, width: 4, label: 'Window' },
        ],
        createdAt: now, updatedAt: now,
      },
      {
        id: id(), name: 'Kitchen', width: 10, depth: 8, layout: [],
        wallFeatures: [
          { id: id(), type: 'door',   wall: 'E', offset: 1, width: 3, label: 'Kitchen door' },
          { id: id(), type: 'window', wall: 'S', offset: 2, width: 3, label: 'Kitchen window' },
        ],
        createdAt: now, updatedAt: now,
      },
    ];

    lsSet(LS_FURNITURE, furniture);
    lsSet(LS_ROOMS, rooms);
  }

  // ─── Unit Utilities ─────────────────────────────────────────────────────────

  function convertDimension(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;
    return toUnit === 'cm'
      ? parseFloat((value * IN_TO_CM).toFixed(1))
      : parseFloat((value / IN_TO_CM).toFixed(2));
  }

  function formatDim(value, unit) {
    return `${value} ${unit}`;
  }

  function unitLabel(unit) {
    return unit === 'in' ? 'inches' : 'centimeters';
  }

  // ─── DOM Helpers ───────────────────────────────────────────────────────────

  function el(id) { return document.getElementById(id); }

  function clearError(fieldId) {
    const errEl = el(fieldId + '-error');
    if (errEl) errEl.textContent = '';
    const input = el(fieldId);
    if (input) input.classList.remove('error');
  }

  function showError(fieldId, msg) {
    const errEl = el(fieldId + '-error');
    if (errEl) errEl.textContent = msg;
    const input = el(fieldId);
    if (input) input.classList.add('error');
  }

  function showToast(msg, isError) {
    if (isError) { alert('Error: ' + msg); return; }
    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
  }

  // ─── Unit Toggle ───────────────────────────────────────────────────────────

  function updateUnitUI() {
    const btn = el('toggle-units');
    btn.textContent = State.unit === 'in' ? 'Switch to cm' : 'Switch to in';
    const unitLabelEls = document.querySelectorAll('.unit-label');
    unitLabelEls.forEach(span => {
      span.textContent = '(' + unitLabel(State.unit) + ')';
    });
  }

  function initUnitToggle() {
    State.unit = localStorage.getItem('unit') || 'in';
    updateUnitUI();

    el('toggle-units').addEventListener('click', () => {
      State.unit = State.unit === 'in' ? 'cm' : 'in';
      localStorage.setItem('unit', State.unit);
      updateUnitUI();
      renderFurnitureGrid();
    });
  }

  // ─── Tab Navigation ────────────────────────────────────────────────────────

  function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (btn) btn.classList.add('active');
    const panel = el('tab-' + tabName);
    if (panel) panel.classList.add('active');
  }

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    el('home-get-started').addEventListener('click', () => switchTab('inventory'));
    const hash = window.location.hash.slice(1);
    if (hash && document.querySelector(`.tab-btn[data-tab="${hash}"]`)) switchTab(hash);
  }

  // ─── Furniture UI ──────────────────────────────────────────────────────────

  function renderFurnitureGrid() {
    const grid = el('furniture-grid');
    const empty = el('furniture-empty');
    grid.innerHTML = '';

    if (State.furniture.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    State.furniture.forEach(item => grid.appendChild(buildFurnitureCard(item)));
  }

  function buildFurnitureCard(item) {
    const w = convertDimension(item.width,  item.unit, State.unit);
    const d = convertDimension(item.depth,  item.unit, State.unit);
    const h = convertDimension(item.height, item.unit, State.unit);

    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-top">
        <span class="card-title">${escHtml(item.name)}</span>
        <span class="badge">${escHtml(CATEGORY_LABELS[item.category] || item.category)}</span>
      </div>
      <div class="card-body">
        <div class="card-detail">
          <strong>W</strong> ${formatDim(w, State.unit)} &nbsp;
          <strong>D</strong> ${formatDim(d, State.unit)} &nbsp;
          <strong>H</strong> ${formatDim(h, State.unit)}
        </div>
        ${item.weight != null ? `<div class="card-detail"><strong>Weight</strong> ${item.weight} lbs</div>` : ''}
        ${item.notes ? `<div class="card-notes">${escHtml(item.notes)}</div>` : ''}
      </div>
      <div class="card-actions">
        <button class="btn btn--secondary btn--sm edit-furniture" data-id="${item.id}">Edit</button>
        <button class="btn btn--ghost-danger btn--sm delete-furniture" data-id="${item.id}">Delete</button>
      </div>
    `;

    card.querySelector('.edit-furniture').addEventListener('click', () => openFurnitureModal(item));
    card.querySelector('.delete-furniture').addEventListener('click', () => handleFurnitureDelete(item.id));
    return card;
  }

  function openFurnitureModal(item) {
    State.editingFurnitureId = item ? item.id : null;
    el('furniture-modal-title').textContent = item ? 'Edit Furniture' : 'Add Furniture';

    // Clear errors
    ['f-name', 'f-category', 'f-dims'].forEach(clearError);

    if (item) {
      el('furniture-id').value = item.id;
      el('f-name').value = item.name;
      el('f-category').value = item.category;
      // Convert dimensions to display unit
      el('f-width').value  = convertDimension(item.width,  item.unit, State.unit);
      el('f-depth').value  = convertDimension(item.depth,  item.unit, State.unit);
      el('f-height').value = convertDimension(item.height, item.unit, State.unit);
      el('f-weight').value = item.weight != null ? item.weight : '';
      el('f-notes').value  = item.notes || '';
    } else {
      el('furniture-form').reset();
      el('furniture-id').value = '';
    }

    el('furniture-modal').classList.remove('hidden');
    el('f-name').focus();
  }

  function closeFurnitureModal() {
    el('furniture-modal').classList.add('hidden');
    State.editingFurnitureId = null;
  }

  function readFurnitureForm() {
    return {
      name:     el('f-name').value.trim(),
      category: el('f-category').value,
      width:    parseFloat(el('f-width').value),
      depth:    parseFloat(el('f-depth').value),
      height:   parseFloat(el('f-height').value),
      unit:     State.unit,
      weight:   el('f-weight').value !== '' ? parseFloat(el('f-weight').value) : null,
      notes:    el('f-notes').value.trim() || null,
    };
  }

  function validateFurnitureForm(data) {
    let valid = true;
    if (!data.name) { showError('f-name', 'Name is required'); valid = false; }
    else clearError('f-name');
    if (!data.category) { showError('f-category', 'Category is required'); valid = false; }
    else clearError('f-category');
    if (isNaN(data.width) || data.width <= 0 ||
        isNaN(data.depth) || data.depth <= 0 ||
        isNaN(data.height) || data.height <= 0) {
      showError('f-dims', 'Width, depth, and height must be positive numbers');
      valid = false;
    } else {
      clearError('f-dims');
    }
    return valid;
  }

  async function handleFurnitureSubmit(e) {
    e.preventDefault();
    const data = readFurnitureForm();
    if (!validateFurnitureForm(data)) return;

    try {
      if (State.editingFurnitureId) {
        const res = await updateFurniture(State.editingFurnitureId, data);
        const idx = State.furniture.findIndex(f => f.id === State.editingFurnitureId);
        if (idx !== -1) State.furniture[idx] = res.item;
      } else {
        const res = await createFurniture(data);
        State.furniture.push(res.item);
      }
      closeFurnitureModal();
      renderFurnitureGrid();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleFurnitureDelete(id) {
    const item = State.furniture.find(f => f.id === id);
    if (!item) return;
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await deleteFurniture(id);
      State.furniture = State.furniture.filter(f => f.id !== id);
      renderFurnitureGrid();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ─── Room UI ────────────────────────────────────────────────────────────────

  function renderRoomsGrid() {
    const grid = el('rooms-grid');
    const empty = el('rooms-empty');
    grid.innerHTML = '';

    if (State.rooms.length === 0) {
      empty.classList.remove('hidden');
      return;
    }
    empty.classList.add('hidden');
    State.rooms.forEach(room => grid.appendChild(buildRoomCard(room)));
  }

  function buildRoomCard(room) {
    const card = document.createElement('div');
    card.className = 'card';

    const wfHtml = room.wallFeatures.length === 0
      ? '<div class="card-detail" style="color:var(--color-text-muted)">No wall features</div>'
      : `<ul class="wall-feature-list">${room.wallFeatures.map(wf => `
          <li class="wall-feature-item">
            <span class="badge badge--${wf.type}">${wf.type}</span>
            ${WALL_LABELS[wf.wall]} wall
            — offset ${wf.offset} ft, ${wf.width} ft wide
            ${wf.label ? `<em>(${escHtml(wf.label)})</em>` : ''}
          </li>`).join('')}
        </ul>`;

    card.innerHTML = `
      <div class="card-top">
        <span class="card-title">${escHtml(room.name)}</span>
      </div>
      <div class="card-body">
        <div class="card-detail">
          <strong>${room.width} ft</strong> wide &times; <strong>${room.depth} ft</strong> deep
        </div>
        ${wfHtml}
      </div>
      <div class="card-actions">
        <button class="btn btn--secondary btn--sm edit-room" data-id="${room.id}">Edit</button>
        <button class="btn btn--ghost-danger btn--sm delete-room" data-id="${room.id}">Delete</button>
      </div>
    `;

    card.querySelector('.edit-room').addEventListener('click', () => openRoomModal(room));
    card.querySelector('.delete-room').addEventListener('click', () => handleRoomDelete(room.id));
    return card;
  }

  function openRoomModal(room) {
    State.editingRoomId = room ? room.id : null;
    el('room-modal-title').textContent = room ? 'Edit Room' : 'Add Room';

    ['r-name', 'r-dims'].forEach(clearError);

    // Clear existing wall feature rows
    el('wall-features-list').innerHTML = '';

    if (room) {
      el('room-id').value = room.id;
      el('r-name').value  = room.name;
      el('r-width').value = room.width;
      el('r-depth').value = room.depth;
      room.wallFeatures.forEach(wf => addWallFeatureRow(wf));
    } else {
      el('room-form').reset();
      el('room-id').value = '';
    }

    updateWallFeaturesEmpty();
    el('room-modal').classList.remove('hidden');
    el('r-name').focus();
  }

  function closeRoomModal() {
    el('room-modal').classList.add('hidden');
    State.editingRoomId = null;
  }

  function updateWallFeaturesEmpty() {
    const list = el('wall-features-list');
    const hint = el('wall-features-empty');
    hint.style.display = list.children.length === 0 ? 'block' : 'none';
  }

  function addWallFeatureRow(wf) {
    const row = document.createElement('div');
    row.className = 'wall-feature-row';
    row.dataset.wfId = wf ? (wf.id || '') : '';

    row.innerHTML = `
      <select name="wf-type" title="Type">
        <option value="door"  ${wf && wf.type === 'door'   ? 'selected' : ''}>Door</option>
        <option value="window"${wf && wf.type === 'window' ? 'selected' : ''}>Window</option>
      </select>
      <select name="wf-wall" title="Wall">
        <option value="N" ${wf && wf.wall === 'N' ? 'selected' : ''}>North</option>
        <option value="S" ${wf && wf.wall === 'S' ? 'selected' : ''}>South</option>
        <option value="E" ${wf && wf.wall === 'E' ? 'selected' : ''}>East</option>
        <option value="W" ${wf && wf.wall === 'W' ? 'selected' : ''}>West</option>
      </select>
      <input type="number" name="wf-offset" min="0" step="0.5"
             placeholder="Offset (ft)" value="${wf ? wf.offset : ''}">
      <input type="number" name="wf-width" min="0.5" step="0.5"
             placeholder="Width (ft)" value="${wf ? wf.width : ''}">
      <input type="text"   name="wf-label" maxlength="40"
             placeholder="Label (optional)" value="${wf && wf.label ? escHtml(wf.label) : ''}">
      <button type="button" class="remove-wf" title="Remove">&times;</button>
    `;

    row.querySelector('.remove-wf').addEventListener('click', () => {
      row.remove();
      updateWallFeaturesEmpty();
    });

    el('wall-features-list').appendChild(row);
    updateWallFeaturesEmpty();
  }

  function readWallFeatures() {
    const rows = el('wall-features-list').querySelectorAll('.wall-feature-row');
    return Array.from(rows).map(row => ({
      id:     row.dataset.wfId || undefined,
      type:   row.querySelector('[name="wf-type"]').value,
      wall:   row.querySelector('[name="wf-wall"]').value,
      offset: parseFloat(row.querySelector('[name="wf-offset"]').value) || 0,
      width:  parseFloat(row.querySelector('[name="wf-width"]').value)  || 0,
      label:  row.querySelector('[name="wf-label"]').value.trim() || null,
    }));
  }

  function readRoomForm() {
    return {
      name:         el('r-name').value.trim(),
      width:        parseFloat(el('r-width').value),
      depth:        parseFloat(el('r-depth').value),
      wallFeatures: readWallFeatures(),
    };
  }

  function validateRoomForm(data) {
    let valid = true;
    if (!data.name) { showError('r-name', 'Room name is required'); valid = false; }
    else clearError('r-name');
    if (isNaN(data.width) || data.width <= 0 || isNaN(data.depth) || data.depth <= 0) {
      showError('r-dims', 'Width and depth must be positive numbers');
      valid = false;
    } else {
      clearError('r-dims');
    }
    for (const wf of data.wallFeatures) {
      if (!wf.width || wf.width <= 0) {
        alert('All wall features need a valid width (ft).');
        valid = false;
        break;
      }
    }
    return valid;
  }

  async function handleRoomSubmit(e) {
    e.preventDefault();
    const data = readRoomForm();
    if (!validateRoomForm(data)) return;

    try {
      if (State.editingRoomId) {
        const res = await updateRoom(State.editingRoomId, data);
        const idx = State.rooms.findIndex(r => r.id === State.editingRoomId);
        if (idx !== -1) State.rooms[idx] = res.item;
      } else {
        const res = await createRoom(data);
        State.rooms.push(res.item);
      }
      closeRoomModal();
      renderRoomsGrid();
      populateRoomSelector();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  async function handleRoomDelete(id) {
    const room = State.rooms.find(r => r.id === id);
    if (!room) return;
    if (!confirm(`Delete room "${room.name}"? This cannot be undone.`)) return;
    try {
      await deleteRoom(id);
      State.rooms = State.rooms.filter(r => r.id !== id);
      // If the deleted room was open in the floor plan, reset it
      if (State.floorplan.roomId === id) {
        State.floorplan.roomId = null;
        State.floorplan.placements = [];
        el('fp-workspace').classList.add('hidden');
        el('fp-empty').classList.remove('hidden');
        el('fp-room-select').value = '';
      }
      renderRoomsGrid();
      populateRoomSelector();
    } catch (err) {
      showToast(err.message, true);
    }
  }

  // ─── Floor Plan ────────────────────────────────────────────────────────────

  const CANVAS_W   = 700;
  const CANVAS_PAD = 36;

  const CATEGORY_COLORS = {
    sofa:    'rgba(99,  102, 241, 0.28)',
    bed:     'rgba(236, 72,  153, 0.22)',
    table:   'rgba(16,  185, 129, 0.28)',
    chair:   'rgba(245, 158, 11,  0.28)',
    desk:    'rgba(59,  130, 246, 0.28)',
    dresser: 'rgba(139, 92,  246, 0.28)',
    shelf:   'rgba(20,  184, 166, 0.28)',
    other:   'rgba(107, 114, 128, 0.28)',
  };

  const CATEGORY_STROKES = {
    sofa:    '#6366f1', bed:     '#ec4899', table:   '#10b981',
    chair:   '#f59e0b', desk:    '#3b82f6', dresser: '#8b5cf6',
    shelf:   '#14b8a6', other:   '#6b7280',
  };

  function genPlacementId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
  }

  function rotatedDims(f, rotation) {
    const wIn = convertDimension(f.width, f.unit, 'in');
    const dIn = convertDimension(f.depth, f.unit, 'in');
    const wFt = wIn / 12;
    const dFt = dIn / 12;
    return (rotation === 90 || rotation === 270) ? [dFt, wFt] : [wFt, dFt];
  }

  function fpRoom() {
    return State.rooms.find(r => r.id === State.floorplan.roomId) || null;
  }

  function populateRoomSelector() {
    const sel = el('fp-room-select');
    // Keep placeholder option, remove old room options
    while (sel.options.length > 1) sel.remove(1);
    State.rooms.forEach(room => {
      const opt = document.createElement('option');
      opt.value = room.id;
      opt.textContent = `${room.name} (${room.width}×${room.depth} ft)`;
      sel.appendChild(opt);
    });
  }

  function selectFloorPlanRoom(roomId) {
    State.floorplan.roomId     = roomId;
    State.floorplan.selectedId = null;
    State.floorplan.dragging   = null;

    const room = fpRoom();
    if (!room) return;

    State.floorplan.placements = (room.layout || []).map(p => ({ ...p }));

    const canvas = el('floor-canvas');
    const scale  = (CANVAS_W - 2 * CANVAS_PAD) / room.width;
    State.floorplan.scale  = scale;
    canvas.width           = CANVAS_W;
    canvas.height          = Math.round(room.depth * scale + 2 * CANVAS_PAD);

    renderFpSidebar();
    drawCanvas();

    el('fp-workspace').classList.remove('hidden');
    el('fp-empty').classList.add('hidden');
    el('fp-rotate').disabled = true;
  }

  function renderFpSidebar() {
    const sidebar = el('fp-sidebar');
    sidebar.innerHTML = '';

    if (State.furniture.length === 0) {
      const p = document.createElement('p');
      p.className = 'sidebar-section-label';
      p.textContent = 'No inventory yet';
      p.style.textAlign = 'center';
      p.style.padding = '8px';
      sidebar.appendChild(p);
      return;
    }

    const label = document.createElement('div');
    label.className = 'sidebar-section-label';
    label.textContent = 'Drag to place';
    sidebar.appendChild(label);

    State.furniture.forEach(item => {
      const wFt = (convertDimension(item.width, item.unit, 'in') / 12).toFixed(1);
      const dFt = (convertDimension(item.depth, item.unit, 'in') / 12).toFixed(1);

      const div = document.createElement('div');
      div.className = 'sidebar-item';
      div.draggable = true;
      div.dataset.furnitureId = item.id;
      div.innerHTML = `
        <div class="sidebar-item-name">${escHtml(item.name)}</div>
        <div class="sidebar-item-dims">${wFt}′ × ${dFt}′ (W×D)</div>
      `;
      div.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'copy';
      });
      sidebar.appendChild(div);
    });
  }

  function drawCanvas() {
    const canvas = el('floor-canvas');
    const ctx    = canvas.getContext('2d');
    const room   = fpRoom();
    if (!room) return;

    const scale = State.floorplan.scale;
    const rW    = room.width  * scale;
    const rH    = room.depth  * scale;
    const ox    = CANVAS_PAD;
    const oy    = CANVAS_PAD;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#e8eaed';
    ctx.lineWidth   = 0.5;
    for (let i = 1; i < room.width; i++) {
      ctx.beginPath();
      ctx.moveTo(ox + i * scale, oy);
      ctx.lineTo(ox + i * scale, oy + rH);
      ctx.stroke();
    }
    for (let j = 1; j < room.depth; j++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + j * scale);
      ctx.lineTo(ox + rW, oy + j * scale);
      ctx.stroke();
    }

    // Room outline
    ctx.strokeStyle = '#1a1c20';
    ctx.lineWidth   = 2;
    ctx.strokeRect(ox, oy, rW, rH);

    // Wall features
    room.wallFeatures.forEach(wf => drawWallFeature(ctx, wf, room, scale, ox, oy));

    // Furniture placements
    const collisions = checkCollisions();
    const blockings  = checkDoorwayBlocking();

    State.floorplan.placements.forEach(p => {
      if (p.id === State.floorplan.selectedId) return; // draw selected last
      const f = State.furniture.find(i => i.id === p.furnitureId);
      if (f) drawPlacement(ctx, p, f, scale, ox, oy, {
        isSelected:  false,
        isColliding: collisions.has(p.id),
        isBlocking:  blockings.has(p.id),
      });
    });

    // Draw selected piece on top
    if (State.floorplan.selectedId) {
      const p = State.floorplan.placements.find(pl => pl.id === State.floorplan.selectedId);
      if (p) {
        const f = State.furniture.find(i => i.id === p.furnitureId);
        if (f) drawPlacement(ctx, p, f, scale, ox, oy, {
          isSelected:  true,
          isColliding: collisions.has(p.id),
          isBlocking:  blockings.has(p.id),
        });
      }
    }
  }

  function drawWallFeature(ctx, wf, room, scale, ox, oy) {
    const rW = room.width * scale;
    const rH = room.depth * scale;

    // Compute gap segment in canvas coordinates
    let x1, y1, x2, y2;
    switch (wf.wall) {
      case 'N': x1 = ox + wf.offset * scale; y1 = oy;      x2 = ox + (wf.offset + wf.width) * scale; y2 = oy; break;
      case 'S': x1 = ox + wf.offset * scale; y1 = oy + rH; x2 = ox + (wf.offset + wf.width) * scale; y2 = oy + rH; break;
      case 'W': x1 = ox;      y1 = oy + wf.offset * scale; x2 = ox;      y2 = oy + (wf.offset + wf.width) * scale; break;
      case 'E': x1 = ox + rW; y1 = oy + wf.offset * scale; x2 = ox + rW; y2 = oy + (wf.offset + wf.width) * scale; break;
    }

    // Erase the wall segment with canvas background
    ctx.save();
    ctx.strokeStyle = '#fafbfc';
    ctx.lineWidth   = 4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();

    if (wf.type === 'door') {
      // Door arc showing swing
      const arcR = wf.width * scale;
      ctx.save();
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      let startAng, endAng, hingeX, hingeY;
      switch (wf.wall) {
        case 'N': hingeX = x1; hingeY = oy; startAng = 0;        endAng = Math.PI / 2;  break;
        case 'S': hingeX = x1; hingeY = oy + rH; startAng = -Math.PI / 2; endAng = 0;  break;
        case 'W': hingeX = ox; hingeY = y1; startAng = 0;        endAng = Math.PI / 2;  break;
        case 'E': hingeX = ox + rW; hingeY = y1; startAng = Math.PI / 2; endAng = Math.PI; break;
      }
      ctx.arc(hingeX, hingeY, arcR, startAng, endAng);
      ctx.stroke();
      ctx.setLineDash([]);
      // Hinge dot
      ctx.fillStyle = '#6b7280';
      ctx.beginPath(); ctx.arc(hingeX, hingeY, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else {
      // Window: dashed blue line over the gap
      ctx.save();
      ctx.strokeStyle = '#3b6fd4';
      ctx.lineWidth   = 3;
      ctx.setLineDash([6, 3]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }

  function drawPlacement(ctx, p, f, scale, ox, oy, flags) {
    const [rW, rD] = rotatedDims(f, p.rotation);
    const px = p.x * scale + ox;
    const py = p.y * scale + oy;
    const pw = rW * scale;
    const pd = rD * scale;

    let fill   = CATEGORY_COLORS[f.category]   || CATEGORY_COLORS.other;
    let stroke = CATEGORY_STROKES[f.category]  || CATEGORY_STROKES.other;
    let lw     = 1.5;

    if (flags.isColliding) { fill = 'rgba(220,38,38,0.22)'; stroke = '#dc2626'; lw = 2; }
    if (flags.isBlocking)  { fill = 'rgba(234,88,12,0.22)'; stroke = '#ea580c'; lw = 2; }
    if (flags.isSelected)  { stroke = '#4338ca'; lw = 2.5; }

    ctx.fillStyle   = fill;
    ctx.fillRect(px, py, pw, pd);
    ctx.strokeStyle = stroke;
    ctx.lineWidth   = lw;
    ctx.strokeRect(px, py, pw, pd);

    // Warning triangle for doorway blocking
    if (flags.isBlocking) {
      const tx = px + pw - 14;
      const ty = py + 4;
      ctx.fillStyle = '#ea580c';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText('⚠', tx, ty + 12);
    }

    // Label
    ctx.save();
    ctx.font         = `${Math.max(9, Math.min(12, pd * 0.35))}px system-ui`;
    ctx.fillStyle    = '#1a1c20';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.rect(px + 2, py + 2, pw - 4, pd - 4);
    ctx.clip();
    ctx.fillText(f.name, px + pw / 2, py + pd / 2);
    ctx.restore();

    // Rotation handle dot on selected piece
    if (flags.isSelected) {
      ctx.fillStyle = '#4338ca';
      ctx.beginPath();
      ctx.arc(px + pw / 2, py - 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function hitTest(cx, cy) {
    const scale = State.floorplan.scale;
    const placements = State.floorplan.placements;
    for (let i = placements.length - 1; i >= 0; i--) {
      const p = placements[i];
      const f = State.furniture.find(i => i.id === p.furnitureId);
      if (!f) continue;
      const [rW, rD] = rotatedDims(f, p.rotation);
      const px = p.x * scale + CANVAS_PAD;
      const py = p.y * scale + CANVAS_PAD;
      if (cx >= px && cx <= px + rW * scale && cy >= py && cy <= py + rD * scale) {
        return p.id;
      }
    }
    return null;
  }

  function checkCollisions() {
    const colliding = new Set();
    const boxes = State.floorplan.placements.map(p => {
      const f = State.furniture.find(i => i.id === p.furnitureId);
      if (!f) return null;
      const [rW, rD] = rotatedDims(f, p.rotation);
      return { id: p.id, L: p.x, R: p.x + rW, T: p.y, B: p.y + rD };
    }).filter(Boolean);

    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.L < b.R && a.R > b.L && a.T < b.B && a.B > b.T) {
          colliding.add(a.id);
          colliding.add(b.id);
        }
      }
    }
    return colliding;
  }

  function checkDoorwayBlocking() {
    const room = fpRoom();
    if (!room) return new Set();
    const CLEAR = 1; // 1ft clearance zone in front of each door
    const blocking = new Set();

    const doorRects = room.wallFeatures
      .filter(wf => wf.type === 'door')
      .map(wf => {
        switch (wf.wall) {
          case 'N': return { L: wf.offset, R: wf.offset + wf.width, T: 0,              B: CLEAR };
          case 'S': return { L: wf.offset, R: wf.offset + wf.width, T: room.depth - CLEAR, B: room.depth };
          case 'W': return { L: 0,         R: CLEAR,                 T: wf.offset,     B: wf.offset + wf.width };
          case 'E': return { L: room.width - CLEAR, R: room.width,   T: wf.offset,     B: wf.offset + wf.width };
          default:  return null;
        }
      }).filter(Boolean);

    State.floorplan.placements.forEach(p => {
      const f = State.furniture.find(i => i.id === p.furnitureId);
      if (!f) return;
      const [rW, rD] = rotatedDims(f, p.rotation);
      const pBox = { L: p.x, R: p.x + rW, T: p.y, B: p.y + rD };
      for (const dr of doorRects) {
        if (pBox.L < dr.R && pBox.R > dr.L && pBox.T < dr.B && pBox.B > dr.T) {
          blocking.add(p.id);
          break;
        }
      }
    });
    return blocking;
  }

  function rotateSelected() {
    if (!State.floorplan.selectedId) return;
    const room = fpRoom();
    if (!room) return;
    const p = State.floorplan.placements.find(pl => pl.id === State.floorplan.selectedId);
    if (!p) return;
    const f = State.furniture.find(i => i.id === p.furnitureId);
    if (!f) return;

    const newRot = (p.rotation + 90) % 360;
    const [newW, newD] = rotatedDims(f, newRot);
    p.rotation = newRot;
    p.x = Math.max(0, Math.min(room.width  - newW, p.x));
    p.y = Math.max(0, Math.min(room.depth - newD,  p.y));
    drawCanvas();
  }

  async function saveLayout() {
    const room = fpRoom();
    if (!room) return;
    try {
      const res = await updateRoom(room.id, {
        name:         room.name,
        width:        room.width,
        depth:        room.depth,
        wallFeatures: room.wallFeatures,
        layout:       State.floorplan.placements,
      });
      const idx = State.rooms.findIndex(r => r.id === room.id);
      if (idx !== -1) State.rooms[idx] = res.item;
      showToast('Layout saved!');
    } catch (err) {
      showToast(err.message, true);
    }
  }

  function initFloorPlan() {
    const canvas = el('floor-canvas');

    el('fp-room-select').addEventListener('change', e => {
      const roomId = e.target.value;
      if (roomId) {
        selectFloorPlanRoom(roomId);
      } else {
        el('fp-workspace').classList.add('hidden');
        el('fp-empty').classList.remove('hidden');
        State.floorplan.roomId = null;
      }
    });

    el('fp-save').addEventListener('click', saveLayout);

    el('fp-clear').addEventListener('click', () => {
      if (!State.floorplan.roomId) return;
      if (State.floorplan.placements.length === 0) return;
      if (!confirm('Clear all placed furniture from this room?')) return;
      State.floorplan.placements = [];
      State.floorplan.selectedId = null;
      el('fp-rotate').disabled = true;
      drawCanvas();
    });

    el('fp-rotate').addEventListener('click', rotateSelected);

    document.addEventListener('keydown', e => {
      if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey) {
        if (!el('tab-floorplan').classList.contains('active')) return;
        if (document.activeElement && document.activeElement.tagName === 'INPUT') return;
        rotateSelected();
      }
    });

    // Canvas drag-drop from sidebar
    canvas.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    canvas.addEventListener('drop', e => {
      e.preventDefault();
      const furnitureId = e.dataTransfer.getData('text/plain');
      if (!furnitureId) return;
      const f    = State.furniture.find(i => i.id === furnitureId);
      const room = fpRoom();
      if (!f || !room) return;

      const rect   = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx     = (e.clientX - rect.left) * scaleX;
      const cy     = (e.clientY - rect.top)  * scaleY;
      const scale  = State.floorplan.scale;
      const [rW, rD] = rotatedDims(f, 0);

      let x = (cx - CANVAS_PAD) / scale - rW / 2;
      let y = (cy - CANVAS_PAD) / scale - rD / 2;
      x = Math.max(0, Math.min(room.width  - rW, x));
      y = Math.max(0, Math.min(room.depth - rD,  y));

      const placement = { id: genPlacementId(), furnitureId, x, y, rotation: 0 };
      State.floorplan.placements.push(placement);
      State.floorplan.selectedId = placement.id;
      el('fp-rotate').disabled = false;
      drawCanvas();
    });

    // Canvas mouse drag to reposition placed pieces
    canvas.addEventListener('mousedown', e => {
      const rect   = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx     = (e.clientX - rect.left) * scaleX;
      const cy     = (e.clientY - rect.top)  * scaleY;
      const hitId = hitTest(cx, cy);

      State.floorplan.selectedId = hitId;
      el('fp-rotate').disabled = !hitId;

      if (hitId) {
        const p     = State.floorplan.placements.find(pl => pl.id === hitId);
        const scale = State.floorplan.scale;
        State.floorplan.dragging = {
          id:      hitId,
          offsetX: (cx - CANVAS_PAD) / scale - p.x,
          offsetY: (cy - CANVAS_PAD) / scale - p.y,
        };
        canvas.style.cursor = 'grabbing';
      }
      drawCanvas();
    });

    canvas.addEventListener('mousemove', e => {
      if (!State.floorplan.dragging) return;
      const { id, offsetX, offsetY } = State.floorplan.dragging;
      const rect   = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      const cx     = (e.clientX - rect.left) * scaleX;
      const cy     = (e.clientY - rect.top)  * scaleY;
      const scale = State.floorplan.scale;
      const room  = fpRoom();
      const p     = State.floorplan.placements.find(pl => pl.id === id);
      const f     = State.furniture.find(i => i.id === p.furnitureId);
      const [rW, rD] = rotatedDims(f, p.rotation);

      p.x = Math.max(0, Math.min(room.width  - rW, (cx - CANVAS_PAD) / scale - offsetX));
      p.y = Math.max(0, Math.min(room.depth - rD,  (cy - CANVAS_PAD) / scale - offsetY));
      drawCanvas();
    });

    canvas.addEventListener('mouseup', () => {
      State.floorplan.dragging = null;
      canvas.style.cursor = 'default';
    });

    canvas.addEventListener('mouseleave', () => {
      State.floorplan.dragging = null;
      canvas.style.cursor = 'default';
    });
  }

  // ─── Utility ────────────────────────────────────────────────────────────────

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ─── Init ───────────────────────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', async () => {
    initUnitToggle();
    initTabs();

    // Furniture modal wiring
    el('open-add-furniture').addEventListener('click', () => openFurnitureModal(null));
    el('furniture-cancel').addEventListener('click', closeFurnitureModal);
    el('furniture-form').addEventListener('submit', handleFurnitureSubmit);
    // Close on backdrop click
    el('furniture-modal').addEventListener('click', e => {
      if (e.target === el('furniture-modal')) closeFurnitureModal();
    });

    // Room modal wiring
    el('open-add-room').addEventListener('click', () => openRoomModal(null));
    el('room-cancel').addEventListener('click', closeRoomModal);
    el('room-form').addEventListener('submit', handleRoomSubmit);
    el('add-wall-feature').addEventListener('click', () => addWallFeatureRow(null));
    el('room-modal').addEventListener('click', e => {
      if (e.target === el('room-modal')) closeRoomModal();
    });

    // Keyboard: Escape closes open modals
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (!el('furniture-modal').classList.contains('hidden')) closeFurnitureModal();
        if (!el('room-modal').classList.contains('hidden')) closeRoomModal();
      }
    });

    seedDefaultData();

    // Load initial data in parallel
    try {
      const [fData, rData] = await Promise.all([getFurniture(), getRooms()]);
      State.furniture = fData.items;
      State.rooms     = rData.items;
    } catch (err) {
      alert('Failed to load data: ' + err.message);
    }

    renderFurnitureGrid();
    renderRoomsGrid();
    initFloorPlan();
    populateRoomSelector();
  });

})();
