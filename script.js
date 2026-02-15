let entries = JSON.parse(localStorage.getItem("entries")) || [];
let chemicalTypes = JSON.parse(localStorage.getItem("chemicalTypes")) || [];
let editingIndex = null;
let chart;

const metrics = ["fc","tc","cc","ph","ta","ch","cya","salt","temp"];

function saveData() {
  localStorage.setItem("entries", JSON.stringify(entries));
  localStorage.setItem("chemicalTypes", JSON.stringify(chemicalTypes));
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
    salt: parseVal("salt"),
    temp: parseVal("temp"),
    notes: document.getElementById("notes").value,
    chemicals: getChemicalRows()
  };

  if (editingIndex !== null) {
    entries[editingIndex] = entry;
    editingIndex = null;
  } else {
    entries.push(entry);
  }

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
      <td>${formatChemicals(e.chemicals)}</td>
      <td class="actions">
        <button onclick="editEntry(${i})">Edit</button>
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
    borderWidth: 2,
    spanGaps: false
  }));

  if (chart) chart.destroy();

  chart = new Chart(ctx,{
    type:"line",
    data:{ labels, datasets },
    options:{
      responsive:true,
      interaction:{ mode:"index", intersect:false },
      scales:{ y:{ beginAtZero:false }},
      plugins:{
        tooltip:{
          callbacks:{
            label: function(context){
              const index = context.dataIndex;
              const entry = [...entries].reverse()[index];
              return metrics
                .filter(k=>entry[k]!==null)
                .map(k=>`${k.toUpperCase()}: ${entry[k]}`)
                .join(" | ");
            }
          }
        }
      }
    }
  });

  renderControls();
  updateYAxis();
}

function renderControls() {
  const div = document.getElementById("chartControls");
  div.innerHTML = "";

  // ALL toggle
  const allWrapper = document.createElement("div");
  allWrapper.className = "chart-control-item";

  const allCheckbox = document.createElement("input");
  allCheckbox.type = "checkbox";
  allCheckbox.checked = true;
  allCheckbox.id = "allToggle";

  const allLabel = document.createElement("span");
  allLabel.textContent = "All";

  allWrapper.appendChild(allCheckbox);
  allWrapper.appendChild(allLabel);
  div.appendChild(allWrapper);

  // Metric toggles
  metrics.forEach((m,i)=>{
    const wrapper = document.createElement("div");
    wrapper.className = "chart-control-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.index = i;

    const label = document.createElement("span");
    label.textContent = m.toUpperCase();

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    div.appendChild(wrapper);
  });

  div.addEventListener("change", function(e){

    if (e.target.id === "allToggle") {
      const checked = e.target.checked;

      div.querySelectorAll("input[type=checkbox]").forEach(cb=>{
        cb.checked = checked;
      });

      chart.data.datasets.forEach(ds=> ds.hidden = !checked);
      chart.update();
      updateYAxis();
      return;
    }

    if (e.target.dataset.index !== undefined) {
      const i = e.target.dataset.index;
      chart.data.datasets[i].hidden = !e.target.checked;
      chart.update();
      updateYAxis();

      const allChecked = [...div.querySelectorAll("input[data-index]")]
        .every(cb=>cb.checked);

      document.getElementById("allToggle").checked = allChecked;
    }
  });
}

function updateYAxis() {
  const visibleData = [];

  chart.data.datasets.forEach(ds=>{
    if (!ds.hidden) {
      ds.data.forEach(v=>{
        if (v!==null) visibleData.push(v);
      });
    }
  });

  if (visibleData.length === 0) return;

  const min = Math.min(...visibleData);
  const max = Math.max(...visibleData);

  const padding = (max - min) * 0.1 || 1;

  chart.options.scales.y.min = min - padding;
  chart.options.scales.y.max = max + padding;

  chart.update();
}

function deleteEntry(i){
  if (!confirm("Are you sure you want to delete this entry?")) return;

  entries.splice(i,1);
  saveData();
  renderTable();
  renderChart();
}

function editEntry(i){
  const e = entries[i];
  editingIndex = i;

  Object.keys(e).forEach(k=>{
    if (document.getElementById(k)) {
      document.getElementById(k).value = e[k] ?? "";
    }
  });
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
Salt: ${e.salt}
Temp: ${e.temp}
Notes: ${e.notes}
Chemicals: ${formatChemicals(e.chemicals)}
  `.trim();

  navigator.clipboard.writeText(text);
}

function addChemicalType(){
  const name = document.getElementById("newChemical").value.trim();
  if (!name) return;

  chemicalTypes.push(name);
  document.getElementById("newChemical").value="";
  saveData();
}

function addChemicalRow(){
  const div = document.createElement("div");
  div.className="chem-row";

  div.innerHTML=`
    <select>${chemicalTypes.map(c=>`<option>${c}</option>`).join("")}</select>
    <input type="number" step="0.01" placeholder="Amount">
    <button type="button" onclick="this.parentElement.remove()">X</button>
  `;

  document.getElementById("chemicals").appendChild(div);
}

function getChemicalRows(){
  return [...document.querySelectorAll("#chemicals .chem-row")].map(r=>({
    name:r.querySelector("select").value,
    amount:r.querySelector("input").value
  }));
}

function formatChemicals(list){
  if (!list || list.length===0) return "";
  return list.map(c=>`${c.name} ${c.amount}`).join(", ");
}

function exportCSV(){
  let csv="Date,"+metrics.join(",")+",Notes,Chemicals\n";

  entries.forEach(e=>{
    csv+=`${e.date},${metrics.map(m=>e[m]??"").join(",")},${e.notes || ""},"${formatChemicals(e.chemicals)}"\n`;
  });

  const blob = new Blob([csv],{type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="pool_data.csv";
  a.click();
}

renderTable();
renderChart();
