// --- Debounce ---
function debounce(func, delay) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  }
}
const debouncedUpdateCalculators = debounce(updateCalculators, 100);
 
// --- Tab Switching ----
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
const rowHeight=30;
const colWidth=80;
const buffer=5;
const tableWrapper=document.getElementById('tableWrapper');
const table=document.getElementById('rentTable');
 
// --- Lazy Rent Computation ---
function computeRent(cost,residents,interest,years,vacancy,grant){
  const bond=Math.max(0,cost-grant);
  const totalInterest=bond*interest*years;
  const totalCost=bond+totalInterest;
  const effectiveResidents=residents*(1-vacancy);
  return Math.round(totalCost/(years*12)/effectiveResidents);
}
 
// --- Virtual Table Render ---
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
 
  // +1 row height reserves space for the sticky header row
  table.style.height=(totalRows+1)*rowHeight+"px";
  table.style.width=totalCols*colWidth+"px";
 
  const scrollTop=tableWrapper.scrollTop;
  const scrollLeft=tableWrapper.scrollLeft;
 
  const firstRow=Math.max(0,Math.floor(scrollTop/rowHeight)-buffer);
  const lastRow=Math.min(totalRows,firstRow+Math.ceil(tableWrapper.clientHeight/rowHeight)+buffer*2);
  const firstCol=Math.max(0,Math.floor(scrollLeft/colWidth)-buffer);
  const lastCol=Math.min(totalCols,firstCol+Math.ceil(tableWrapper.clientWidth/colWidth)+buffer*2);
 
  table.innerHTML="";
 
  const cellStyle=`width:${colWidth}px;max-width:${colWidth}px;overflow:hidden;white-space:nowrap;box-sizing:border-box;`;
 
  // Header row — pinned vertically via scrollTop, horizontally starts at firstCol
  const headerTr=document.createElement("tr");
  headerTr.style.position="absolute";
  headerTr.style.top=scrollTop+"px";
  headerTr.style.left=(firstCol*colWidth)+"px";
  headerTr.style.height=rowHeight+"px";
  // Corner label cell pinned horizontally within the row
  headerTr.innerHTML=`<th style="${cellStyle}position:relative;left:${scrollLeft-firstCol*colWidth}px;">Property Cost</th>`;
  for(let c=firstCol;c<lastCol;c++){const res=resMin+c*resStep;headerTr.innerHTML+=`<th style="${cellStyle}">${res}</th>`;}
  table.appendChild(headerTr);
 
  // Data rows — offset by 1 row height so they clear the header
  for(let r=firstRow;r<lastRow;r++){
    const cost=costMin+r*costStep;
    const tr=document.createElement("tr");
    tr.style.position="absolute";
    tr.style.top=((r+1)*rowHeight)+"px";
    tr.style.left=(firstCol*colWidth)+"px";
    tr.style.height=rowHeight+"px";
    // Row label cell pinned horizontally within the row
    tr.innerHTML=`<th style="${cellStyle}position:relative;left:${scrollLeft-firstCol*colWidth}px;">$${cost.toLocaleString()}</th>`;
    for(let c=firstCol;c<lastCol;c++){
      const residents=resMin+c*resStep;
      const rent=computeRent(cost,residents,interest,years,vacancy,grant);
      let color;
      if(rent<=250) color="#4CAF50";
      else if(rent<=625) color="#FFD54F";
      else if(rent<=1000) color="#FB8C00";
      else color="#E53935";
      tr.innerHTML+=`<td style="${cellStyle}background:${color}">$${rent}</td>`;
    }
    table.appendChild(tr);
  }
}
 
// --- Update Calculators ---
function updateCalculators(){
  if(document.getElementById('rent-calculator').classList.contains('active')) renderVirtualTable();
  if(document.getElementById('construction-calculator').classList.contains('active')) calculateConstruction();
}
 
// --- Scroll Listener ---
tableWrapper.addEventListener('scroll',()=>{requestAnimationFrame(renderVirtualTable);});
 
// --- Initial Update ---
debouncedUpdateCalculators();
