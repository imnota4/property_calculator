// Tab switching
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
}

// Sync sliders and number inputs
function syncSlider(inputId, sliderId) {
  const input = document.getElementById(inputId);
  const slider = document.getElementById(sliderId);

  slider.addEventListener('input', () => {
    input.value = slider.value;
    updateCalculators();
  });

  input.addEventListener('input', () => {
    slider.value = input.value;
    updateCalculators();
  });
}

// Setup all synced sliders
syncSlider('interest','interest-slider');
syncSlider('years','years-slider');
syncSlider('vacancy','vacancy-slider');
syncSlider('grant','grant-slider');

syncSlider('costSqFt','costSqFt-slider');
syncSlider('sqFtUnit','sqFtUnit-slider');
syncSlider('nonUnit','nonUnit-slider');
syncSlider('error','error-slider');

// Update both calculators
function updateCalculators() {
  if(document.getElementById('rent-calculator').classList.contains('active')){
    generateRentTable();
  }
  if(document.getElementById('construction-calculator').classList.contains('active')){
    calculateConstruction();
  }
}

// Rent Table Generator
function getColor(rent){
  if(rent <= 250) return "#4CAF50";
  if(rent <= 625) return "#FFD54F";
  if(rent <= 1000) return "#FB8C00";
  return "#E53935";
}

function generateRentTable() {
  let interest = parseFloat(document.getElementById("interest").value)/100;
  let years = parseFloat(document.getElementById("years").value);
  let vacancy = parseFloat(document.getElementById("vacancy").value)/100;
  let grant = parseFloat(document.getElementById("grant").value);

  let resMin = parseInt(document.getElementById("resMin").value);
  let resMax = parseInt(document.getElementById("resMax").value);
  let resStep = parseInt(document.getElementById("resStep").value);

  let costMin = parseInt(document.getElementById("costMin").value);
  let costMax = parseInt(document.getElementById("costMax").value);
  let costStep = parseInt(document.getElementById("costStep").value);

  let months = years * 12;
  let table = document.getElementById("rentTable");
  table.innerHTML="";

  let header = "<tr><th>Property Cost</th>";
  for(let r=resMin;r<=resMax;r+=resStep){
    header += "<th>"+r+"</th>";
  }
  header += "</tr>";
  table.innerHTML += header;

  for(let cost=costMin; cost<=costMax; cost+=costStep){
    let bondPrincipal = Math.max(0, cost - grant);
    let totalInterest = bondPrincipal * interest * years;
    let totalCost = bondPrincipal + totalInterest;

    let row = "<tr>";
    row += "<th>$"+cost.toLocaleString()+"</th>";

    for(let residents=resMin; residents<=resMax; residents+=resStep){
      let effectiveResidents = residents * (1 - vacancy);
      let rent = totalCost / months / effectiveResidents;
      rent = Math.round(rent);
      let color = getColor(rent);
      row += `<td style="background:${color}">$${rent}</td>`;
    }
    row += "</tr>";
    table.innerHTML += row;
  }
}

// Construction Calculator
function calculateConstruction(){
  let costSqFt = parseFloat(document.getElementById("costSqFt").value);
  let sqFtUnit = parseFloat(document.getElementById("sqFtUnit").value);
  let nonUnit = parseFloat(document.getElementById("nonUnit").value)/100;
  let units = parseFloat(document.getElementById("units").value);
  let error = parseFloat(document.getElementById("error").value)/100;

  let unitSpace = sqFtUnit * units;
  let totalSqFt = unitSpace / (1 - nonUnit);
  let totalCost = totalSqFt * costSqFt * (1 + error);

  document.getElementById("totalSqFt").innerText = Math.round(totalSqFt).toLocaleString() + " sq ft";
  document.getElementById("totalCost").innerText = "$" + Math.round(totalCost).toLocaleString();
}

// Initial update
updateCalculators();
