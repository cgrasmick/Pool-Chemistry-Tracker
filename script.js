const fields = ["ph","fc","tc","cc","ta","ch","cya","temp"];

let entries = JSON.parse(localStorage.getItem("poolEntries")) || [];
let chemicalsList = JSON.parse(localStorage.getItem("chemList")) || [];

let chart = null;

function saveStorage() {
  localStorage.setItem("poolEntries", JSON.stringify(entries));
  localStorage.setItem("chemList", JSON.stringify(chemicalsList));
}

function getValue(id) {
  const v = document.getElementById(id).value;
  return v === "" ? null : parseFloat(v);
}

/* ---------- CHEMICALS ---------- */

function addChemicalRow(name="", amount="", unit="oz") {
  const container = document.getElementById("chemicalsContainer");

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "5px";

  const chemSelect = document.createElement("select");

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Chemical";
  chemSelect.appendChild(defaultOpt);

  chemicalsList.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    if (c === name) opt.selected = true;
    chemSelect.appendChild(opt);
  });

  const newOpt = document.createElement("option");
  newOpt.value = "__new__";
  newOpt.textContent = "+ Add New";
  chemSelect.appendChild(newOpt);

  chemSelect.addEventListener("change", function(){
    if (this.value === "__new__") {
      const newChem = prompt("New chemical name:");
      if (newChem) {
        chemicalsList.push(newChem);
        saveStorage();
        renderChemicalDropdowns();
      }
    }
  });

  const amtInput = document.createElement("input");
  amtInput.type = "number";
  amtInput.step = "0.01";
  amtInput.placeholder = "Amt";
  amtInput.value = amount;

  const unitSelect = document.createElement("select");
  ["oz","lb","gal","ml","g"].forEach(u=>{
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = u;
    if (u === unit) opt.selected = true;
    unitSelect.appendChild(opt);
  });

  row.appendChild(chemSelect);
  row.appendChild(amtInput);
  row.appendChild(unitSelect);

  container.appendChild(row);
}

function renderChemicalDropdowns() {
  const container = document.getElementById("chemicalsContainer");
  container.innerHTML = "";
  addChemicalRow();
}

/* ---------- SAVE ENTRY ---------- */

document.getElementById("entryForm").addEventListener("submit", function(e){
  e.preventDefault();

  const entry = {
    date: document.getElementById("date").value,
    notes: document.getElementById("notes").value,
    chemicals: []
  };

  fields.forEach(f=>{
    entry[f] = getValue(f);
  });

  document.querySelectorAll("#chemicalsContainer div").forEach(row=>{
    const selects = row.querySelectorAll("select");
    const inputs = row.querySelectorAll("input");

    if (selects[0].value && inputs[0].value) {
      entry.chemicals.push({
        name: selects[0].value,
        amount: parseFloat(inputs[0].value),
        unit: selects[1].value
      });
    }
  });

  entries.push(entry);
  entries.sort((a,b)=> new Date(b.date) - new Date(a.date));

  saveStorage();
  render();

  this.reset();
  renderChemicalDropdowns();
});

/* ---------- TABLE ---------- */

function renderTable() {
  const tbody = document.querySelector("#entriesTable tbody");
  tbody.innerHTML = "";

  entries.forEach(e=>{
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${e.date}</td>
      ${fields.map(f=>`<td>${e[f] ?? ""}</td>`).join("")}
      <td></td>
    `;

    tbody.appendChild(tr);
  });
}

/* ---------- CHART ---------- */

function renderChart() {
  const ctx = document.getElementById("chart");

  if (chart) chart.destroy();

  const labels = entries.slice().reverse().map(e=>e.date);

  const datasets = fields.map(f=>({
    label: f.toUpperCase(),
    data: entries.slice().reverse().map(e=>e[f]),
    spanGaps:false
  }));

  chart = new Chart(ctx,{
    type:"line",
    data:{ labels, datasets },
    options:{ responsive:true }
  });
}

/* ---------- EXPORT ---------- */

function exportCSV() {
  let csv = "Date," + fields.join(",") + "\n";
  entries.forEach(e=>{
    csv += e.date + "," +
      fields.map(f=>e[f] ?? "").join(",") +
      "\n";
  });

  const blob = new Blob([csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pool_data.csv";
  a.click();
}

document.getElementById("exportBtn").addEventListener("click", exportCSV);

/* ---------- INIT ---------- */

function render(){
  renderTable();
  renderChart();
}

renderChemicalDropdowns();
render();
