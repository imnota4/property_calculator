function calculate(){

let constructionCost = parseFloat(document.getElementById("constructionCost").value)
let grant = parseFloat(document.getElementById("grant").value)
let interestRate = parseFloat(document.getElementById("interestRate").value) / 100
let termYears = parseFloat(document.getElementById("termYears").value)
let units = parseFloat(document.getElementById("units").value)

let months = termYears * 12
let monthlyRate = interestRate / 12

// subtract grant
let bondAmount = constructionCost - grant

if(bondAmount < 0){
bondAmount = 0
}

// bond payment formula
let monthlyPayment = bondAmount *
(monthlyRate * Math.pow(1 + monthlyRate, months)) /
(Math.pow(1 + monthlyRate, months) - 1)

let rentPerUnit = monthlyPayment / units

// display results
document.getElementById("bondAmount").innerText =
"$" + Math.round(bondAmount).toLocaleString()

document.getElementById("monthlyPayment").innerText =
"$" + Math.round(monthlyPayment).toLocaleString()

document.getElementById("rentPerUnit").innerText =
"$" + Math.round(rentPerUnit).toLocaleString()

}
}
