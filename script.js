let poolData = JSON.parse(localStorage.getItem("poolData")) || [];
let editIndex = null;

const form = document.getElementById("poolForm");
const tableBody = document.querySelector("#dataTable tbody");
const chemicalContainer = document.getElementById("chemicalContainer");

function saveStorage() {
    localStorage.setItem("poolData", JSON.stringify(poolData));
}

function addChemicalRow(name="", amount="", unit="oz") {
    const div = document.createElement("div");
    div.className = "chemRow";
    div.innerHTML = `
        <input class="chemName" placeholder="Chemical name" value="${name}">
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

document.getElementById("addChemicalBtn")
.addEventListener("click", () => addChemicalRow());

function getVal(id){
    const v = document.getElementById(id).value;
    return v === "" ? null : parseFloat(v).toFixed(2);
}

form.addEventListener("submit", function(e){
    e.preventDefault();

    const chemicals=[];
    document.querySelectorAll(".chemRow").forEach(row=>{
        const name=row.querySelector(".chemName").value;
        const amount=row.querySelector(".chemAmount").value;
        const unit=row.querySelector(".chemUnit").value;
        if(name && amount){
            chemicals.push({name,amount:parseFloat(amount).toFixed(2),unit});
        }
    });

    const entry={
        date:document.getElementById("date").value,
        notes:document.getElementById("notes").value,
        ph:getVal("ph"),
        fc:getVal("fc"),
        tc:getVal("tc"),
        cc:getVal("cc"),
        ta:getVal("ta"),
        ch:getVal("ch"),
        cya:getVal("cya"),
        temp:getVal("temp"),
        chemicals
    };

    if(editIndex!==null){
        poolData[editIndex]=entry;
        editIndex=null;
    } else {
        poolData.push(entry);
    }

    saveStorage();
    form.reset();
    chemicalContainer.innerHTML="";
    render();
});

function render(){
    const sorted=[...poolData].sort((a,b)=>new Date(b.date)-new Date(a.date));
    tableBody.innerHTML="";

    sorted.forEach(entry=>{
        const realIndex=poolData.indexOf(entry);

        const row=document.createElement("tr");
        row.innerHTML=`
            <td>${entry.date}</td>
            <td>${entry.ph ?? ""}</td>
            <td>${entry.fc ?? ""}</td>
            <td>${entry.tc ?? ""}</td>
            <td>${entry.cc ?? ""}</td>
            <td>${entry.ta ?? ""}</td>
            <td>${entry.ch ?? ""}</td>
            <td>${entry.cya ?? ""}</td>
            <td>${entry.temp ?? ""}</td>
            <td>${entry.chemicals.map(c=>`${c.name} ${c.amount} ${c.unit}`).join(" | ")}</td>
            <td>${entry.notes}</td>
            <td class="actions">
                <button onclick="editEntry(${realIndex})">Edit</button>
                <button onclick="deleteEntry(${realIndex})">Del</button>
                <button onclick="copyEntry(${realIndex})">Copy</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateChart([...sorted].reverse());
}

function editEntry(index){
    const e=poolData[index];
    editIndex=index;

    for(let key in e){
        if(document.getElementById(key)){
            document.getElementById(key).value=e[key] ?? "";
        }
    }

    chemicalContainer.innerHTML="";
    e.chemicals.forEach(c=>addChemicalRow(c.name,c.amount,c.unit));
}

function deleteEntry(index){
    if(confirm("Delete this entry?")){
        poolData.splice(index,1);
        saveStorage();
        render();
    }
}

function copyEntry(index){
    const e=poolData[index];
    const text=`
Pool Test – ${e.date}

pH: ${e.ph ?? "Not tested"}
FC: ${e.fc ?? "Not tested"}
TC: ${e.tc ?? "Not tested"}
CC: ${e.cc ?? "Not tested"}
TA: ${e.ta ?? "Not tested"}
CH: ${e.ch ?? "Not tested"}
CYA: ${e.cya ?? "Not tested"}
Temp: ${e.temp ?? "Not tested"}

Chemicals Added:
${e.chemicals.map(c=>`- ${c.name} ${c.amount} ${c.unit}`).join("\n")}

Notes:
${e.notes}
`;
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard.");
}

/* -------- Chart -------- */

const ctx=document.getElementById("chart").getContext("2d");

let chart=new Chart(ctx,{
    type:"line",
    data:{labels:[],datasets:[]},
    options:{
        responsive:true,
        spanGaps:false
    }
});

function updateChart(data){
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

    const selected=Array.from(document.querySelectorAll("#toggles input:not(#toggleAll):checked"))
        .map(cb=>cb.value);

    chart.data.datasets=datasets.filter(d=>selected.includes(d.label.toLowerCase()));
    chart.update();
}

/* -------- Toggle Logic -------- */

const toggleAll=document.getElementById("toggleAll");
const otherToggles=document.querySelectorAll("#toggles input:not(#toggleAll)");

toggleAll.addEventListener("change",()=>{
    otherToggles.forEach(cb=>cb.checked=toggleAll.checked);
    render();
});

otherToggles.forEach(cb=>{
    cb.addEventListener("change",()=>{
        toggleAll.checked=[...otherToggles].every(c=>c.checked);
        render();
    });
});

/* -------- CSV -------- */

document.getElementById("exportBtn").addEventListener("click",()=>{
    if(!poolData.length)return alert("No data");

    const headers=["Date","pH","FC","TC","CC","TA","CH","CYA","Temp","Chemicals","Notes"];
    const rows=poolData.map(e=>[
        e.date,e.ph??"",e.fc??"",e.tc??"",e.cc??"",
        e.ta??"",e.ch??"",e.cya??"",e.temp??"",
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
