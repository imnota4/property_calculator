// ----------------- Tabs -----------------
const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const tabResults = document.querySelectorAll(".tab-result");

tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.getAttribute("data-tab");

        tabContents.forEach(c => c.classList.remove("active"));
        document.getElementById(tab + "-tab").classList.add("active");

        tabResults.forEach(r => r.classList.remove("active"));
        document.getElementById(tab + "-result").classList.add("active");
    });
});

// ----------------- Rent Calculator -----------------
function getColor(rent) {
    if (rent <= 250) return "#4CAF50";
    if (rent <= 625) return "#FFD54F";
    if (rent <= 1000) return "#FB8C00";
    return "#E53935";
}

function generateRent() {
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

    let months = years * 12;
    let table = document.getElementById("rentTable");
    table.innerHTML = "";

    // Header
    let header = "<tr><th>Property Cost</th>";
    for (let r = resMin; r <= resMax; r += resStep) {
        header += `<th>${r}</th>`;
    }
    header += "</tr>";
    table.innerHTML += header;

    // Rows
    for (let cost = costMin; cost <= costMax; cost += costStep) {
        let bondPrincipal = Math.max(0, cost - grant);
        let totalInterest = bondPrincipal * interest * years;
        let totalCost = bondPrincipal + totalInterest;

        let row = `<tr><th>$${cost.toLocaleString()}</th>`;
        for (let residents = resMin; residents <= resMax; residents += resStep) {
            let effectiveResidents = residents * (1 - vacancy);
            let rent = Math.round(totalCost / months / effectiveResidents);
            let color = getColor(rent);
            row += `<td style="background:${color}">$${rent}</td>`;
        }
        row += "</tr>";
        table.innerHTML += row;
    }
}

// ----------------- Construction Calculator -----------------
function generateConstruction() {
    let costSqFt = parseFloat(document.getElementById("costSqFt").value);
    let sqFtUnit = parseFloat(document.getElementById("sqFtUnit").value);
    let nonUnit = parseFloat(document.getElementById("nonUnit").value) / 100;
    let units = parseFloat(document.getElementById("units").value);
    let error = parseFloat(document.getElementById("errorConstruction").value);

    let unitSpace = sqFtUnit * units;
    let totalSqFt = unitSpace / (1 - nonUnit);
    let totalCost = totalSqFt * costSqFt * error;

    document.getElementById("totalSqFt").innerText = Math.round(totalSqFt).toLocaleString() + " sq ft";
    document.getElementById("totalCost").innerText = "$" + Math.round(totalCost).toLocaleString();
}

// ----------------- Sync sliders -----------------
function syncInput(numId, sliderId, callback) {
    const num = document.getElementById(numId);
    const slider = document.getElementById(sliderId);

    num.addEventListener("input", () => {
        slider.value = num.value;
        callback();
    });

    slider.addEventListener("input", () => {
        num.value = slider.value;
        callback();
    });
}

// ----------------- Initialize -----------------
window.onload = function () {
    // Rent calculator sliders
    syncInput("interest", "interestSlider", generateRent);
    syncInput("years", "yearsSlider", generateRent);
    syncInput("vacancy", "vacancySlider", generateRent);
    syncInput("grant", "grantSlider", generateRent);
    syncInput("resMin", "resMinSlider", generateRent);
    syncInput("resMax", "resMaxSlider", generateRent);
    syncInput("resStep", "resStepSlider", generateRent);
    syncInput("costMin", "costMinSlider", generateRent);
    syncInput("costMax", "costMaxSlider", generateRent);
    syncInput("costStep", "costStepSlider", generateRent);
    generateRent();

    // Construction sliders
    syncInput("costSqFt", "costSqFtSlider", generateConstruction);
    syncInput("sqFtUnit", "sqFtUnitSlider", generateConstruction);
    syncInput("nonUnit", "nonUnitSlider", generateConstruction);
    syncInput("units", "unitsSlider", generateConstruction);
    syncInput("errorConstruction", "errorConstructionSlider", generateConstruction);
    generateConstruction();
};
