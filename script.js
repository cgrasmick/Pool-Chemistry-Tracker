let poolData = JSON.parse(localStorage.getItem("poolData")) || [];
let editIndex = null;

const form = document.getElementById("poolForm");
const tableBody = document.querySelector("#dataTable tbody");
const chemicalContainer = document.getElementById("chemicalContainer");

function saveStorage() {
    localStorage.setItem("poolData", JSON.stringify(poolData));
}

function getChemicalList() {
    const names = new Set();
    poolData.forEach(entry => {
        entry.chemicals.forEach(c => names.add(c.name));
    });
    return Array.from(names);
}

function addChemicalRow(name="", amount="", unit="oz") {
    const div = document.createElement("div");
    div.className = "chemRow";

    const chemList = getChemicalList();
    const options = chemList.map(c => `<option value="${c}">${c}</option>`).join("");

    div.innerHTML = `
        <input list="chemList" class="chemName" placeholder="Chemical name" value="${name}">
        <datalist id="chemList">${options}</datalist>
        <input type="number" step="0.01" class="chemAmount" placeholder="Amount" value="${amount}">
        <select class="chemUnit">
            <option ${unit==="oz"?"selected":""}>oz</option>
            <option ${unit==="lb"?"selected":""}>lb</option>
            <option ${unit==="gal"?"selected":""}>gal</option>
            <option ${unit==="qt"?"selected":""}>qt</option>
            <option ${unit==="tabs"?"selected":""}>tabs</option>
        </select>
    `;

    chemicalContainer.appendChild(div);
}

document.getElementById("addChemicalBtn").addEventListener("click", () => addChemicalRow());

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const chemicals = [];
    document.querySelectorAll(".chemRow").forEach(row => {
        const name = row.querySelector(".chemName").value;
        const amount = row.querySelector(".chemAmount").value;
        const unit = row.querySelector(".chemUnit").value;
        if (name && amount) {
            chemicals.push({
                name,
                amount: parseFloat(amount).toFixed(2),
                unit
            });
        }
    });

    const entry = {
        date: document.getElementById("date").value,
        notes: document.getElementById("notes").value,
        ph: parseFloat(document.getElementById("ph").value || 0).toFixed(2),
        fc: parseFloat(document.getElementById("fc").value || 0).toFixed(2),
        tc: parseFloat(document.getElementById("tc").value || 0).toFixed(2),
        cc: parseFloat(document.getElementById("cc").value || 0).toFixed(2),
        ta: parseFloat(document.getElementById("ta").value || 0).toFixed(2),
        ch: parseFloat(document.getElementById("ch").value || 0).toFixed(2),
        cya: parseFloat(document.getElementById("cya").value || 0).toFixed(2),
        temp: parseFloat(document.getElementById("temp").value || 0).toFixed(2),
        chemicals
    };

    if (editIndex !== null) {
        poolData[editIndex] = entry;
        editIndex = null;
    } else {
        poolData.push(entry);
    }

    saveStorage();
    form.reset();
    chemicalContainer.innerHTML = "";
    render();
});

function render() {
    const sorted = [...poolData].sort((a,b)=> new Date(b.date)-new Date(a.date));
    tableBody.innerHTML = "";

    sorted.forEach((entry, index) => {
        const realIndex = poolData.indexOf(entry);

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.ph}</td>
            <td>${entry.fc}</td>
            <td>${entry.tc}</td>
            <td>${entry.cc}</td>
            <td>${entry.ta}</td>
            <td>${entry.ch}</td>
            <td>${entry.cya}</td>
            <td>${entry.temp}</td>
            <td>${entry.chemicals.map(c=>`${c.name} ${c.amount} ${c.unit}`).join(" | ")}</td>
            <td>${entry.notes}</td>
            <td>
                <button onclick="editEntry(${realIndex})">Edit</button>
                <button onclick="deleteEntry(${realIndex})">Del</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateChart([...sorted].reverse());
}

function editEntry(index) {
    const e = poolData[index];
    editIndex = index;

    document.getElementById("date").value = e.date;
    document.getElementById("notes").value = e.notes;
    document.getElementById("ph").value = e.ph;
    document.getElementById("fc").value = e.fc;
    document.getElementById("tc").value = e.tc;
    document.getElementById("cc").value = e.cc;
    document.getElementById("ta").value = e.ta;
    document.getElementById("ch").value = e.ch;
    document.getElementById("cya").value = e.cya;
    document.getElementById("temp").value = e.temp;

    chemicalContainer.innerHTML = "";
    e.chemicals.forEach(c => addChemicalRow(c.name, c.amount, c.unit));
}

function deleteEntry(index) {
    if (confirm("Delete this entry?")) {
        poolData.splice(index,1);
        saveStorage();
        render();
    }
}

const ctx = document.getElementById("chart").getContext("2d");

let chart = new Chart(ctx,{
    type:"line",
    data:{labels:[],datasets:[]},
    options:{
        responsive:true,
        plugins:{
            tooltip:{
                callbacks:{
                    afterBody:function(context){
                        const index=context[0].dataIndex;
                        const entry=chart.fullData[index];
                        return [
                            "TC: "+entry.tc,
                            "CC: "+entry.cc,
                            "TA: "+entry.ta,
                            "CH: "+entry.ch,
                            "CYA: "+entry.cya,
                            "Temp: "+entry.temp,
                            "Chemicals: "+entry.chemicals.map(c=>`${c.name} ${c.amount} ${c.unit}`).join(" | "),
                            "Notes: "+entry.notes
                        ];
                    }
                }
            }
        }
    }
});

function updateChart(data){
    chart.fullData=data;
    chart.data.labels=data.map(e=>e.date);

    const datasets=[
        {label:"pH",data:data.map(e=>e.ph),borderColor:"blue"},
        {label:"FC",data:data.map(e=>e.fc),borderColor:"green"},
        {label:"TC",data:data.map(e=>e.tc),borderColor:"orange"},
        {label:"CC",data:data.map(e=>e.cc),borderColor:"red"},
        {label:"TA",data:data.map(e=>e.ta),borderColor:"purple"},
        {label:"CH",data:data.map(e=>e.ch),borderColor:"brown"},
        {label:"CYA",data:data.map(e=>e.cya),borderColor:"black"}
    ];

    const selected=Array.from(document.querySelectorAll("#toggles input:checked")).map(cb=>cb.value);

    chart.data.datasets=selected.includes("all")?datasets:datasets.filter(d=>selected.includes(d.label.toLowerCase()));

    chart.update();
}

document.querySelectorAll("#toggles input").forEach(cb=>cb.addEventListener("change",render));

document.getElementById("exportBtn").addEventListener("click",()=>{
    if(!poolData.length)return alert("No data");

    const headers=["Date","pH","FC","TC","CC","TA","CH","CYA","Temp","Chemicals","Notes"];
    const rows=poolData.map(e=>[
        e.date,e.ph,e.fc,e.tc,e.cc,e.ta,e.ch,e.cya,e.temp,
        e.chemicals.map(c=>`${c.name} ${c.amount} ${c.unit}`).join(" | "),
        e.notes
    ]);

    const csv=[headers,...rows].map(r=>r.join(",")).join("\n");

    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download="pool-data.csv";
    a.click();
});

render();
