// TAB SWITCHING
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

// UTILITY FOR RENT COLOR
function getColor(rent) {
    if (rent <= 250) return "#4CAF50";
    if (rent <= 625) return "#FFD54F";
    if (rent <= 1000) return "#FB8C00";
    return "#E53935";
}

// RENT CALCULATOR
function generateRentTable() {
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

    let header = "<tr><th>Property Cost</th>";
    for (let r = resMin; r <= resMax; r += resStep) {
        header += "<th>" + r + "</th>";
    }
    header += "</tr>";
    table.innerHTML += header;

    for (let cost = costMin; cost <= costMax; cost += costStep) {
        let bondPrincipal = Math.max(0, cost - grant);

        let totalInterest = bondPrincipal * interest * years; // coupon bond
        let totalCost = bondPrincipal + totalInterest;

        let row = "<tr><th>$" + cost.toLocaleString() + "</th>";
        for (let residents = resMin; residents <= resMax; residents += resStep) {
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

// CONSTRUCTION CALCULATOR
function calculateConstruction() {
    let costSqFt = parseFloat(document.getElementById("costSqFt").value);
    let sqFtUnit = parseFloat(document.getElementById("sqFtUnit").value);
    let nonUnit = parseFloat(document.getElementById("nonUnit").value) / 100;
    let units = parseFloat(document.getElementById("units").value);
    let error = parseFloat(document.getElementById("constructionError").value) / 100;

    let unitSpace = sqFtUnit * units;
    let totalSqFt = unitSpace / (1 - nonUnit);
    let totalCost = totalSqFt * costSqFt * (1 + error);

    document.getElementById("totalSqFt").innerText = Math.round(totalSqFt).toLocaleString() + " sq ft";
    document.getElementById("totalCost").innerText = "$" + Math.round(totalCost).toLocaleString();
}

// SLIDERS UPDATE & AUTO-CALCULATE
function setupSlider(id, displayId, callback) {
    const slider = document.getElementById(id);
    const display = document.getElementById(displayId);
    slider.addEventListener("input", () => {
        display.innerText = id.includes("cost") || id === "grant" ? `$${slider.value}` : `${slider.value}${id.includes("Unit") || id === "nonUnit" ? "%" : ""}`;
        callback();
    });
}

// Rent sliders
setupSlider("interest", "interest-val", generateRentTable);
setupSlider("years", "years-val", generateRentTable);
setupSlider("vacancy", "vacancy-val", generateRentTable);
setupSlider("grant", "grant-val", generateRentTable);

// Construction sliders
setupSlider("costSqFt", "costSqFt-val", calculateConstruction);
setupSlider("sqFtUnit", "sqFtUnit-val", calculateConstruction);
setupSlider("nonUnit", "nonUnit-val", calculateConstruction);
setupSlider("units", "units-val", calculateConstruction);
setupSlider("constructionError", "constructionError-val", calculateConstruction);

// Initial render
generateRentTable();
calculateConstruction();
