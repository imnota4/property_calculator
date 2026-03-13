// --- Debounce helper ---
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  }
}

// --- Debounced update ---
const debouncedUpdate = debounce(updateCalculators, 100);

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

// --- Sync inputs & sliders ---
function setupInputSlider(id){
  const input=document.getElementById(id);
  const slider=document.getElementById(id+'Slider');
  input.oninput=function(){slider.value=input.value;debouncedUpdate();}
  slider.oninput=function(){input.value=slider.value;debouncedUpdate();}
}

[
  'interest','years','vacancy','grant',
  'resMin','resMax','resStep','costMin','costMax','costStep',
  'costSqFt','sqFtUnit','nonUnit','units','error'
].forEach(setupInputSlider);

// --- Tooltips ---
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

// --- Rent Table Virtualization ---
const tableWrapper=document.getElementById('tableWrapper');
const table=document.getElementById('rentTable');
const rowHeight=30;
const colWidth=80;
const buffer=5;

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

  const totalRows=Math.floor((costMax-costMin)/costStep)+1;
  const totalCols=Math.floor((resMax-resMin)/resStep)+1;

  table.style.height=totalRows*rowHeight+"px";
  table.style.width=totalCols*colWidth+"px";

  const scrollTop=tableWrapper.scrollTop;
  const scrollLeft=tableWrapper.scrollLeft;

  const firstRow=Math.max(0,Math.floor(scrollTop/rowHeight)-buffer);
  const lastRow=Math.min(totalRows,firstRow+Math.ceil(tableWrapper.clientHeight/rowHeight)+buffer*2);
  const firstCol=Math.max(0,Math.floor(scrollLeft/colWidth)-buffer);
  const lastCol=Math.min(totalCols,firstCol+Math.ceil(tableWrapper.clientWidth/colWidth)+buffer*2);

  table.innerHTML="";

  // Header
  const headerTr=document.createElement("tr");
  headerTr.style.position="sticky";
  headerTr.style.top="0px";
  headerTr.style.left="0px";
  headerTr.style.height=rowHeight+"px";
  headerTr.innerHTML="<th style='width:"+colWidth+"px;'>Property Cost</th>";
  for(let c=firstCol;c<lastCol;c++){
    const res=resMin+c*resStep;
    headerTr.innerHTML+=`<th style="width:${colWidth}px;">${res}</th>`;
  }
  table.appendChild(headerTr);

  // Data Rows
  for(let r=firstRow;r<lastRow;r++){
    const cost=costMin+r*costStep;
    const tr=document.createElement("tr");
    tr.style.position="absolute";
    tr.style.top=(r*rowHeight+rowHeight)+"px";
    tr.style.left="0px";
    tr.style.height=rowHeight+"px";
    tr.innerHTML=`<th style="width:${colWidth}px;">$${cost.toLocaleString()}</th>`;
    for(let c=firstCol;c<lastCol;c++){
      const residents=resMin+c*resStep;
      const rent=computeRent(cost,residents,interest,years,vacancy,grant);
      let color;
      if(rent<=250) color="#4CAF50";
      else if(rent<=625) color="#FFD54F";
      else if(rent<=1000) color="#FB8C00";
      else color="#E53935";
      tr.innerHTML+=`<td style="width:${colWidth}px;background:${color}">$${rent}</td>`;
    }
    table.appendChild(tr);
  }
}

// --- Scroll listener ---
let ticking=false;
tableWrapper.addEventListener('scroll',()=>{
  if(!ticking){
    requestAnimationFrame(()=>{
      renderVirtualTable();
      ticking=false;
    });
    ticking=true;
  }
});

// --- Update calculators ---
function updateCalculators(){
  if(document.getElementById('rent-calculator').classList.contains('active')){
    renderVirtualTable();
  }
  if(document.getElementById('construction-calculator').classList.contains('active')){
    calculateConstruction();
  }
}

// --- Initial update ---
debouncedUpdate();
