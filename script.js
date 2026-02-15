
let entries = JSON.parse(localStorage.getItem("entries")) || [];
let chart;

const metrics = ["fc","tc","cc","ph","ta","ch","cya","temp"];

function saveData() {
  localStorage.setItem("entries", JSON.stringify(entries));
}

function parseVal(id) {
  const val = document.getElementById(id).value;
  return val === "" ? null : parseFloat(val);
}

document.getElementById("entryForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const entry = {
    date: document.getElementById("date").value,
    fc: parseVal("fc"),
    tc: parseVal("tc"),
    cc: parseVal("cc"),
    ph: parseVal("ph"),
    ta: parseVal("ta"),
    ch: parseVal("ch"),
    cya: parseVal("cya"),
    temp: parseVal("temp"),
    notes: document.getElementById("notes").value
  };

  entries.push(entry);
  entries.sort((a,b)=> new Date(b.date)-new Date(a.date));

  saveData();
  this.reset();
  renderTable();
  renderChart();
});

function renderTable() {
  const tbody = document.querySelector("#entriesTable tbody");
  tbody.innerHTML = "";

  entries.forEach((e,i)=>{
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${e.date}</td>
      ${metrics.map(m=>`<td>${e[m] ?? ""}</td>`).join("")}
      <td>${e.notes || ""}</td>
      <td class="actions">
        <button onclick="copyEntry(${i})">Copy</button>
        <button onclick="deleteEntry(${i})">Del</button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

function renderChart() {
  const ctx = document.getElementById("chemChart");

  const labels = [...entries].reverse().map(e=>e.date);

  const datasets = metrics.map(m=>({
    label: m.toUpperCase(),
    data: [...entries].reverse().map(e=>e[m]),
    spanGaps: false,
    borderWidth: 2
  }));

  if (chart) chart.destroy();

  chart = new Chart(ctx,{
    type:"line",
    data:{ labels, datasets },
    options:{
      responsive:true,
      interaction:{ mode:"index", intersect:false },
      scales:{ y:{ beginAtZero:false }}
    }
  });

  renderControls();
  updateYAxis();
}

function renderControls() {
  const div = document.getElementById("chartControls");
  div.innerHTML = "";

  metrics.forEach((m,i)=>{
    const wrapper = document.createElement("label");
    wrapper.className = "chart-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.index = i;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(document.createTextNode(m.toUpperCase()));

    div.appendChild(wrapper);
  });

  div.addEventListener("change", function(e){
    if (e.target.dataset.index !== undefined) {
      const i = e.target.dataset.index;
      chart.data.datasets[i].hidden = !e.target.checked;
      chart.update();
      updateYAxis();
    }
  });
}

function updateYAxis() {
  const visible = [];

  chart.data.datasets.forEach(ds=>{
    if (!ds.hidden) {
      ds.data.forEach(v=>{
        if (v !== null) visible.push(v);
      });
    }
  });

  if (visible.length === 0) return;

  const min = Math.min(...visible);
  const max = Math.max(...visible);
  const pad = (max - min) * 0.1 || 1;

  chart.options.scales.y.min = min - pad;
  chart.options.scales.y.max = max + pad;

  chart.update();
}

function deleteEntry(i){
  if (!confirm("Delete this entry?")) return;

  entries.splice(i,1);
  saveData();
  renderTable();
  renderChart();
}

function copyEntry(i){
  const e = entries[i];

  const text = `
Date: ${e.date}
FC: ${e.fc}
TC: ${e.tc}
CC: ${e.cc}
pH: ${e.ph}
TA: ${e.ta}
CH: ${e.ch}
CYA: ${e.cya}
Temp: ${e.temp}
Notes: ${e.notes}
  `.trim();

  navigator.clipboard.writeText(text);
}

renderTable();
renderChart();
