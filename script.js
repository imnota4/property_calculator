// --- Config ---
const rowHeight = 30;
const colWidth = 100;
const buffer = 5;

// DOM elements
const tableWrapper = document.getElementById('tableWrapper');
const table = document.getElementById('rentTable');
const padTop = document.getElementById('virtual-padding-top');
const padBottom = document.getElementById('virtual-padding-bottom');
const fakeScrollbar = document.getElementById('fakeScrollbar');
const fakeInner = document.getElementById('fakeInner');

let tableData = []; // [propertyCost, rents...]

// --- Utilities ---
function getColor(r){
  if(r<=250)return"#4CAF50";
  if(r<=625)return"#FFD54F";
  if(r<=1000)return"#FB8C00";
  return"#E53935";
}

// --- Debounce ---
function debounce(func, delay){ let t; return function(...a){ clearTimeout(t); t=setTimeout(()=>func.apply(this,a),delay); } }
const debouncedUpdate = debounce(updateCalculators,200);

// --- Tab switching ---
function switchTab(tab){
  document.querySelectorAll('.calculator').forEach(c=>c.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
  if(tab==='rent'){ document.getElementById('rent-calculator').classList.add('active'); document.querySelector('.tab-button:nth-child(1)').classList.add('active'); }
  else{ document.getElementById('construction-calculator').classList.add('active'); document.querySelector('.tab-button:nth-child(2)').classList.add('active'); }
  debouncedUpdate();
}

// --- Sync sliders ---
function setupInputSlider(id){ 
  const input=document.getElementById(id), slider=document.getElementById(id+'Slider');
  input.oninput=()=>{slider.value=input.value; debouncedUpdate();};
  slider.oninput=()=>{input.value=slider.value; debouncedUpdate();};
}
['interest','years','vacancy','grant','resMin','resMax','resStep','costMin','costMax','costStep','costSqFt','sqFtUnit','nonUnit','units','error'].forEach(setupInputSlider);

// --- Tooltip ---
const tooltip=document.getElementById('tooltip');
document.querySelectorAll('label[data-tooltip]').forEach(l=>{
  l.addEventListener('mouseenter',()=>{tooltip.innerText=l.getAttribute('data-tooltip');tooltip.style.display='block';});
  l.addEventListener('mousemove',e=>{tooltip.style.top=(e.clientY+15)+'px';tooltip.style.left=(e.clientX+15)+'px';});
  l.addEventListener('mouseleave',()=>{tooltip.style.display='none';});
});

// --- Horizontal scrollbar sync ---
tableWrapper.addEventListener('scroll', renderVirtualTable);
fakeScrollbar.addEventListener('scroll', ()=>tableWrapper.scrollLeft=fakeScrollbar.scrollLeft);
tableWrapper.addEventListener('scroll', ()=>fakeScrollbar.scrollLeft=tableWrapper.scrollLeft);

// --- Construction calculator ---
function calculateConstruction(){
  let costSqFt=parseFloat(document.getElementById("costSqFt").value);
  let sqFtUnit=parseFloat(document.getElementById("sqFtUnit").value);
  let nonUnit=parseFloat(document.getElementById("nonUnit").value)/100;
  let units=parseFloat(document.getElementById("units").value);
  let error=parseFloat(document.getElementById("error").value)/100;
  let unitSpace = sqFtUnit*units;
  let totalSqFt = unitSpace/(1-nonUnit);
  let totalCost = totalSqFt*costSqFt*(1+error);
  document.getElementById("totalSqFt").innerText=Math.round(totalSqFt).toLocaleString()+" sq ft";
  document.getElementById("totalCost").innerText="$"+Math.round(totalCost).toLocaleString();
}

// --- Generate full table ---
function generateTableData(){
  let resMin=parseInt(document.getElementById("resMin").value);
  let resMax=parseInt(document.getElementById("resMax").value);
  let resStep=parseInt(document.getElementById("resStep").value);
  let costMin=parseInt(document.getElementById("costMin").value);
  let costMax=parseInt(document.getElementById("costMax").value);
  let costStep=parseInt(document.getElementById("costStep").value);
  let interest=parseFloat(document.getElementById("interest").value)/100;
  let years=parseFloat(document.getElementById("years").value);
  let vacancy=parseFloat(document.getElementById("vacancy").value)/100;
  let grant=parseFloat(document.getElementById("grant").value);
  const months = years*12;

  tableData = [];
  for(let cost=costMin; cost<=costMax; cost+=costStep){
    let bondPrincipal=Math.max(0,cost-grant);
    let totalInterest = bondPrincipal*interest*years;
    let totalCost = bondPrincipal+totalInterest;
    let row = [cost];
    for(let r=resMin;r<=resMax;r+=resStep){ row.push(Math.round(totalCost/months*r*(1-vacancy))); }
    tableData.push(row);
  }

  fakeInner.style.width=(tableData[0]?.length*colWidth||1000)+"px";
}

// --- Render virtualized 2D table ---
function renderVirtualTable(){
  if(!tableData.length) return;
  const scrollTop = tableWrapper.scrollTop;
  const scrollLeft = tableWrapper.scrollLeft;
  const visibleRows = Math.ceil(tableWrapper.clientHeight/rowHeight)+buffer*2;
  const visibleCols = Math.ceil(tableWrapper.clientWidth/colWidth)+buffer*2;

  const startRow = Math.max(0,Math.floor(scrollTop/rowHeight)-buffer);
  const endRow = Math.min(tableData.length,startRow+visibleRows);

  const startCol = Math.max(0,Math.floor(scrollLeft/colWidth)-buffer);
  const endCol = Math.min(tableData[0].length,startCol+visibleCols);

  table.innerHTML = "";

  // Header
  const headerRow=document.createElement('tr');
  headerRow.innerHTML = (startCol===0? "<th>Property Cost</th>" : "") + tableData[0].slice(startCol+(startCol===0?1:0),endCol).map((_,i)=>`<th>${i+startCol+(startCol===0?1:0)}</th>`).join('');
  table.appendChild(headerRow);

  // Rows
  for(let r=startRow;r<endRow;r++){
    const row=document.createElement('tr');
    let cells = "";
    if(startCol===0) cells += `<th>$${tableData[r][0].toLocaleString()}</th>`;
    cells += tableData[r].slice(startCol+(startCol===0?1:0),endCol).map(v=>`<td style="background:${getColor(v)}">$${v}</td>`).join('');
    row.innerHTML = cells;
    table.appendChild(row);
  }

  padTop.style.height = startRow*rowHeight + "px";
  padBottom.style.height = (tableData.length-endRow)*rowHeight + "px";
}

// --- Update calculators ---
function updateCalculators(){
  if(document.getElementById('rent-calculator').classList.contains('active')){
    generateTableData();
    renderVirtualTable();
  }
  if(document.getElementById('construction-calculator').classList.contains('active')) calculateConstruction();
}

// --- Initial ---
debouncedUpdate();
