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
  const emptyState =
    document.getElementById("emptyState");

  const emptyText =
    document.getElementById("emptyText");

  if (emptyState) {
    emptyState.style.display = "block";
  }

  if (emptyText) {
    emptyText.textContent =
      "Konfigurasi Supabase belum diisi. Silakan ikuti README.";
  }

  throw new Error(
    "Supabase config belum diisi."
  );
}


// =========================================================
// SUPABASE
// =========================================================

const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


// =========================================================
// TANGGAL
// =========================================================

const params =
  new URLSearchParams(location.search);


// =========================================================
// KONVERSI TANGGAL KE FORMAT YYYY-MM-DD
// =========================================================

function toISO(d) {
  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}


// =========================================================
// TANGGAL HARI INI BERDASARKAN WIB
// =========================================================

function todayWIB() {

  const now = new Date();

  const wib = new Date(
    now.toLocaleString(
      "en-US",
      {
        timeZone: "Asia/Jakarta"
      }
    )
  );

  return toISO(wib);
}


// =========================================================
// TANGGAL YANG AKTIF
//
// SETIAP KALI WEBSITE DIBUKA / REFRESH
// OTOMATIS KEMBALI KE HARI INI
// =========================================================

let selectedDate = todayWIB();


// =========================================================
// PARSE TANGGAL
// =========================================================

function parseISO(s) {

  const [a, b, c] =
    s.split("-").map(Number);

  return new Date(
    a,
    b - 1,
    c
  );
}


// =========================================================
// SENIN DARI TANGGAL TERPILIH
// =========================================================

function mondayOf(s) {

  const d = parseISO(s);

  const day = d.getDay();

  d.setDate(
    d.getDate() +
    (day === 0 ? -6 : 1 - day)
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
// MENU MINGGU INI
// =========================================================

async function loadWeek() {

  /*
   * PENTING:
   * Setiap kali loadWeek dijalankan,
   * tanggal hari ini WIB dicek kembali.
   *
   * Tetapi jika user sedang memilih tanggal
   * lain melalui tombol MENU MINGGU INI,
   * pilihan tersebut tetap digunakan sampai
   * halaman dibuka / refresh kembali.
   */

  const start =
    mondayOf(selectedDate);

  const dates = [];


  // =======================================================
  // SENIN SAMPAI JUMAT
  // =======================================================

  for (let i = 0; i < 5; i++) {

    const d =
      new Date(start);

    d.setDate(
      start.getDate() + i
    );

    dates.push(
      toISO(d)
    );
  }


  // =======================================================
  // CEK DATA MENU DI SUPABASE
  // =======================================================

  const {
    data,
    error
  } = await sb
    .from("menus")
    .select("menu_date")
    .in(
      "menu_date",
      dates
    );


  if (error) {

    console.error(error);

  }


  // =======================================================
  // TOMBOL MENU MINGGU INI
  // =======================================================

  const weeklyButtons =
    document.getElementById(
      "weeklyButtons"
    );


  if (!weeklyButtons) {

    return;

  }


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


  // =======================================================
  // KLIK TANGGAL
  // =======================================================

  weeklyButtons
    .querySelectorAll(
      ".day-button"
    )
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

  const d =
    parseISO(selectedDate);


  // =======================================================
  // HARI
  // =======================================================

  const dayName =
    document.getElementById(
      "dayName"
    );

  if (dayName) {

    dayName.textContent =
      labels[d.getDay()];

  }


  // =======================================================
  // TANGGAL
  // =======================================================

  const displayDate =
    document.getElementById(
      "displayDate"
    );

  if (displayDate) {

    displayDate.textContent =
      fmtDate(
        selectedDate
      );

  }


  // =======================================================
  // AMBIL DATA MENU
  // =======================================================

  const {
    data: menu,
    error
  } = await sb
    .from("menus")
    .select("*")
    .eq(
      "menu_date",
      selectedDate
    )
    .maybeSingle();


  // =======================================================
  // ERROR SUPABASE
  // =======================================================

  if (error) {

    console.error(error);

    showEmpty(
      "Gagal mengambil data menu. Periksa konfigurasi Supabase dan RLS."
    );

    return;

  }


  // =======================================================
  // FOTO MENU
  // =======================================================

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


  // =======================================================
  // GIZI PER PORSI
  // =======================================================

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
// RENDER
// =========================================================

async function render() {

  await loadWeek();

  await loadMenu();

}


// =========================================================
// JALANKAN APLIKASI
// =========================================================

render();
