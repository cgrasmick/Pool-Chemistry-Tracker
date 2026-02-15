let poolData = JSON.parse(localStorage.getItem("poolData")) || [];

const form = document.getElementById("poolForm");
const chemicalContainer = document.getElementById("chemicalContainer");
const tableBody = document.querySelector("#dataTable tbody");

document.getElementById("addChemicalBtn").addEventListener("click", () => {
    const div = document.createElement("div");
    div.className = "chemRow";
    div.innerHTML = `
        <input type="text" placeholder="Chemical name" class="chemName">
        <input type="number" step="0.01" placeholder="Amount" class="chemAmount">
        <select class="chemUnit">
            <option>oz</option>
            <option>lb</option>
            <option>gal</option>
            <option>qt</option>
            <option>tabs</option>
        </select>
    `;
    chemicalContainer.appendChild(div);
});

form.addEventListener("submit", function(e) {
    e.preventDefault();

    const chemicals = [];
    document.querySelectorAll(".chemRow").forEach(row => {
        const name = row.querySelector(".chemName").value;
        const amount = parseFloat(row.querySelector(".chemAmount").value);
        const unit = row.querySelector(".chemUnit").value;

        if (name && !isNaN(amount)) {
            chemicals.push({ name, amount: amount.toFixed(2), unit });
        }
    });

    const entry = {
        date: document.getElementById("date").value,
        notes: document.getElementById("notes").value,
        ph: parseFloat(document.getElementById("ph").value || 0).toFixed(2),
        fc: parseFloat(document.getElementById("fc").value || 0).toFixed(2),
        ta: parseFloat(document.getElementById("ta").value || 0).toFixed(2),
        ch: parseFloat(document.getElementById("ch").value || 0).toFixed(2),
        cya: parseFloat(document.getElementById("cya").value || 0).toFixed(2),
        temp: parseFloat(document.getElementById("temp").value || 0).toFixed(2),
        chemicals: chemicals
    };

    poolData.push(entry);
    localStorage.setItem("poolData", JSON.stringify(poolData));
    form.reset();
    chemicalContainer.innerHTML = "";
    render();
});

function render() {
    const sorted = [...poolData].sort((a, b) => new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = "";
    sorted.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.ph}</td>
            <td>${entry.fc}</td>
            <td>${entry.ta}</td>
            <td>${entry.ch}</td>
            <td>${entry.cya}</td>
            <td>${entry.temp}</td>
            <td>${entry.chemicals.map(c => `${c.name} ${c.amount} ${c.unit}`).join(" | ")}</td>
            <td>${entry.notes}</td>
        `;
        tableBody.appendChild(row);
    });

    updateChart(sorted.reverse());
}

const ctx = document.getElementById("chart").getContext("2d");

let chart = new Chart(ctx, {
    type: "line",
    data: { labels: [], datasets: [] },
    options: {
        responsive: true,
        plugins: {
            tooltip: {
                callbacks: {
                    afterBody: function(context) {
                        const index = context[0].dataIndex;
                        const entry = chart.fullData[index];
                        return [
                            "Notes: " + entry.notes,
                            "Chemicals: " + entry.chemicals.map(c => `${c.name} ${c.amount} ${c.unit}`).join(" | ")
                        ];
                    }
                }
            }
        }
    }
});

function updateChart(data) {
    chart.fullData = data;

    const labels = data.map(e => e.date);

    const datasets = [
        { label: "pH", data: data.map(e => e.ph), borderColor: "blue" },
        { label: "Free Chlorine", data: data.map(e => e.fc), borderColor: "green" },
        { label: "TA", data: data.map(e => e.ta), borderColor: "orange" },
        { label: "CH", data: data.map(e => e.ch), borderColor: "purple" },
        { label: "CYA", data: data.map(e => e.cya), borderColor: "red" }
    ];

    const selected = Array.from(document.querySelectorAll("#toggles input:checked"))
        .map(cb => cb.value);

    if (!selected.includes("all")) {
        chart.data.datasets = datasets.filter(d =>
            selected.includes(d.label.toLowerCase()) ||
            selected.includes(d.label.replace(" ", "").toLowerCase())
        );
    } else {
        chart.data.datasets = datasets;
    }

    chart.data.labels = labels;
    chart.update();
}

document.querySelectorAll("#toggles input").forEach(cb => {
    cb.addEventListener("change", render);
});

document.getElementById("exportBtn").addEventListener("click", function () {
    if (!poolData.length) {
        alert("No data to export.");
        return;
    }

    const headers = ["Date","pH","FC","TA","CH","CYA","Temp","Chemicals","Notes"];

    const rows = poolData.map(entry => [
        entry.date,
        entry.ph,
        entry.fc,
        entry.ta,
        entry.ch,
        entry.cya,
        entry.temp,
        entry.chemicals.map(c => `${c.name} ${c.amount} ${c.unit}`).join(" | "),
        entry.notes
    ]);

    const csvContent = [headers, ...rows].map(r => r.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "pool-data.csv";
    a.click();
});

render();
