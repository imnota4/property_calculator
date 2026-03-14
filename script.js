// --- Debounce ---
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}
const debouncedUpdate = debounce(updateCalculators, 100);

// --- Tab Switching ---
function switchTab(tab) {
  document.querySelectorAll('.calculator').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  if (tab === 'rent') {
    document.getElementById('rent-calculator').classList.add('active');
    document.querySelector('.tab-button:nth-child(1)').classList.add('active');
  } else {
    document.getElementById('construction-calculator').classList.add('active');
    document.querySelector('.tab-button:nth-child(2)').classList.add('active');
  }
  debouncedUpdate();
}

// --- Input / Slider Sync ---
function setupInputSlider(id) {
  const input  = document.getElementById(id);
  const slider = document.getElementById(id + 'Slider');
  input.oninput  = () => { slider.value = input.value;  debouncedUpdate(); };
  slider.oninput = () => { input.value  = slider.value; debouncedUpdate(); };
}
['interest','years','vacancy','grant','resMin','resMax','resStep',
 'costMin','costMax','costStep','costSqFt','sqFtUnit','nonUnit','units','error']
  .forEach(setupInputSlider);

// --- Tooltip ---
const tooltip = document.getElementById('tooltip');
document.querySelectorAll('label[data-tooltip]').forEach(label => {
  label.addEventListener('mouseenter', () => {
    tooltip.innerText = label.dataset.tooltip;
    tooltip.style.display = 'block';
  });
  label.addEventListener('mousemove', e => {
    tooltip.style.top  = (e.clientY + 15) + 'px';
    tooltip.style.left = (e.clientX + 15) + 'px';
  });
  label.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
});

// --- Construction Calculator ---
function calculateConstruction() {
  const costSqFt = parseFloat(document.getElementById('costSqFt').value);
  const sqFtUnit = parseFloat(document.getElementById('sqFtUnit').value);
  const nonUnit  = parseFloat(document.getElementById('nonUnit').value) / 100;
  const units    = parseFloat(document.getElementById('units').value);
  const error    = parseFloat(document.getElementById('error').value) / 100;
  const totalSqFt  = (sqFtUnit * units) / (1 - nonUnit);
  const totalCost  = totalSqFt * costSqFt * (1 + error);
  document.getElementById('totalSqFt').innerText = Math.round(totalSqFt).toLocaleString() + ' sq ft';
  document.getElementById('totalCost').innerText = '$' + Math.round(totalCost).toLocaleString();
}

// --- Virtualization constants ---
const ROW_H  = 30;
const COL_W  = 90;
const BUFFER = 5;

const tableWrapper  = document.getElementById('tableWrapper');
const gridContainer = document.getElementById('rentTable');
const scrollbarH    = document.getElementById('scrollbarH');
const scrollbarV    = document.getElementById('scrollbarV');
const thumbH        = document.getElementById('thumbH');
const thumbV        = document.getElementById('thumbV');

// Virtual scroll position (replaces tableWrapper.scrollLeft/Top)
let scrollX = 0;
let scrollY = 0;
let totalContentW = 0;
let totalContentH = 0;

// --- Rent computation ---
function computeRent(cost, residents, interest, years, vacancy, grant) {
  const bond            = Math.max(0, cost - grant);
  const totalInterest   = bond * interest * years;
  const totalCost       = bond + totalInterest;
  const effectiveRes    = residents * (1 - vacancy);
  return Math.round(totalCost / (years * 12) / effectiveRes);
}

// --- Render virtual grid ---
function renderVirtualTable() {
  const interest  = parseFloat(document.getElementById('interest').value) / 100;
  const years     = parseFloat(document.getElementById('years').value);
  const vacancy   = parseFloat(document.getElementById('vacancy').value) / 100;
  const grant     = parseFloat(document.getElementById('grant').value);
  const resMin    = parseInt(document.getElementById('resMin').value);
  const resMax    = parseInt(document.getElementById('resMax').value);
  const resStep   = parseInt(document.getElementById('resStep').value);
  const costMin   = parseInt(document.getElementById('costMin').value);
  const costMax   = parseInt(document.getElementById('costMax').value);
  const costStep  = parseInt(document.getElementById('costStep').value);

  const totalRows = Math.floor((costMax - costMin) / costStep) + 1;
  const totalCols = Math.floor((resMax  - resMin)  / resStep)  + 1;

  // Total virtual canvas size (+1 for header row/col)
  totalContentW = (totalCols + 1) * COL_W;
  totalContentH = (totalRows + 1) * ROW_H;

  // Clamp scroll position
  const maxScrollX = Math.max(0, totalContentW - tableWrapper.clientWidth);
  const maxScrollY = Math.max(0, totalContentH - tableWrapper.clientHeight);
  scrollX = Math.min(scrollX, maxScrollX);
  scrollY = Math.min(scrollY, maxScrollY);

  // Visible window
  const firstCol = Math.max(0, Math.floor(scrollX / COL_W) - BUFFER);
  const lastCol  = Math.min(totalCols, firstCol + Math.ceil(tableWrapper.clientWidth  / COL_W) + BUFFER * 2);
  const firstRow = Math.max(0, Math.floor(scrollY / ROW_H) - BUFFER);
  const lastRow  = Math.min(totalRows, firstRow + Math.ceil(tableWrapper.clientHeight / ROW_H) + BUFFER * 2);

  gridContainer.innerHTML = '';

  const base = `position:absolute;width:${COL_W}px;height:${ROW_H}px;` +
               `box-sizing:border-box;border:1px solid #ccc;` +
               `overflow:hidden;white-space:nowrap;text-align:center;` +
               `line-height:${ROW_H}px;font-size:13px;padding:0 4px;`;
  const hdr  = 'background:#e0e0e0;font-weight:bold;z-index:2;';

  // Corner cell — always at current scroll position
  const corner = document.createElement('div');
  corner.style.cssText = base + hdr + `top:${scrollY}px;left:${scrollX}px;`;
  corner.textContent = 'Property Cost';
  gridContainer.appendChild(corner);

  // Column headers — pinned to scrollY
  for (let c = firstCol; c < lastCol; c++) {
    const cell = document.createElement('div');
    cell.style.cssText = base + hdr + `top:${scrollY}px;left:${(c + 1) * COL_W}px;`;
    cell.textContent = resMin + c * resStep;
    gridContainer.appendChild(cell);
  }

  // Row headers — pinned to scrollX
  for (let r = firstRow; r < lastRow; r++) {
    const cost = costMin + r * costStep;
    const cell = document.createElement('div');
    cell.style.cssText = base + hdr + `top:${(r + 1) * ROW_H}px;left:${scrollX}px;`;
    cell.textContent = '$' + cost.toLocaleString();
    gridContainer.appendChild(cell);
  }

  // Data cells
  for (let r = firstRow; r < lastRow; r++) {
    const cost = costMin + r * costStep;
    for (let c = firstCol; c < lastCol; c++) {
      const residents = resMin + c * resStep;
      const rent = computeRent(cost, residents, interest, years, vacancy, grant);
      const bg = rent <= 250 ? '#4CAF50' : rent <= 625 ? '#FFD54F' : rent <= 1000 ? '#FB8C00' : '#E53935';
      const cell = document.createElement('div');
      cell.style.cssText = base + `top:${(r + 1) * ROW_H}px;left:${(c + 1) * COL_W}px;background:${bg};`;
      cell.textContent = '$' + rent;
      gridContainer.appendChild(cell);
    }
  }

  // Size the container so it represents the full virtual canvas
  gridContainer.style.width  = totalContentW + 'px';
  gridContainer.style.height = totalContentH + 'px';

  updateScrollbars();
}

// --- Scrollbar sync ---
function updateScrollbars() {
  const viewW = tableWrapper.clientWidth;
  const viewH = tableWrapper.clientHeight;

  // Horizontal
  const trackW  = scrollbarH.clientWidth;
  const ratioW  = Math.min(1, viewW / totalContentW);
  const tW      = Math.max(30, trackW * ratioW);
  const maxTX   = trackW - tW;
  const tX      = totalContentW > viewW ? (scrollX / (totalContentW - viewW)) * maxTX : 0;
  thumbH.style.width = tW + 'px';
  thumbH.style.left  = tX + 'px';

  // Vertical
  const trackH  = scrollbarV.clientHeight;
  const ratioH  = Math.min(1, viewH / totalContentH);
  const tH      = Math.max(30, trackH * ratioH);
  const maxTY   = trackH - tH;
  const tY      = totalContentH > viewH ? (scrollY / (totalContentH - viewH)) * maxTY : 0;
  thumbV.style.height = tH + 'px';
  thumbV.style.top    = tY + 'px';
}

// --- Draggable thumbs ---
function makeDraggable(thumb, track, axis) {
  thumb.addEventListener('mousedown', e => {
    e.preventDefault();
    thumb.classList.add('dragging');
    const startMouse  = axis === 'x' ? e.clientX : e.clientY;
    const startScroll = axis === 'x' ? scrollX : scrollY;
    const trackSize   = axis === 'x' ? track.clientWidth  : track.clientHeight;
    const thumbSize   = axis === 'x' ? thumb.offsetWidth  : thumb.offsetHeight;
    const contentSize = axis === 'x' ? totalContentW : totalContentH;
    const viewSize    = axis === 'x' ? tableWrapper.clientWidth : tableWrapper.clientHeight;

    const onMove = e => {
      const delta       = (axis === 'x' ? e.clientX : e.clientY) - startMouse;
      const scrollRatio = delta / (trackSize - thumbSize);
      const newScroll   = Math.max(0, Math.min(contentSize - viewSize,
                            startScroll + scrollRatio * (contentSize - viewSize)));
      if (axis === 'x') scrollX = newScroll;
      else              scrollY = newScroll;
      requestAnimationFrame(renderVirtualTable);
    };
    const onUp = () => {
      thumb.classList.remove('dragging');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}
makeDraggable(thumbH, scrollbarH, 'x');
makeDraggable(thumbV, scrollbarV, 'y');

// --- Click track to jump ---
scrollbarH.addEventListener('click', e => {
  if (e.target === thumbH) return;
  const rect  = scrollbarH.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / scrollbarH.clientWidth;
  scrollX = ratio * Math.max(0, totalContentW - tableWrapper.clientWidth);
  requestAnimationFrame(renderVirtualTable);
});
scrollbarV.addEventListener('click', e => {
  if (e.target === thumbV) return;
  const rect  = scrollbarV.getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / scrollbarV.clientHeight;
  scrollY = ratio * Math.max(0, totalContentH - tableWrapper.clientHeight);
  requestAnimationFrame(renderVirtualTable);
});

// --- Mouse wheel ---
tableWrapper.addEventListener('wheel', e => {
  e.preventDefault();
  scrollX = Math.max(0, Math.min(totalContentW - tableWrapper.clientWidth,  scrollX + e.deltaX));
  scrollY = Math.max(0, Math.min(totalContentH - tableWrapper.clientHeight, scrollY + e.deltaY));
  requestAnimationFrame(renderVirtualTable);
}, { passive: false });

// --- Resize ---
window.addEventListener('resize', () => requestAnimationFrame(renderVirtualTable));

// --- Update Calculators ---
function updateCalculators() {
  if (document.getElementById('rent-calculator').classList.contains('active')) renderVirtualTable();
  if (document.getElementById('construction-calculator').classList.contains('active')) calculateConstruction();
}

debouncedUpdate();
