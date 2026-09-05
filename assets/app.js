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

/* =========================
   CEK CONFIG SUPABASE
========================= */

if (
  !window.SUPABASE_URL ||
  window.SUPABASE_URL.startsWith("PASTE_")
) {
  document.getElementById("emptyState").style.display = "block";
  document.getElementById("emptyText").textContent =
    "Konfigurasi Supabase belum diisi. Silakan ikuti README.";
  throw new Error("Supabase config belum diisi.");
}

const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


/* =========================
   TANGGAL WIB
========================= */

function todayWIB() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const get = type =>
    parts.find(p => p.type === type)?.value;

  return `${get("year")}-${get("month")}-${get("day")}`;
}


/* =========================
   UTILITAS TANGGAL
========================= */

function toISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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

  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}


/* =========================
   URL
========================= */

const params = new URLSearchParams(location.search);

const urlDate =
  /^\d{4}-\d{2}-\d{2}$/.test(
    params.get("date") || ""
  )
    ? params.get("date")
    : null;


/* =========================
   TANGGAL TERPILIH
========================= */

let selectedDate = urlDate || todayWIB();


/* =========================
   MINGGU YANG DITAMPILKAN
========================= */

/*
   Kalau tidak ada ?date=...
   otomatis gunakan minggu sekarang.

   Kalau ada ?date=...
   gunakan minggu dari tanggal tersebut.
*/

let weekStart = mondayOf(selectedDate);


/* =========================
   SET URL
========================= */

function setURL() {
  history.replaceState(
    null,
    "",
    `?date=${selectedDate}`
  );
}


/* =========================
   ESCAPE HTML
========================= */

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


/* =========================
   LOAD MENU MINGGU
========================= */

async function loadWeek() {

  const dates = [];

  for (let i = 0; i < 5; i++) {

    const d = new Date(weekStart);

    d.setDate(
      weekStart.getDate() + i
    );

    dates.push(toISO(d));
  }


  /* Ambil data yang tersedia dari Supabase */

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


  /* Buat tombol Senin-Jumat */

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
          <strong>${labels[d.getDay()]}</strong>
          <span>${d.getDate()}</span>
        </button>
      `;
    })
    .join("");


  /* Klik tanggal */

  document
    .querySelectorAll(".day-button")
    .forEach(button => {

      button.onclick = () => {

        selectedDate =
          button.dataset.date;

        setURL();

        loadMenu();

        /* Update tombol aktif */

        document
          .querySelectorAll(".day-button")
          .forEach(btn =>
            btn.classList.remove("active")
          );

        button.classList.add("active");
      };

    });
}


/* =========================
   LOAD MENU HARIAN
========================= */

async function loadMenu() {

  const d = parseISO(selectedDate);


  document.getElementById(
    "dayName"
  ).textContent =
    labels[d.getDay()];


  document.getElementById(
    "displayDate"
  ).textContent =
    fmtDate(selectedDate);


  document.getElementById(
    "photoCaption"
  ).textContent =
    `MENU ${labels[d.getDay()].toUpperCase()}`;


  const {
    data: m,
    error
  } = await sb
    .from("menus")
    .select("*")
    .eq("menu_date", selectedDate)
    .maybeSingle();


  if (error) {

    console.error(error);

    showEmpty(
      "Gagal mengambil data menu. Periksa konfigurasi Supabase dan RLS."
    );

    return;
  }


  /* Foto */

  const img =
    document.getElementById("menuPhoto");

  const ph =
    document.getElementById(
      "photoPlaceholder"
    );


  if (m?.photo_url) {

    img.src = m.photo_url;

    img.alt =
      `Foto menu ${fmtDate(selectedDate)}`;

    img.style.display = "block";

    ph.style.display = "none";

  } else {

    img.style.display = "none";

    ph.style.display = "block";
  }


  /* Belum ada menu */

  if (!m) {

    showEmpty(
      `Data menu untuk tanggal ${fmtDate(selectedDate)} belum dimasukkan oleh Admin.`
    );

    return;
  }


  /* Tampilkan menu */

  document.getElementById(
    "emptyState"
  ).style.display = "none";

  document.getElementById(
    "menuContent"
  ).style.display = "block";


  document.getElementById(
    "menuTitle"
  ).textContent =
    m.menu_title ||
    "Paket Makan Bergizi Gratis";


  document.getElementById(
    "menuDescription"
  ).textContent =
    m.menu_description || "";


  /* Isi ompreng */

  [
    "carbohydrate",
    "animal_protein",
    "plant_protein",
    "vegetable",
    "fruit"
  ].forEach(key => {

    const el =
      document.getElementById(key);

    if (el) {
      el.textContent =
        m[key] || "";
    }

  });


  /* Nutrisi */

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
    .map(row => `
      <tr>
        <td>${esc(row[0])}</td>
        <td>${esc(m[row[1]])}</td>
        <td>${esc(m[row[2]])}</td>
      </tr>
    `)
    .join("");
}


/* =========================
   EMPTY STATE
========================= */

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


/* =========================
   RENDER
========================= */

async function render() {

  await loadWeek();

  await loadMenu();
}


/* =========================
   MINGGU SEBELUMNYA
========================= */

document.getElementById(
  "prevWeek"
).onclick = () => {

  weekStart.setDate(
    weekStart.getDate() - 7
  );

  /* Pilih hari Senin */

  selectedDate =
    toISO(weekStart);

  setURL();

  render();
};


/* =========================
   MINGGU BERIKUTNYA
========================= */

document.getElementById(
  "nextWeek"
).onclick = () => {

  weekStart.setDate(
    weekStart.getDate() + 7
  );

  /* Pilih hari Senin */

  selectedDate =
    toISO(weekStart);

  setURL();

  render();
};


/* =========================
   MULAI
========================= */

render();
