
const fields = ["ph","fc","tc","cc","ta","ch","cya","temp"];

let entries = JSON.parse(localStorage.getItem("poolEntries")) || [];
let chemicalsList = JSON.parse(localStorage.getItem("chemList")) || [];

let chart = null;
let editIndex = null;

/* ---------- STORAGE ---------- */

function saveStorage() {
  localStorage.setItem("poolEntries", JSON.stringify(entries));
  localStorage.setItem("chemList", JSON.stringify(chemicalsList));
}

function getValue(id) {
  const v = document.getElementById(id).value;
  return v === "" ? null : parseFloat(v);
}

/* ---------- CHEMICALS ---------- */

document.getElementById("addChemicalBtn").addEventListener("click", ()=>addChemicalRow());

function addChemicalRow(name="", amount="", unit="oz") {
  const container = document.getElementById("chemicalsContainer");

  const row = document.createElement("div");
  row.style.display = "flex";
  row.style.gap = "5px";

  const chemSelect = document.createElement("select");

  const base = document.createElement("option");
  base.value = "";
  base.textContent = "Chemical";
  chemSelect.appendChild(base);

  chemicalsList.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    if(c===name) opt.selected=true;
    chemSelect.appendChild(opt);
  });

  const addNew = document.createElement("option");
  addNew.value="__new__";
  addNew.textContent="+ Add New";
  chemSelect.appendChild(addNew);

  chemSelect.addEventListener("change", function(){
    if(this.value==="__new__"){
      const newChem = prompt("New chemical:");
      if(newChem && !chemicalsList.includes(newChem)){
        chemicalsList.push(newChem);
        saveStorage();
        renderChemicalDropdowns();
      }
    }
  });

  const amt = document.createElement("input");
  amt.type="number";
  amt.step="0.01";
  amt.placeholder="Amt";
  amt.value=amount;

  const unitSelect=document.createElement("select");
  ["oz","lb","gal","ml","g"].forEach(u=>{
    const opt=document.createElement("option");
    opt.value=u;
    opt.textContent=u;
    if(u===unit) opt.selected=true;
    unitSelect.appendChild(opt);
  });

  row.appendChild(chemSelect);
  row.appendChild(amt);
  row.appendChild(unitSelect);

  container.appendChild(row);
}

function renderChemicalDropdowns(){
  document.getElementById("chemicalsContainer").innerHTML="";
  addChemicalRow();
}

/* ---------- FORM SUBMIT ---------- */

document.getElementById("entryForm").addEventListener("submit", function(e){
  e.preventDefault();

  const entry = {
    date: date.value,
    notes: notes.value,
    chemicals:[]
  };

  fields.forEach(f=>entry[f]=getValue(f));

  document.querySelectorAll("#chemicalsContainer div").forEach(row=>{
    const selects=row.querySelectorAll("select");
    const inputs=row.querySelectorAll("input");

    if(selects[0].value && inputs[0].value){
      entry.chemicals.push({
        name:selects[0].value,
        amount:parseFloat(inputs[0].value),
        unit:selects[1].value
      });
    }
  });

  if(editIndex!==null){
    entries[editIndex]=entry;
    editIndex=null;
  } else {
    entries.push(entry);
  }

  entries.sort((a,b)=>new Date(b.date)-new Date(a.date));

  saveStorage();
  render();

  this.reset();
  renderChemicalDropdowns();
});

/* ---------- TABLE ---------- */

function renderTable(){
  const tbody=document.querySelector("#entriesTable tbody");
  tbody.innerHTML="";

  entries.forEach((e,i)=>{
    const tr=document.createElement("tr");

    const chemText=e.chemicals.map(c=>`${c.name} ${c.amount}${c.unit}`).join(", ");

    tr.innerHTML=`
      <td>${e.date}</td>
      ${fields.map(f=>`<td>${e[f] ?? ""}</td>`).join("")}
      <td class="notes-cell">${e.notes}</td>
      <td class="chem-cell">${chemText}</td>
      <td class="actions">
        <button onclick="editEntry(${i})">Edit</button>
        <button onclick="copyEntry(${i})">Copy</button>
        <button onclick="deleteEntry(${i})">Del</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function editEntry(i){
  const e=entries[i];
  editIndex=i;

  date.value=e.date;
  notes.value=e.notes;

  fields.forEach(f=>{
    document.getElementById(f).value=e[f] ?? "";
  });

  document.getElementById("chemicalsContainer").innerHTML="";
  e.chemicals.forEach(c=>{
    addChemicalRow(c.name,c.amount,c.unit);
  });
}

function deleteEntry(i){
  entries.splice(i,1);
  saveStorage();
  render();
}

function copyEntry(i){
  const e=entries[i];
  let text=`Pool Test ${e.date}\n\n`;
  fields.forEach(f=>{
    if(e[f]!==null) text+=`${f.toUpperCase()}: ${e[f]}\n`;
  });

  if(e.chemicals.length){
    text+="\nChemicals Added:\n";
    e.chemicals.forEach(c=>{
      text+=`${c.name} - ${c.amount} ${c.unit}\n`;
    });
  }

  text+=`\nNotes:\n${e.notes}`;

  navigator.clipboard.writeText(text);
  alert("Copied");
}

/* ---------- CHART ---------- */

function renderChart(){
  const ctx=document.getElementById("chart");

  if(chart) chart.destroy();

  const labels=entries.slice().reverse().map(e=>e.date);

  const datasets=fields.map(f=>({
    label:f.toUpperCase(),
    data:entries.slice().reverse().map(e=>e[f]),
    spanGaps:false
  }));

  chart=new Chart(ctx,{
    type:"line",
    data:{labels,datasets},
    options:{responsive:true}
  });

  renderControls();
}

function renderControls(){
  const div=document.getElementById("chartControls");
  div.innerHTML="";

  const allBox=document.createElement("input");
  allBox.type="checkbox";
  allBox.checked=true;

  const allLabel=document.createElement("label");
  allLabel.appendChild(allBox);
  allLabel.append("All");

  allBox.addEventListener("change",()=>{
    chart.data.datasets.forEach(ds=>ds.hidden=!allBox.checked);
    chart.update();
    document.querySelectorAll(".datasetBox")
      .forEach(cb=>cb.checked=allBox.checked);
  });

  div.appendChild(allLabel);

  chart.data.datasets.forEach((ds,i)=>{
    const cb=document.createElement("input");
    cb.type="checkbox";
    cb.checked=true;
    cb.className="datasetBox";

    cb.addEventListener("change",()=>{
      ds.hidden=!cb.checked;
      chart.update();
    });

    const label=document.createElement("label");
    label.appendChild(cb);
    label.append(ds.label);

    div.appendChild(label);
  });
}

/* ---------- EXPORT ---------- */

document.getElementById("exportBtn").addEventListener("click",()=>{
  let csv="Date,"+fields.join(",")+",Notes,Chemicals\n";

  entries.forEach(e=>{
    const chemText=e.chemicals.map(c=>`${c.name} ${c.amount}${c.unit}`).join(" | ");
    csv+=`${e.date},${fields.map(f=>e[f] ?? "").join(",")},"${e.notes}","${chemText}"\n`;
  });

  const blob=new Blob([csv],{type:"text/csv"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;
  a.download="pool_data.csv";
  a.click();
});

/* ---------- INIT ---------- */

function render(){
  renderTable();
  renderChart();
}

renderChemicalDropdowns();
render();
