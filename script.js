// --- Debounce helper ---
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  }
}

const debouncedUpdateCalculators = debounce(updateCalculators, 200);

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

// --- Sync input boxes with sliders ---
function setupInputSlider(inputId) {
  const input = document.getElementById(inputId);
  const slider = document.getElementById(inputId + 'Slider');

  function update() {
    slider.value = input.value;
    debouncedUpdateCalculators();
  }

  function updateFromSlider() {
    input.value = slider.value;
    debouncedUpdateCalculators();
  }

  input.oninput = update;
  slider.oninput = updateFromSlider;
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

// --- Virtualization config ---
const rowHeight = 30;
const buffer = 5;
let tableData = [];

const tableWrapper = document.getElementById('tableWrapper');
const table = document.getElementById('rentTable');
const padTop = document.getElementById('virtual-padding-top');
const padBottom = document.getElementById('virtual-padding-bottom');

tableWrapper.addEventListener('scroll', renderVirtualTable);

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

// --- Generate table data ---
function generateTableData() {
  let interest = parseFloat(document.getElementById("interest").value) / 100;
  let years = parseFloat(document.getElementById("years").value);
  let vacancy = parseFloat(document.getElementById("vacancy").value) / 100;
  let grant = parseFloat(document.getElementById("grant").value);

  let resMin = parseInt(document.getElementById("resMin").value);
  let resMax = parseInt(document.getElementById("resMax").value);
  let resStep = parseInt(document.getElementById("resStep").value);

  let costMin = parseInt(document.getElementById("costMin").value);
  let costMax = parseInt(document.getElementById("costMax").value);
  let costStep = parseInt(document.getElementById("costStep").value);

  const months = years * 12;
  tableData = [];

  for (let cost = costMin; cost <= costMax; cost += costStep) {
    let bondPrincipal = Math.max(0, cost - grant);
    let totalInterest = bondPrincipal * interest * years;
    let totalCost = bondPrincipal + totalInterest;

    let row = [cost];
    for (let r = resMin; r <= resMax; r += resStep) {
      let effectiveResidents = r * (1 - vacancy);
      let rent = Math.round(totalCost / months / effectiveResidents);
      row.push(rent);
    }
    tableData.push(row);
  }
}

// --- Render virtualized rows ---
function renderVirtualTable() {
  if (!tableData.length) return;

  const scrollTop = tableWrapper.scrollTop;
  const visibleRows = Math.ceil(tableWrapper.clientHeight / rowHeight) + buffer * 2;
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
  const endRow = Math.min(tableData.length, startRow + visibleRows);

  table.innerHTML = "";

  // Header
  const headerRow = document.createElement("tr");
  const resMin = parseInt(document.getElementById("resMin").value);
  const resMax = parseInt(document.getElementById("resMax").value);
  const resStep = parseInt(document.getElementById("resStep").value);

  headerRow.innerHTML = "<th>Property Cost</th>" +
    Array.from({ length: Math.floor((resMax - resMin) / resStep) + 1 }, (_, i) => `<th>${resMin + i * resStep}</th>`).join('');
  table.appendChild(headerRow);

  for (let r = startRow; r < endRow; r++) {
    const rowEl = document.createElement("tr");
    rowEl.innerHTML = `<th>$${tableData[r][0].toLocaleString()}</th>` +
      tableData[r].slice(1).map(v => `<td style="background:${v<=250?"#4CAF50":v<=625?"#FFD54F":v<=1000?"#FB8C00":"#E53935"}">$${v}</td>`).join('');
    table.appendChild(rowEl);
  }

  padTop.style.height = startRow * rowHeight + "px";
  padBottom.style.height = (tableData.length - endRow) * rowHeight + "px";
}

// --- Update calculators ---
function updateCalculators() {
  if (document.getElementById('rent-calculator').classList.contains('active')) {
    generateTableData();
    renderVirtualTable();
  }
  if (document.getElementById('construction-calculator').classList.contains('active')) {
    calculateConstruction();
  }
}

// --- Initial ---
debouncedUpdateCalculators();
