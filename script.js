// --- Debounce helper ---
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

  if (tab === 'rent') {
    document.getElementById('rent-calculator').classList.add('active');
    document.querySelector('.tab-button:nth-child(1)').classList.add('active');
  } else {
    document.getElementById('construction-calculator').classList.add('active');
    document.querySelector('.tab-button:nth-child(2)').classList.add('active');
  }

  debouncedUpdateCalculators();
}

// --- Input / Slider Sync ---
function setupInputSlider(inputId) {
  const input = document.getElementById(inputId);
  const slider = document.getElementById(inputId + 'Slider');

  input.oninput = () => { slider.value = input.value; debouncedUpdateCalculators(); };
  slider.oninput = () => { input.value = slider.value; debouncedUpdateCalculators(); };
}

[
  'interest','years','vacancy','grant',
  'resMin','resMax','resStep','costMin','costMax','costStep',
  'costSqFt','sqFtUnit','nonUnit','units','error'
].forEach(setupInputSlider);

// --- Tooltip ---
const tooltip = document.getElementById('tooltip');
document.querySelectorAll('label[data-tooltip]').forEach(label => {
  label.addEventListener('mouseenter', e => {
    tooltip.innerText = label.getAttribute('data-tooltip');
    tooltip.style.display = 'block';
  });
  label.addEventListener('mousemove', e => {
    tooltip.style.top = (e.clientY + 15) + 'px';
    tooltip.style.left = (e.clientX + 15) + 'px';
  });
  label.addEventListener('mouseleave', e => {
    tooltip.style.display = 'none';
  });
});

// --- Construction Calculator ---
function calculateConstruction() {
  let costSqFt = parseFloat(document.getElementById("costSqFt").value);
  let sqFtUnit = parseFloat(document.getElementById("sqFtUnit").value);
  let nonUnit = parseFloat(document.getElementById("nonUnit").value) / 100;
  let units = parseFloat(document.getElementById("units").value);
  let error = parseFloat(document.getElementById("error").value) / 100;

  let unitSpace = sqFtUnit * units;
  let totalSqFt = unitSpace / (1 - nonUnit);
  let totalCost = totalSqFt * costSqFt * (1 + error);

  document.getElementById("totalSqFt").innerText = Math.round(totalSqFt).toLocaleString() + " sq ft";
  document.getElementById("totalCost").innerText = "$" + Math.round(totalCost).toLocaleString();
}

// --- Virtualization settings ---
const rowHeight = 30;   // px
const colWidth = 80;    // px
const buffer = 5;       // rows/cols buffer

const tableWrapper = document.getElementById('tableWrapper');
const table = document.getElementById('rentTable');

// --- Lazy rent computation ---
function computeRent(cost, residents, interest, years, vacancy, grant) {
  const bond = Math.max(0, cost - grant);
  const totalInterest = bond * interest * years;
  const totalCost = bond + totalInterest;
  const effectiveResidents = residents * (1 - vacancy);
  return Math.round(totalCost / (years * 12) / effectiveResidents);
}

// --- Full render for visible slice ---
function renderVirtualTable() {
  const scrollTop = tableWrapper.scrollTop;
  const scrollLeft = tableWrapper.scrollLeft;
  const visibleRows = Math.ceil(tableWrapper.clientHeight / rowHeight) + buffer*2;
  const visibleCols = Math.ceil(tableWrapper.clientWidth / colWidth) + buffer*2;

  // Read input values
  const interest = parseFloat(document.getElementById("interest").value)/100;
  const years = parseFloat(document.getElementById("years").value);
  const vacancy = parseFloat(document.getElementById("vacancy").value)/100;
  const grant = parseFloat(document.getElementById("grant").value);

  const resMin = parseInt(document.getElementById("resMin").value);
  const resMax = parseInt(document.getElementById("resMax").value);
  const resStep = parseInt(document.getElementById("resStep").value);

  const costMin = parseInt(document.getElementById("costMin").value);
  const costMax = parseInt(document.getElementById("costMax").value);
  const costStep = parseInt(document.getElementById("costStep").value);

  const totalRows = Math.floor((costMax-costMin)/costStep) + 1;
  const totalCols = Math.floor((resMax-resMin)/resStep) + 1;

  const firstVisibleRow = Math.max(0, Math.floor(scrollTop/rowHeight)-buffer);
  const lastVisibleRow = Math.min(totalRows, firstVisibleRow + visibleRows);

  const firstVisibleCol = Math.max(0, Math.floor(scrollLeft/colWidth)-buffer);
  const lastVisibleCol = Math.min(totalCols, firstVisibleCol + visibleCols);

  table.innerHTML = "";

  // Header
  const headerRow = document.createElement("tr");
  headerRow.style.height = rowHeight + "px";
  headerRow.innerHTML = "<th style='width:"+colWidth+"px;'>Property Cost</th>";
  for (let c = firstVisibleCol; c < lastVisibleCol; c++) {
    const res = resMin + c*resStep;
    headerRow.innerHTML += `<th style="width:${colWidth}px;">${res}</th>`;
  }
  table.appendChild(headerRow);

  // Rows
  for (let r = firstVisibleRow; r < lastVisibleRow; r++) {
    const cost = costMin + r*costStep;
    const tr = document.createElement("tr");
    tr.style.height = rowHeight + "px";
    tr.innerHTML = `<th style='width:${colWidth}px;'>$${cost.toLocaleString()}</th>`;
    for (let c = firstVisibleCol; c < lastVisibleCol; c++) {
      const residents = resMin + c*resStep;
      const rent = computeRent(cost, residents, interest, years, vacancy, grant);
      let color;
      if (rent <= 250) color="#4CAF50";
      else if (rent <= 625) color="#FFD54F";
      else if (rent <= 1000) color="#FB8C00";
      else color="#E53935";

      tr.innerHTML += `<td style="width:${colWidth}px;background:${color}">$${rent}</td>`;
    }
    table.appendChild(tr);
  }

  // Padding to simulate full table height/width
  table.style.paddingTop = firstVisibleRow*rowHeight + "px";
  table.style.paddingBottom = (totalRows - lastVisibleRow)*rowHeight + "px";
  table.style.paddingLeft = firstVisibleCol*colWidth + "px";
  table.style.paddingRight = (totalCols - lastVisibleCol)*colWidth + "px";
}

// --- Update calculators ---
function updateCalculators() {
  if (document.getElementById('rent-calculator').classList.contains('active')) {
    renderVirtualTable();
  }
  if (document.getElementById('construction-calculator').classList.contains('active')) {
    calculateConstruction();
  }
}

// --- Scroll listener ---
tableWrapper.addEventListener('scroll', () => { requestAnimationFrame(renderVirtualTable); });

// --- Initial update ---
debouncedUpdateCalculators();
