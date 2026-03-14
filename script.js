// --- Debounce ---
function debounce(func,delay){
  let timeout;
  return (...args)=>{
    clearTimeout(timeout);
    timeout=setTimeout(()=>func(...args),delay);
  }
}
const debouncedUpdate=debounce(updateCalculators,50);

// --- Tab switching ---
function switchTab(tab){
  document.querySelectorAll('.calculator').forEach(c=>c.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));
  if(tab==='rent'){
    document.getElementById('rent-calculator').classList.add('active');
    document.querySelector('.tab-button:nth-child(1)').classList.add('active');
  }else{
    document.getElementById('construction-calculator').classList.add('active');
    document.querySelector('.tab-button:nth-child(2)').classList.add('active');
  }
  debouncedUpdate();
}

// --- Input/Slider Sync ---
function setupInputSlider(id){
  const input=document.getElementById(id);
  const slider=document.getElementById(id+'Slider');
  input.oninput=()=>{slider.value=input.value;debouncedUpdate();}
  slider.oninput=()=>{input.value=slider.value;debouncedUpdate();}
}
[
  'interest','years','vacancy','grant',
  'resMin','resMax','resStep','costMin','costMax','costStep',
  'costSqFt','sqFtUnit','nonUnit','units','error'
].forEach(setupInputSlider);

// --- Tooltip ---
const tooltip=document.getElementById('tooltip');
document.querySelectorAll('label[data-tooltip]').forEach(label=>{
  label.addEventListener('mouseenter',()=>{tooltip.innerText=label.dataset.tooltip;tooltip.style.display='block';});
  label.addEventListener('mousemove',e=>{tooltip.style.top=(e.clientY+15)+'px';tooltip.style.left=(e.clientX+15)+'px';});
  label.addEventListener('mouseleave',()=>{tooltip.style.display='none';});
});

// --- Construction Calculator ---
function calculateConstruction(){
  let costSqFt=parseFloat(document.getElementById("costSqFt").value);
  let sqFtUnit=parseFloat(document.getElementById("sqFtUnit").value);
  let nonUnit=parseFloat(document.getElementById("nonUnit").value)/100;
  let units=parseFloat(document.getElementById("units").value);
  let error=parseFloat(document.getElementById("error").value)/100;
  let unitSpace=sqFtUnit*units;
  let totalSqFt=unitSpace/(1-nonUnit);
  let totalCost=totalSqFt*costSqFt*(1+error);
  document.getElementById("totalSqFt").innerText=Math.round(totalSqFt).toLocaleString()+" sq ft";
  document.getElementById("totalCost").innerText="$"+Math.round(totalCost).toLocaleString();
}

// --- Virtualized Rent Table ---
const tableContainer=document.getElementById('tableContainer');
const tableHeader=document.getElementById('tableHeader');
const tableBody=document.getElementById('tableBody');
const rowHeight=30, colWidth=80, buffer=5;

function computeRent(cost,residents,interest,years,vacancy,grant){
  const principal=Math.max(0,cost-grant);
  const totalInterest=principal*interest*years;
  const totalCost=principal+totalInterest;
  const effectiveResidents=residents*(1-vacancy);
  return Math.round(totalCost/(years*12*effectiveResidents));
}

function renderVirtualTable(){
  const interest=parseFloat(document.getElementById("interest").value)/100;
  const years=parseFloat(document.getElementById("years").value);
  const vacancy=parseFloat(document.getElementById("vacancy").value)/100;
  const grant=parseFloat(document.getElementById("grant").value);
  const resMin=parseInt(document.getElementById("resMin").value);
  const resMax=parseInt(document.getElementById("resMax").value);
  const resStep=parseInt(document.getElementById("resStep").value);
  const costMin=parseInt(document.getElementById("costMin").value);
  const costMax=parseInt(document.getElementById("costMax").value);
  const costStep=parseInt(document.getElementById("costStep").value);

  const totalCols=Math.floor((resMax-resMin)/resStep)+1;
  const totalRows=Math.floor((costMax-costMin)/costStep)+1;

  // Header
  tableHeader.innerHTML='';
  tableHeader.style.width=(totalCols*colWidth+colWidth)+'px';
  const firstHeaderCell=document.createElement('div');
  firstHeaderCell.className='cell';
  firstHeaderCell.innerText='Property Cost';
  tableHeader.appendChild(firstHeaderCell);
  for(let c=0;c<totalCols;c++){
    const res=resMin+c*resStep;
    const div=document.createElement('div');
    div.className='cell';
    div.innerText=res;
    tableHeader.appendChild(div);
  }

  // Virtualized rows
  const scrollTop=tableBody.scrollTop;
  const startRow=Math.max(0,Math.floor(scrollTop/rowHeight)-buffer);
  const endRow=Math.min(totalRows,startRow+Math.ceil(tableBody.clientHeight/rowHeight)+buffer*2);

  tableBody.innerHTML='';
  tableBody.style.height=(totalRows*rowHeight)+'px';
  tableBody.scrollTop=scrollTop;

  for(let r=startRow;r<endRow;r++){
    const cost=costMin+r*costStep;
    const row=document.createElement('div');
    row.className='row';
    row.style.position='absolute';
    row.style.top=(r*rowHeight)+'px';
    row.style.height=rowHeight+'px';
    // Property Cost
    const costCell=document.createElement('div');
    costCell.className='cell';
    costCell.innerText='$'+cost.toLocaleString();
    row.appendChild(costCell);
    // Resident Rents
    for(let c=0;c<totalCols;c++){
      const residents=resMin+c*resStep;
      const rent=computeRent(cost,residents,interest,years,vacancy,grant);
      const div=document.createElement('div');
      div.className='cell';
      div.innerText='$'+rent;
      if(rent<=250) div.style.background="#4CAF50";
      else if(rent<=625) div.style.background="#FFD54F";
      else if(rent<=1000) div.style.background="#FB8C00";
      else div.style.background="#E53935";
      row.appendChild(div);
    }
    tableBody.appendChild(row);
  }
}

tableBody.addEventListener('scroll',()=>{renderVirtualTable();});

// --- Update calculators ---
function updateCalculators(){
  if(document.getElementById('rent-calculator').classList.contains('active')){
    renderVirtualTable();
  }
  if(document.getElementById('construction-calculator').classList.contains('active')){
    calculateConstruction();
  }
}

// --- Initial ---
debouncedUpdate();
