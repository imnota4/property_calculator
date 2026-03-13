 // Color coding for rent cells
function getColor(rent) {
    if (rent <= 250) return "#4CAF50";
    if (rent <= 625) return "#FFD54F";
    if (rent <= 1000) return "#FB8C00";
    return "#E53935";
}

// Generate table
function generate() {

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

    // Table header
    let header = "<tr><th>Property Cost</th>";
    for (let r = resMin; r <= resMax; r += resStep) {
        header += "<th>" + r + "</th>";
    }
    header += "</tr>";
    table.innerHTML += header;

    // Table rows
    for (let cost = costMin; cost <= costMax; cost += costStep) {

        let bondPrincipal = Math.max(0, cost - grant);

        // Coupon bond: total interest over life
        let totalInterest = bondPrincipal * interest * years;
        let totalCost = bondPrincipal + totalInterest;

        let row = "<tr>";
        row += "<th>$" + cost.toLocaleString() + "</th>";

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

// Helper to sync number input and slider
function syncInput(numberId, sliderId) {
    const numInput = document.getElementById(numberId);
    const slider = document.getElementById(sliderId);

    numInput.addEventListener("input", () => {
        slider.value = numInput.value;
        generate();
    });

    slider.addEventListener("input", () => {
        numInput.value = slider.value;
        generate();
    });
}

// Initialize all synced inputs
window.onload = function () {
    generate(); // Initial table
    syncInput("interest", "interestSlider");
    syncInput("years", "yearsSlider");
    syncInput("vacancy", "vacancySlider");
    syncInput("grant", "grantSlider");
    syncInput("resMin", "resMinSlider");
    syncInput("resMax", "resMaxSlider");
    syncInput("resStep", "resStepSlider");
    syncInput("costMin", "costMinSlider");
    syncInput("costMax", "costMaxSlider");
    syncInput("costStep", "costStepSlider");
};
