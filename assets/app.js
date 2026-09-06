const labels = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu"
};

const months = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember"
];


// =========================================================
// CEK KONFIGURASI SUPABASE
// =========================================================

if (
  !window.SUPABASE_URL ||
  window.SUPABASE_URL.startsWith("PASTE_")
) {
  document.getElementById("emptyState").style.display = "block";

  document.getElementById("emptyText").textContent =
    "Konfigurasi Supabase belum diisi. Silakan ikuti README.";

  throw new Error("Supabase config belum diisi.");
}


// =========================================================
// SUPABASE
// =========================================================

const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// =========================================================
// TANGGAL TERPILIH
// =========================================================

const params = new URLSearchParams(location.search);

let selectedDate =
  /^\d{4}-\d{2}-\d{2}$/.test(params.get("date") || "")
    ? params.get("date")
    : toISO(new Date());


// =========================================================
// FUNGSI TANGGAL
// =========================================================

function toISO(d) {
  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}


function parseISO(s) {
  const [a, b, c] = s.split("-").map(Number);

  return new Date(a, b - 1, c);
}


function mondayOf(s) {
  const d = parseISO(s);
  const day = d.getDay();

  d.setDate(
    d.getDate() + (day === 0 ? -6 : 1 - day)
  );

  return d;
}


function fmtDate(s) {
  const d = parseISO(s);

  return `${d.getDate()} ${
    months[d.getMonth()]
  } ${d.getFullYear()}`;
}


function setURL() {
  history.replaceState(
    null,
    "",
    `?date=${selectedDate}`
  );
}


// =========================================================
// ESCAPE HTML
// =========================================================

function esc(v) {
  return String(v ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c])
  );
}


// =========================================================
// MENU MINGGU INI
// =========================================================

async function loadWeek() {
  const start = mondayOf(selectedDate);
  const dates = [];

  for (let i = 0; i < 5; i++) {
    const d = new Date(start);

    d.setDate(start.getDate() + i);

    dates.push(toISO(d));
  }

  const {
    data,
    error
  } = await sb
    .from("menus")
    .select("menu_date")
    .in("menu_date", dates);

  if (error) {
    console.error(error);
  }

  const have = new Set(
    (data || []).map(x => x.menu_date)
  );

  document.getElementById(
    "weeklyButtons"
  ).innerHTML = dates
    .map(iso => {
      const d = parseISO(iso);
      const active =
        iso === selectedDate
          ? " active"
          : "";

      return `
        <button
          class="day-button${active}"
          type="button"
          data-date="${iso}"
        >
          <strong>
            ${labels[d.getDay()]}
          </strong>

          <span>
            ${d.getDate()}
          </span>
        </button>
      `;
    })
    .join("");

  document
    .querySelectorAll(".day-button")
    .forEach(button => {
      button.onclick = () => {
        selectedDate =
          button.dataset.date;

        setURL();
        render();
      };
    });
}


// =========================================================
// LOAD MENU
// =========================================================

async function loadMenu() {
  const d = parseISO(selectedDate);

  // Hari
  document.getElementById(
    "dayName"
  ).textContent = labels[d.getDay()];

  // Tanggal
  document.getElementById(
    "displayDate"
  ).textContent = fmtDate(selectedDate);

  // Caption foto
  document.getElementById(
    "photoCaption"
  ).textContent =
    `MENU ${labels[
      d.getDay()
    ].toUpperCase()}`;


  // Ambil data menu
  const {
    data: menu,
    error
  } = await sb
    .from("menus")
    .select("*")
    .eq("menu_date", selectedDate)
    .maybeSingle();


  // Jika gagal mengambil data
  if (error) {
    showEmpty(
      "Gagal mengambil data menu. Periksa konfigurasi Supabase dan RLS."
    );

    return;
  }


  // =======================================================
  // FOTO MENU
  // =======================================================

  const img =
    document.getElementById("menuPhoto");

  const placeholder =
    document.getElementById(
      "photoPlaceholder"
    );


  if (menu?.photo_url) {
    img.src = menu.photo_url;

    img.alt =
      `Foto menu ${fmtDate(
        selectedDate
      )}`;

    img.style.display = "block";
    placeholder.style.display = "none";
  } else {
    img.style.display = "none";
    placeholder.style.display = "block";
  }


  // =======================================================
  // JIKA MENU BELUM ADA
  // =======================================================

  if (!menu) {
    showEmpty(
      `Data menu untuk tanggal ${fmtDate(
        selectedDate
      )} belum dimasukkan oleh Admin.`
    );

    return;
  }


  // =======================================================
  // TAMPILKAN MENU
  // =======================================================

  document.getElementById(
    "emptyState"
  ).style.display = "none";

  document.getElementById(
    "menuContent"
  ).style.display = "block";


  // Judul
  document.getElementById(
    "menuTitle"
  ).textContent =
    menu.menu_title ||
    "Paket Makan Bergizi Gratis";


  // Deskripsi
  document.getElementById(
    "menuDescription"
  ).textContent =
    menu.menu_description || "";


  // =======================================================
  // ISI OMPRENG
  // =======================================================

  const foodItems = [
    "carbohydrate",
    "animal_protein",
    "plant_protein",
    "vegetable",
    "fruit"
  ];

  foodItems.forEach(key => {
    const element =
      document.getElementById(key);

    if (element) {
      element.textContent =
        menu[key] || "";
    }
  });


  // =======================================================
  // GIZI PER PORSI
  // =======================================================

  const rows = [
    [
      "Energi",
      "energy_small",
      "energy_large"
    ],
    [
      "Protein",
      "protein_small",
      "protein_large"
    ],
    [
      "Lemak",
      "fat_small",
      "fat_large"
    ],
    [
      "Karbohidrat",
      "carb_small",
      "carb_large"
    ],
    [
      "Serat",
      "fiber_small",
      "fiber_large"
    ]
  ];


  document.getElementById(
    "nutritionRows"
  ).innerHTML = rows
    .map(row => {
      return `
        <tr>
          <td>
            ${esc(row[0])}
          </td>

          <td>
            ${esc(menu[row[1]])}
          </td>

          <td>
            ${esc(menu[row[2]])}
          </td>
        </tr>
      `;
    })
    .join("");
}


// =========================================================
// MENU BELUM TERSEDIA
// =========================================================

function showEmpty(text) {
  document.getElementById(
    "menuContent"
  ).style.display = "none";

  document.getElementById(
    "emptyState"
  ).style.display = "block";

  document.getElementById(
    "emptyText"
  ).textContent = text;
}


// =========================================================
// RENDER
// =========================================================

async function render() {
  await loadWeek();
  await loadMenu();
}


// =========================================================
// TOMBOL MINGGU SEBELUMNYA
// =========================================================

document.getElementById(
  "prevWeek"
).onclick = () => {
  const d = mondayOf(selectedDate);

  d.setDate(
    d.getDate() - 7
  );

  selectedDate = toISO(d);

  setURL();
  render();
};


// =========================================================
// TOMBOL MINGGU BERIKUTNYA
// =========================================================

document.getElementById(
  "nextWeek"
).onclick = () => {
  const d = mondayOf(selectedDate);

  d.setDate(
    d.getDate() + 7
  );

  selectedDate = toISO(d);

  setURL();
  render();
};


// =========================================================
// JALANKAN
// =========================================================

render();
