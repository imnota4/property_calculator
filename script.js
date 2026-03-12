function getColor(rent){

if(rent <= 250) return "#4CAF50"
if(rent <= 625) return "#FFD54F"
if(rent <= 1000) return "#FB8C00"
return "#E53935"

}

function generate(){

let interest = parseFloat(document.getElementById("interest").value)/100
let years = parseFloat(document.getElementById("years").value)
let error = parseFloat(document.getElementById("error").value)
let vacancy = parseFloat(document.getElementById("vacancy").value)/100

let resMin = parseInt(document.getElementById("resMin").value)
let resMax = parseInt(document.getElementById("resMax").value)
let resStep = parseInt(document.getElementById("resStep").value)

let costMin = parseInt(document.getElementById("costMin").value)
let costMax = parseInt(document.getElementById("costMax").value)
let costStep = parseInt(document.getElementById("costStep").value)

let months = years * 12

let table = document.getElementById("rentTable")
table.innerHTML=""

let header = "<tr><th>Property Cost</th>"

for(let r=resMin;r<=resMax;r+=resStep){
header += "<th>"+r+"</th>"
}

header += "</tr>"
table.innerHTML += header

for(let cost=costMin; cost<=costMax; cost+=costStep){

let totalCost = cost * Math.pow(1+interest, years)

let row = "<tr>"
row += "<th>$"+cost.toLocaleString()+"</th>"

for(let residents=resMin; residents<=resMax; residents+=resStep){

let effectiveResidents = residents * (1 - vacancy)

let rent = (totalCost / months / effectiveResidents) * error
rent = Math.round(rent)

let color = getColor(rent)

row += `<td style="background:${color}">$${rent}</td>`

}

row += "</tr>"
table.innerHTML += row

}

}
