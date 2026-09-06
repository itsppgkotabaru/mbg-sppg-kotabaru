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
// KONVERSI TANGGAL
// =========================================================

function toISO(d) {
  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}


// =========================================================
// TANGGAL HARI INI WIB
// =========================================================

function todayWIB() {
  const now = new Date();

  const wib = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta"
    })
  );

  return toISO(wib);
}


// =========================================================
// TANGGAL TERPILIH
// =========================================================

let selectedDate = todayWIB();
let lastRealToday = selectedDate;


// =========================================================
// PARSE ISO
// =========================================================

function parseISO(s) {
  const [a, b, c] = s.split("-").map(Number);

  return new Date(
    a,
    b - 1,
    c
  );
}


// =========================================================
// SENIN MINGGU INI
// =========================================================

function mondayOf(s) {
  const d = parseISO(s);
  const day = d.getDay();

  d.setDate(
    d.getDate() +
    (
      day === 0
        ? -6
        : 1 - day
    )
  );

  return d;
}


// =========================================================
// FORMAT TANGGAL INDONESIA
// =========================================================

function fmtDate(s) {
  const d = parseISO(s);

  return `${d.getDate()} ${
    months[d.getMonth()]
  } ${d.getFullYear()}`;
}


// =========================================================
// UPDATE URL
// =========================================================

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
// TAMPILKAN HARI & TANGGAL
// DIBUAT TERLEBIH DAHULU
// =========================================================

function updateDayDate() {

  const d =
    parseISO(selectedDate);

  const dayName =
    document.getElementById(
      "dayName"
    );

  const displayDate =
    document.getElementById(
      "displayDate"
    );

  if (dayName) {
    dayName.textContent =
      labels[d.getDay()];
  }

  if (displayDate) {
    displayDate.textContent =
      fmtDate(selectedDate);
  }

}


// =========================================================
// RENDER MENU MINGGU INI
// TIDAK MENUNGGU SUPABASE
// =========================================================

function renderWeekButtons() {

  const weeklyButtons =
    document.getElementById(
      "weeklyButtons"
    );

  if (!weeklyButtons) {
    return;
  }

  const realToday =
    todayWIB();

  const start =
    mondayOf(realToday);

  const dates = [];

  for (
    let i = 0;
    i < 7;
    i++
  ) {

    const d =
      new Date(start);

    d.setDate(
      start.getDate() + i
    );

    dates.push(
      toISO(d)
    );

  }


  // -------------------------------------------------------
  // BUAT TOMBOL
  // -------------------------------------------------------

  weeklyButtons.innerHTML =
    dates
      .map(iso => {

        const d =
          parseISO(iso);

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

            <span class="date-number">
              ${d.getDate()}
            </span>
          </button>
        `;

      })
      .join("");


  // -------------------------------------------------------
  // KLIK HARI
  // -------------------------------------------------------

  weeklyButtons
    .querySelectorAll(
      ".day-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectedDate =
            button.dataset.date;

          setURL();

          // Langsung ubah hari & tanggal
          updateDayDate();

          // Render ulang tombol
          renderWeekButtons();

          // Ambil menu tanggal tersebut
          loadMenu();

        }
      );

    });


  // -------------------------------------------------------
  // POSISIKAN HARI AKTIF DI TENGAH
  // -------------------------------------------------------

  requestAnimationFrame(() => {

    const activeButton =
      weeklyButtons.querySelector(
        ".day-button.active"
      );

    if (!activeButton) {
      return;
    }

    const containerWidth =
      weeklyButtons.clientWidth;

    const buttonWidth =
      activeButton.offsetWidth;

    const target =
      activeButton.offsetLeft -
      (
        containerWidth -
        buttonWidth
      ) / 2;

    weeklyButtons.scrollLeft =
      Math.max(
        0,
        target
      );

  });

}


// =========================================================
// LOAD MENU DARI SUPABASE
// =========================================================

async function loadMenu() {

  // -------------------------------------------------------
  // PASTIKAN HARI & TANGGAL SELALU TAMPIL
  // -------------------------------------------------------

  updateDayDate();


  // -------------------------------------------------------
  // CEK SUPABASE
  // -------------------------------------------------------

  if (
    !window.SUPABASE_URL ||
    window.SUPABASE_URL.startsWith("PASTE_")
  ) {

    console.error(
      "Konfigurasi Supabase belum diisi."
    );

    showEmpty(
      "Konfigurasi Supabase belum diisi."
    );

    return;

  }


  // -------------------------------------------------------
  // BUAT CLIENT
  // -------------------------------------------------------

  const sb =
    window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );


  // -------------------------------------------------------
  // AMBIL MENU
  // -------------------------------------------------------

  const {
    data: menu,
    error
  } =
    await sb
      .from("menus")
      .select("*")
      .eq(
        "menu_date",
        selectedDate
      )
      .maybeSingle();


  // -------------------------------------------------------
  // ERROR
  // -------------------------------------------------------

  if (error) {

    console.error(
      "Gagal mengambil menu:",
      error
    );

    showEmpty(
      "Gagal mengambil data menu. Periksa konfigurasi Supabase dan RLS."
    );

    return;

  }


  // -------------------------------------------------------
  // FOTO MENU
  // -------------------------------------------------------

  const img =
    document.getElementById(
      "menuPhoto"
    );

  const placeholder =
    document.getElementById(
      "photoPlaceholder"
    );


  if (menu?.photo_url) {

    if (img) {

      img.src =
        menu.photo_url;

      img.alt =
        `Foto menu ${fmtDate(
          selectedDate
        )}`;

      img.style.display =
        "block";

    }

    if (placeholder) {

      placeholder.style.display =
        "none";

    }

  } else {

    if (img) {

      img.src = "";

      img.style.display =
        "none";

    }

    if (placeholder) {

      placeholder.style.display =
        "flex";

    }

  }


  // -------------------------------------------------------
  // MENU TIDAK ADA
  // -------------------------------------------------------

  if (!menu) {

    showEmpty(
      `Data menu untuk tanggal ${fmtDate(
        selectedDate
      )} belum dimasukkan oleh Admin.`
    );

    return;

  }


  // -------------------------------------------------------
  // TAMPILKAN MENU
  // -------------------------------------------------------

  const emptyState =
    document.getElementById(
      "emptyState"
    );

  const menuContent =
    document.getElementById(
      "menuContent"
    );

  if (emptyState) {

    emptyState.style.display =
      "none";

  }

  if (menuContent) {

    menuContent.style.display =
      "block";

  }


  // -------------------------------------------------------
  // ISI OMPRENG
  // -------------------------------------------------------

  const foodItems = [
    "carbohydrate",
    "animal_protein",
    "plant_protein",
    "vegetable",
    "fruit"
  ];

  foodItems.forEach(
    key => {

      const element =
        document.getElementById(
          key
        );

      if (element) {

        element.textContent =
          menu[key] || "-";

      }

    }
  );


  // -------------------------------------------------------
  // GIZI PER PORSI
  // -------------------------------------------------------

  const rows = [

    [
      "Energi",
      "kkal",
      "energy_small",
      "energy_large"
    ],

    [
      "Protein",
      "gram",
      "protein_small",
      "protein_large"
    ],

    [
      "Lemak",
      "gram",
      "fat_small",
      "fat_large"
    ],

    [
      "Karbohidrat",
      "gram",
      "carb_small",
      "carb_large"
    ],

    [
      "Serat",
      "gram",
      "fiber_small",
      "fiber_large"
    ]

  ];


  const nutritionRows =
    document.getElementById(
      "nutritionRows"
    );


  if (nutritionRows) {

    nutritionRows.innerHTML =
      rows
        .map(row => {

          return `
            <tr>

              <td>
                <strong>
                  ${esc(row[0])}
                </strong>

                <br>

                <small>
                  (${esc(row[1])})
                </small>
              </td>

              <td>
                ${esc(
                  menu[row[2]] ?? "-"
                )}
              </td>

              <td>
                ${esc(
                  menu[row[3]] ?? "-"
                )}
              </td>

            </tr>
          `;

        })
        .join("");

  }

}


// =========================================================
// MENU BELUM TERSEDIA
// =========================================================

function showEmpty(text) {

  const menuContent =
    document.getElementById(
      "menuContent"
    );

  const emptyState =
    document.getElementById(
      "emptyState"
    );

  const emptyText =
    document.getElementById(
      "emptyText"
    );

  if (menuContent) {

    menuContent.style.display =
      "none";

  }

  if (emptyState) {

    emptyState.style.display =
      "block";

  }

  if (emptyText) {

    emptyText.innerHTML = `
      <strong>
        📋 MENU BELUM TERSEDIA
      </strong>

      <br>

      ${esc(text)}
    `;

  }

}


// =========================================================
// CEK PERGANTIAN HARI
// =========================================================

function checkDateChange() {

  const currentToday =
    todayWIB();

  if (
    currentToday !==
    lastRealToday
  ) {

    lastRealToday =
      currentToday;

    selectedDate =
      currentToday;

    setURL();

    updateDayDate();

    renderWeekButtons();

    loadMenu();

  }

}


// =========================================================
// JALANKAN APLIKASI
// =========================================================

function render() {

  // -------------------------------------------------------
  // 1. TAMPILKAN HARI & TANGGAL
  // -------------------------------------------------------

  updateDayDate();

  // -------------------------------------------------------
  // 2. TAMPILKAN MENU MINGGUAN
  // -------------------------------------------------------

  renderWeekButtons();

  // -------------------------------------------------------
  // 3. BARU AMBIL DATA MENU
  // -------------------------------------------------------

  loadMenu();

}


// =========================================================
// MULAI
// =========================================================

render();


// =========================================================
// CEK SETIAP 30 DETIK
// =========================================================

setInterval(
  checkDateChange,
  30000
);
