// ===== Storage Keys =====
const STORAGE_KEY = "poolData";
const CHEMICALS_KEY = "chemicalsList";

// ===== Select Elements =====
const form = document.getElementById("entry-form");
const chemicalSelect = document.getElementById("chemical-select");
const newChemicalInput = document.getElementById("new-chemical");
const addChemicalBtn = document.getElementById("add-chemical");
const toggleCheckboxes = document.querySelectorAll(".toggle-line");
const toggleAll = document.getElementById("toggle-all");
const tableBody = document.querySelector("#entries-table tbody");
const ctx = document.getElementById("pool-chart").getContext("2d");

// ===== Load Data =====
let poolData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let chemicalsList = JSON.parse(localStorage.getItem(CHEMICALS_KEY)) || [];

// Populate chemical dropdown
function populateChemicalDropdown() {
  chemicalSelect.innerHTML = "";
  chemicalsList.forEach(c => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    chemicalSelect.appendChild(option);
  });
}
populateChemicalDropdown();

// ===== Add New Chemical =====
addChemicalBtn.addEventListener("click", () => {
  const newChem = newChemicalInput.value.trim();
  if (newChem && !chemicalsList.includes(newChem)) {
    chemicalsList.push(newChem);
    localStorage.setItem(CHEMICALS_KEY, JSON.stringify(chemicalsList));
    populateChemicalDropdown();
    newChemicalInput.value = "";
  }
});

// ===== Submit Entry =====
form.addEventListener("submit", e => {
  e.preventDefault();

  const chemicals = [];
  const chemName = chemicalSelect.value;
  const chemAmount = parseFloat(document.getElementById("chemical-amount").value) || 0;
  const chemUnit = document.getElementById("chemical-unit").value || "";

  if (chemName) chemicals.push({ name: chemName, amount: chemAmount, unit: chemUnit });

  const entry = {
    date: document.getElementById("date").value,
    notes: document.getElementById("notes").value,
    ph: parseFloat(document.getElementById("ph").value) || null,
    fc: parseFloat(document.getElementById("fc").value) || null,
    tc: parseFloat(document.getElementById("tc").value) || null,
    cc: parseFloat(document.getElementById("cc").value) || null,
    ta: parseFloat(document.getElementById("ta").value) || null,
    ch: parseFloat(document.getElementById("ch").value) || null,
    cya: parseFloat(document.getElementById("cya").value) || null,
    temp: parseFloat(document.getElementById("temp").value) || null,
    chemicals
  };

  poolData.push(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(poolData));
  renderTable();
  updateChart();
  form.reset();
});

// ===== Render Table =====
function renderTable() {
  tableBody.innerHTML = "";
  poolData.forEach(entry => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${entry.date}</td>
      <td>${entry.notes}</td>
      <td>${entry.ph || ""}</td>
      <td>${entry.fc || ""}</td>
      <td>${entry.tc || ""}</td>
      <td>${entry.cc || ""}</td>
      <td>${entry.ta || ""}</td>
      <td>${entry.ch || ""}</td>
      <td>${entry.cya || ""}</td>
      <td>${entry.temp || ""}</td>
      <td>${entry.chemicals.map(c => `${c.name} ${c.amount}${c.unit}`).join(", ")}</td>
    `;
    tableBody.appendChild(row);
  });
}
renderTable();

// ===== Chart Setup =====
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: poolData.map(d => d.date),
    datasets: [
      { label: "pH", data: poolData.map(d => d.ph), borderColor: "red", fill: false, id: "ph" },
      { label: "FC", data: poolData.map(d => d.fc), borderColor: "blue", fill: false, id: "fc" },
      { label: "TC", data: poolData.map(d => d.tc), borderColor: "green", fill: false, id: "tc" },
      { label: "CC", data: poolData.map(d => d.cc), borderColor: "orange", fill: false, id: "cc" },
      { label: "TA", data: poolData.map(d => d.ta), borderColor: "purple", fill: false, id: "ta" },
      { label: "CH", data: poolData.map(d => d.ch), borderColor: "brown", fill: false, id: "ch" },
      { label: "CYA", data: poolData.map(d => d.cya), borderColor: "pink", fill: false, id: "cya" },
      { label: "Temp", data: poolData.map(d => d.temp), borderColor: "gray", fill: false, id: "temp" },
    ]
  },
  options: {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const idx = context.dataIndex;
            const entry = poolData[idx];
            let chemicals = "";
            if (entry.chemicals.length) {
              chemicals = "Chemicals: " + entry.chemicals.map(c => `${c.name} ${c.amount}${c.unit}`).join(", ");
            }
            return `${context.dataset.label}: ${context.raw} | Notes: ${entry.notes || ""} ${chemicals}`;
          }
        }
      }
    }
  }
});

// ===== Update Chart =====
function updateChart() {
  chart.data.labels = poolData.map(d => d.date);
  chart.data.datasets.forEach(ds => {
    ds.data = poolData.map(d => d[ds.id]);
  });
  chart.update();
}
updateChart();

// ===== Toggle Chart Lines =====
toggleCheckboxes.forEach(cb => {
  cb.addEventListener("change", e => {
    const ds = chart.data.datasets.find(d => d.id === cb.dataset.line);
    if (ds) ds.hidden = !cb.checked;
    chart.update();
  });
});

toggleAll.addEventListener("change", e => {
  const allChecked = toggleAll.checked;
  toggleCheckboxes.forEach(cb => cb.checked = allChecked);
  chart.data.datasets.forEach(ds => ds.hidden = !allChecked);
  chart.update();
});
