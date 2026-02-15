let entries = JSON.parse(localStorage.getItem("poolEntries")) || [];
let chemicalsList = JSON.parse(localStorage.getItem("chemList")) || [];

const fields = ["ph","fc","tc","cc","ta","ch","cya","temp"];
let chart;

function saveStorage() {
  localStorage.setItem("poolEntries", JSON.stringify(entries));
  localStorage.setItem("chemList", JSON.stringify(chemicalsList));
}

function getValue(id) {
  const v = document.getElementById(id).value;
  return v === "" ? null : parseFloat(v);
}

function addChemicalRow(name="", amount="", unit="oz") {
  const container = document.getElementById("chemicalsContainer");

  const row = document.createElement("div");

  const chemSelect = document.createElement("select");
  chemSelect.innerHTML =
    `<option value="">Select Chemical</option>` +
    chemicalsList.map(c => `<option ${c===name?"selected":""}>${c}</option>`).join("") +
    `<option value="__new__">+ Add New</option>`;

  chemSelect.onchange = function() {
    if (this.value === "__new__") {
      const newChem = prompt("Enter new chemical name:");
      if (newChem && !chemicalsList.includes(newChem)) {
        chemicalsList.push(newChem);
        saveStorage();
        renderChemicalDropdowns();
      }
    }
  };

  const amt = document.createElement("input");
  amt.type = "number";
  amt.step = "0.01";
  amt.placeholder = "Amount";
  amt.value = amount;

  const unitSelect = document.createElement("select");
  ["oz","lb","gal","ml","g"].forEach(u=>{
    const opt = document.createElement("option");
    opt.value = u;
    opt.text = u;
    if (u === unit) opt.selected = true;
    unitSelect.appendChild(opt);
  });

  row.appendChild(chemSelect);
  row.appendChild(amt);
  row.appendChild(unitSelect);

  container.appendChild(row);
}

function renderChemicalDropdowns() {
  document.getElementById("chemicalsContainer").innerHTML = "";
  addChemicalRow();
}

document.getElementById("entryForm").onsubmit = function(e){
  e.preventDefault();

  const entry = {
    date: date.value,
    notes: notes.value,
    chemicals: []
  };

  fields.forEach(f => entry[f] = getValue(f));

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
};

function renderTable(){
  const tbody = document.querySelector("#entriesTable tbody");
  tbody.innerHTML = "";

  entries.forEach((e,i)=>{
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${e.date}</td>
      ${fields.map(f=>`<td>${e[f] ?? ""}</td>`).join("")}
      <td class="actions">
        <button onclick="deleteEntry(${i})">Del</button>
        <button onclick="copyEntry(${i})">Copy</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function deleteEntry(i){
  entries.splice(i,1);
  saveStorage();
  render();
}

function copyEntry(i){
  const e = entries[i];
  let text = `Pool Test - ${e.date}\n\n`;
  fields.forEach(f=>{
    if(e[f] !== null) text += `${f.toUpperCase()}: ${e[f]}\n`;
  });

  if(e.chemicals.length){
    text += "\nChemicals Added:\n";
    e.chemicals.forEach(c=>{
      text += `${c.name} - ${c.amount} ${c.unit}\n`;
    });
  }

  text += `\nNotes:\n${e.notes}`;

  navigator.clipboard.writeText(text);
  alert("Copied");
}

function renderChart(){
  const ctx = document.getElementById("chart");

  if(chart) chart.destroy();

  const labels = entries.slice().reverse().map(e=>e.date);

  const datasets = fields.map(f=>({
    label: f.toUpperCase(),
    data: entries.slice().reverse().map(e=>e[f]),
    spanGaps:false
  }));

  chart = new Chart(ctx,{
    type:"line",
    data:{ labels, datasets },
    options:{
      responsive:true,
      interaction:{ mode:"nearest", intersect:true },
      onClick:(evt, elements)=>{
        if(elements.length){
          const index = elements[0].index;
          const entry = entries.slice().reverse()[index];
          alert(JSON.stringify(entry,null,2));
        }
      }
    }
  });

  renderControls();
}

function renderControls(){
  const div = document.getElementById("chartControls");
  div.innerHTML = "";

  const all = document.createElement("input");
  all.type = "checkbox";
  all.checked = true;

  all.onchange = ()=>{
    chart.data.datasets.forEach(ds=> ds.hidden = !all.checked);
    chart.update();
    document.querySelectorAll(".datasetBox")
      .forEach(cb=> cb.checked = all.checked);
  };

  div.append("All ");
  div.appendChild(all);

  chart.data.datasets.forEach((ds,i)=>{
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = true;
    cb.className = "datasetBox";

    cb.onchange = ()=>{
      ds.hidden = !cb.checked;
      chart.update();
    };

    div.append(` ${ds.label} `);
    div.appendChild(cb);
  });
}

function exportCSV(){
  let csv = "Date,"+fields.join(",")+"\n";
  entries.forEach(e=>{
    csv += e.date + "," +
      fields.map(f=> e[f] ?? "").join(",") +
      "\n";
  });

  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pool_data.csv";
  a.click();
}

document.getElementById("exportBtn").onclick = exportCSV;

function render(){
  renderTable();
  renderChart();
}

renderChemicalDropdowns();
render();
