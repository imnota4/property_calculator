// --- Debounce ---
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  }
}
const debouncedUpdateCalculators = debounce(updateCalculators, 100);

// --- Tab Switching ---
function switchTab(tab) {
  document.querySelectorAll('.calculator').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  if(tab==='rent'){document.getElementById('rent-calculator').classList.add('active');document.querySelector('.tab-button:nth-child(1)').classList.add('active');}
  else{document.getElementById('construction-calculator').classList.add('active');document.querySelector('.tab-button:nth-child(2)').classList.add('active');}
  debouncedUpdateCalculators();
}

// --- Input / Slider Sync ---
function setupInputSlider(inputId){
  const input=document.getElementById(inputId);
  const slider=document.getElementById(inputId+'Slider');
  input.oninput=()=>{slider.value=input.value;debouncedUpdateCalculators();};
  slider.oninput=()=>{input.value=slider.value;debouncedUpdateCalculators();};
}
['interest','years','vacancy','grant','resMin','resMax','resStep','costMin','costMax','costStep','costSqFt','sqFtUnit','nonUnit','units','error'].forEach(setupInputSlider);

// --- Tooltip ---
const tooltip=document.getElementById('tooltip');
document.querySelectorAll('label[data-tooltip]').forEach(label=>{
  label.addEventListener('mouseenter',()=>{tooltip.innerText=label.dataset.tooltip;tooltip.style.display='block';});
  label.addEventListener('mousemove',e=>{tooltip.style.top=(e.clientY+15)+'px';tooltip.style.left=(e.clientX+15)+'px';});
  label.addEventListener('mouseleave',()=>{tooltip.style.display='none';});
});

// --- Construction Calculator ---
function calculateConstruction(){
  const costSqFt=parseFloat(document.getElementById("costSqFt").value);
  const sqFtUnit=parseFloat(document.getElementById("sqFtUnit").value);
  const nonUnit=parseFloat(document.getElementById("nonUnit").value)/100;
  const units=parseFloat(document.getElementById("units").value);
  const error=parseFloat(document.getElementById("error").value)/100;
  const totalSqFt=(sqFtUnit*units)/(1-nonUnit);
  const totalCost=totalSqFt*costSqFt*(1+error);
  document.getElementById("totalSqFt").innerText=Math.round(totalSqFt).toLocaleString()+" sq ft";
  document.getElementById("totalCost").innerText="$"+Math.round(totalCost).toLocaleString();
}

// --- Virtualization Settings ---
const rowHeight = 30;
const colWidth  = 90;
const buffer    = 5;
const tableWrapper = document.getElementById('tableWrapper');
const gridContainer = document.getElementById('rentTable');

// --- Lazy Rent Computation ---
function computeRent(cost,residents,interest,years,vacancy,grant){
  const bond=Math.max(0,cost-grant);
  const totalInterest=bond*interest*years;
  const totalCost=bond+totalInterest;
  const effectiveResidents=residents*(1-vacancy);
  return Math.round(totalCost/(years*12)/effectiveResidents);
}

// --- Virtual Grid Render ---
function renderVirtualTable(){
  const interest = parseFloat(document.getElementById("interest").value)/100;
  const years    = parseFloat(document.getElementById("years").value);
  const vacancy  = parseFloat(document.getElementById("vacancy").value)/100;
  const grant    = parseFloat(document.getElementById("grant").value);
  const resMin   = parseInt(document.getElementById("resMin").value);
  const resMax   = parseInt(document.getElementById("resMax").value);
  const resStep  = parseInt(document.getElementById("resStep").value);
  const costMin  = parseInt(document.getElementById("costMin").value);
  const costMax  = parseInt(document.getElementById("costMax").value);
  const costStep = parseInt(document.getElementById("costStep").value);

  const totalRows = Math.floor((costMax - costMin) / costStep) + 1;
  const totalCols = Math.floor((resMax  - resMin)  / resStep)  + 1;

  // +1 row and +1 col for the sticky header/label strips
  gridContainer.style.width  = (totalCols + 1) * colWidth  + "px";
  gridContainer.style.height = (totalRows + 1) * rowHeight + "px";

  const scrollTop  = tableWrapper.scrollTop;
  const scrollLeft = tableWrapper.scrollLeft;

  const firstRow = Math.max(0, Math.floor(scrollTop  / rowHeight) - buffer);
  const lastRow  = Math.min(totalRows, firstRow + Math.ceil(tableWrapper.clientHeight / rowHeight) + buffer * 2);
  const firstCol = Math.max(0, Math.floor(scrollLeft / colWidth)  - buffer);
  const lastCol  = Math.min(totalCols, firstCol + Math.ceil(tableWrapper.clientWidth  / colWidth)  + buffer * 2);

  gridContainer.innerHTML = "";

  const base = `position:absolute;width:${colWidth}px;height:${rowHeight}px;` +
               `box-sizing:border-box;border:1px solid #ccc;` +
               `overflow:hidden;white-space:nowrap;text-align:center;` +
               `line-height:${rowHeight}px;font-size:13px;padding:0 4px;`;
  const headerBg = "background:#e0e0e0;font-weight:bold;z-index:2;";

  // Corner cell — pinned to scrollTop + scrollLeft
  const corner = document.createElement("div");
  corner.style.cssText = base + headerBg + `top:${scrollTop}px;left:${scrollLeft}px;`;
  corner.textContent = "Property Cost";
  gridContainer.appendChild(corner);

  // Column headers (resident counts) — pinned to scrollTop
  for(let c = firstCol; c < lastCol; c++){
    const res = resMin + c * resStep;
    const cell = document.createElement("div");
    cell.style.cssText = base + headerBg + `top:${scrollTop}px;left:${(c + 1) * colWidth}px;`;
    cell.textContent = res;
    gridContainer.appendChild(cell);
  }

  // Row headers (property costs) — pinned to scrollLeft
  for(let r = firstRow; r < lastRow; r++){
    const cost = costMin + r * costStep;
    const cell = document.createElement("div");
    cell.style.cssText = base + headerBg + `top:${(r + 1) * rowHeight}px;left:${scrollLeft}px;`;
    cell.textContent = "$" + cost.toLocaleString();
    gridContainer.appendChild(cell);
  }

  // Data cells
  for(let r = firstRow; r < lastRow; r++){
    const cost = costMin + r * costStep;
    for(let c = firstCol; c < lastCol; c++){
      const residents = resMin + c * resStep;
      const rent = computeRent(cost, residents, interest, years, vacancy, grant);
      let bg;
      if     (rent <= 250)  bg = "#4CAF50";
      else if(rent <= 625)  bg = "#FFD54F";
      else if(rent <= 1000) bg = "#FB8C00";
      else                  bg = "#E53935";
      const cell = document.createElement("div");
      cell.style.cssText = base + `top:${(r + 1) * rowHeight}px;left:${(c + 1) * colWidth}px;background:${bg};`;
      cell.textContent = "$" + rent;
      gridContainer.appendChild(cell);
    }
  }

  // Sync scrollbars after every render
  if(typeof updateScrollbars === 'function') updateScrollbars();
}

// --- Custom Scrollbars ---
const scrollbarH = document.getElementById('scrollbarH');
const scrollbarV = document.getElementById('scrollbarV');
const thumbH     = document.getElementById('thumbH');
const thumbV     = document.getElementById('thumbV');

function updateScrollbars(){
  const contentW = gridContainer.offsetWidth;
  const contentH = gridContainer.offsetHeight;
  const viewW    = tableWrapper.clientWidth;
  const viewH    = tableWrapper.clientHeight;
  const scrollLeft = tableWrapper.scrollLeft;
  const scrollTop  = tableWrapper.scrollTop;

  // Horizontal thumb
  const trackW   = scrollbarH.clientWidth;
  const thumbWPx = Math.max(30, trackW * (viewW / contentW));
  const thumbXPx = (contentW > viewW) ? scrollLeft / (contentW - viewW) * (trackW - thumbWPx) : 0;
  thumbH.style.width = thumbWPx + "px";
  thumbH.style.left  = thumbXPx + "px";

  // Vertical thumb
  const trackH   = scrollbarV.clientHeight;
  const thumbHPx = Math.max(30, trackH * (viewH / contentH));
  const thumbYPx = (contentH > viewH) ? scrollTop / (contentH - viewH) * (trackH - thumbHPx) : 0;
  thumbV.style.height = thumbHPx + "px";
  thumbV.style.top    = thumbYPx + "px";
}

function makeDraggable(thumb, scrollbar, axis){
  let startMouse, startScroll;
  thumb.addEventListener('mousedown', e => {
    e.preventDefault();
    thumb.classList.add('dragging');
    startMouse = axis === 'x' ? e.clientX : e.clientY;
    startScroll = axis === 'x' ? tableWrapper.scrollLeft : tableWrapper.scrollTop;
    const contentSize = axis === 'x' ? gridContainer.offsetWidth  : gridContainer.offsetHeight;
    const viewSize    = axis === 'x' ? tableWrapper.clientWidth    : tableWrapper.clientHeight;
    const trackSize   = axis === 'x' ? scrollbar.clientWidth       : scrollbar.clientHeight;
    const thumbSize   = axis === 'x' ? thumb.offsetWidth           : thumb.offsetHeight;
    const onMove = e => {
      const delta = (axis === 'x' ? e.clientX : e.clientY) - startMouse;
      const scrollRatio = delta / (trackSize - thumbSize);
      const newScroll = startScroll + scrollRatio * (contentSize - viewSize);
      if(axis === 'x') tableWrapper.scrollLeft = newScroll;
      else             tableWrapper.scrollTop  = newScroll;
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

// Click-on-track to jump
scrollbarH.addEventListener('click', e => {
  if(e.target === thumbH) return;
  const rect = scrollbarH.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / scrollbarH.clientWidth;
  tableWrapper.scrollLeft = ratio * (gridContainer.offsetWidth - tableWrapper.clientWidth);
  requestAnimationFrame(renderVirtualTable);
});
scrollbarV.addEventListener('click', e => {
  if(e.target === thumbV) return;
  const rect = scrollbarV.getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / scrollbarV.clientHeight;
  tableWrapper.scrollTop = ratio * (gridContainer.offsetHeight - tableWrapper.clientHeight);
  requestAnimationFrame(renderVirtualTable);
});

// Mouse wheel on the grid area
tableWrapper.addEventListener('wheel', e => {
  e.preventDefault();
  tableWrapper.scrollLeft += e.deltaX;
  tableWrapper.scrollTop  += e.deltaY;
  requestAnimationFrame(renderVirtualTable);
}, { passive: false });

// --- Update Calculators ---
function updateCalculators(){
  if(document.getElementById('rent-calculator').classList.contains('active')){
    renderVirtualTable();
    updateScrollbars();
  }
  if(document.getElementById('construction-calculator').classList.contains('active')) calculateConstruction();
}

// Patch renderVirtualTable to always sync scrollbars after render
const _render = renderVirtualTable;
// (scrollbar update is called from updateCalculators and scroll handler below)

// --- Scroll Listener (wheel only now — native scroll is disabled) ---
// Scrollbars drive scrollLeft/scrollTop directly; we just need resize awareness
window.addEventListener('resize', () => { requestAnimationFrame(() => { renderVirtualTable(); updateScrollbars(); }); });

// --- Initial Update ---
debouncedUpdateCalculators();
