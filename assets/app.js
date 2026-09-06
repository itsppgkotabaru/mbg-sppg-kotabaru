/* =========================================================
   SPPG POLRES BREBES KOTABARU
   APP.JS - VERSI TERBARU
========================================================= */

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Konfigurasi Supabase tidak ditemukan.");
}

const supabaseClient =
  window.supabase &&
  SUPABASE_URL &&
  SUPABASE_ANON_KEY
    ? window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
      )
    : null;


/* =========================================================
   LABEL HARI
========================================================= */

const labels = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu"
];


/* =========================================================
   LABEL BULAN
========================================================= */

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


/* =========================================================
   ESCAPE HTML
========================================================= */

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

function parseISO(iso) {
  const [year, month, day] =
    iso.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}


function toISO(date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


/* =========================================================
   TANGGAL HARI INI - WIB
========================================================= */

function todayWIB() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  );

  return formatter.format(now);
}


/* =========================================================
   CEK SABTU / MINGGU
========================================================= */

function isWeekend(dateString) {
  const date = parseISO(dateString);
  const day = date.getDay();

  return day === 0 || day === 6;
}


/* =========================================================
   NAMA HARI
========================================================= */

function getDayName(dateString) {
  const date = parseISO(dateString);

  return labels[date.getDay()];
}


/* =========================================================
   TANGGAL TAMPILAN
========================================================= */

function formatDisplayDate(dateString) {
  const date = parseISO(dateString);

  return `${date.getDate()} ${
    months[date.getMonth()]
  } ${date.getFullYear()}`;
}


/* =========================================================
   MENU TANGGAL
========================================================= */

function getCurrentMenuDates() {

  const today = parseISO(todayWIB());
  const day = today.getDay();
  const dates = [];


  /* =======================================================
     HP
     Bisa geser ke tanggal sebelumnya dan berikutnya
  ======================================================= */

  if (window.innerWidth <= 700) {

    for (let i = -6; i <= 12; i++) {

      const date = new Date(today);

      date.setDate(
        today.getDate() + i
      );

      dates.push(
        toISO(date)
      );
    }

    return dates;
  }


  /* =======================================================
     LAPTOP / DESKTOP
     LOGIKA ASLI
  ======================================================= */

  if (day === 0) {

    for (let i = 0; i <= 5; i++) {

      const date = new Date(today);

      date.setDate(
        today.getDate() + i
      );

      dates.push(
        toISO(date)
      );
    }

    return dates;
  }


  if (day >= 1 && day <= 5) {

    const daysUntilFriday =
      5 - day;

    for (
      let i = 0;
      i <= daysUntilFriday;
      i++
    ) {

      const date = new Date(today);

      date.setDate(
        today.getDate() + i
      );

      dates.push(
        toISO(date)
      );
    }

    return dates;
  }


  const monday = new Date(today);

  monday.setDate(
    today.getDate() + 2
  );


  for (let i = 0; i < 5; i++) {

    const date = new Date(monday);

    date.setDate(
      monday.getDate() + i
    );

    dates.push(
      toISO(date)
    );
  }

  return dates;
}


/* =========================================================
   LOAD MENU MINGGUAN
========================================================= */

async function loadWeek() {

  const weeklyButtons =
    document.getElementById(
      "weeklyButtons"
    );

  if (!weeklyButtons) {
    return;
  }


  const dates =
    getCurrentMenuDates();

  const today =
    todayWIB();


  weeklyButtons.innerHTML =
    dates
      .map(dateString => {

        const date =
          parseISO(dateString);

        const active =
          dateString === today
            ? " active"
            : "";

        return `
          <button
            class="day-button${active}"
            type="button"
            data-date="${dateString}"
          >
            <strong>
              ${labels[date.getDay()]}
            </strong>

            <span class="date-number">
              ${date.getDate()}
            </span>
          </button>
        `;
      })
      .join("");


  /* =======================================================
     EVENT TOMBOL TANGGAL
  ======================================================= */

  weeklyButtons
    .querySelectorAll(
      ".day-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          const selectedDate =
            button.dataset.date;

          weeklyButtons
            .querySelectorAll(
              ".day-button"
            )
            .forEach(btn =>
              btn.classList.remove(
                "active"
              )
            );

          button.classList.add(
            "active"
          );

          await loadMenu(
            selectedDate
          );
        }
      );
    });


  /* =======================================================
     HP
     POSISIKAN HARI INI
  ======================================================= */

  if (
    window.innerWidth <= 700
  ) {

    const activeButton =
      weeklyButtons.querySelector(
        ".day-button.active"
      );

    if (activeButton) {

      weeklyButtons.scrollLeft =
        activeButton.offsetLeft;
    }
  }
}


/* =========================================================
   LOAD MENU
========================================================= */

async function loadMenu(
  dateString = todayWIB()
) {

  const dayName =
    document.getElementById(
      "dayName"
    );

  const displayDate =
    document.getElementById(
      "displayDate"
    );


  /* =======================================================
     TAMPILKAN HARI & TANGGAL
  ======================================================= */

  if (dayName) {

    dayName.textContent =
      getDayName(dateString);
  }


  if (displayDate) {

    displayDate.textContent =
      formatDisplayDate(
        dateString
      );
  }


  /* =======================================================
     CEK SABTU / MINGGU
  ======================================================= */

  if (isWeekend(dateString)) {

    renderWeekendOff();

    return;
  }


  /* =======================================================
     CEK SUPABASE
  ======================================================= */

  if (!supabaseClient) {

    renderEmptyMenu(
      "Koneksi database tidak tersedia."
    );

    return;
  }


  try {

    const {
      data,
      error
    } =
      await supabaseClient
        .from("menus")
        .select("*")
        .eq(
          "menu_date",
          dateString
        )
        .maybeSingle();


    if (error) {

      console.error(
        "Gagal mengambil menu:",
        error
      );

      renderEmptyMenu(
        "Menu belum tersedia."
      );

      return;
    }


    /* =====================================================
       TIDAK ADA DATA
    ===================================================== */

    if (!data) {

      renderEmptyMenu(
        "Menu belum tersedia."
      );

      return;
    }


    /* =====================================================
       RENDER MENU
    ===================================================== */

    renderMenu(data);

  } catch (error) {

    console.error(error);

    renderEmptyMenu(
      "Terjadi kesalahan saat mengambil menu."
    );
  }
}


/* =========================================================
   RENDER MENU
========================================================= */

function renderMenu(menu) {

  /* =======================================================
     FOTO MENU
  ======================================================= */

  const menuPhoto =
    document.getElementById(
      "menuPhoto"
    );

  if (menuPhoto) {

    if (menu.photo_url) {

      menuPhoto.src =
        menu.photo_url;

      menuPhoto.style.display =
        "block";

    } else {

      menuPhoto.removeAttribute(
        "src"
      );

      menuPhoto.style.display =
        "none";
    }
  }


  /* =======================================================
     JUDUL MENU
  ======================================================= */

  const menuTitle =
    document.getElementById(
      "menuTitle"
    );

  if (menuTitle) {

    menuTitle.textContent =
      menu.menu_title || "";
  }


  /* =======================================================
     DESKRIPSI
  ======================================================= */

  const menuDescription =
    document.getElementById(
      "menuDescription"
    );

  if (menuDescription) {

    menuDescription.textContent =
      menu.menu_description || "";
  }


  /* =======================================================
     ISI OMPRENG
  ======================================================= */

  const foodFields = [
    [
      "carbohydrate",
      "Karbohidrat",
      menu.carbohydrate
    ],
    [
      "animal_protein",
      "Protein Hewani",
      menu.animal_protein
    ],
    [
      "plant_protein",
      "Protein Nabati",
      menu.plant_protein
    ],
    [
      "vegetable",
      "Sayuran",
      menu.vegetable
    ],
    [
      "fruit",
      "Buah",
      menu.fruit
    ]
  ];


  foodFields.forEach(
    ([id, label, value]) => {

      const element =
        document.getElementById(id);

      if (!element) {
        return;
      }

      element.textContent =
        value || "-";
    }
  );


  /* =======================================================
     PERHATIAN
  ======================================================= */

  const warningText =
    document.getElementById(
      "warningText"
    );

  if (warningText) {

    warningText.textContent =
      menu.warning || "";
  }


  /* =======================================================
     NUTRISI
  ======================================================= */

  const nutritionRows =
    document.getElementById(
      "nutritionRows"
    );


  if (nutritionRows) {

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


  /* =======================================================
     TAMPILKAN KEMBALI ELEMEN MENU
  ======================================================= */

  const mainMenu =
    document.querySelector(
      ".menu-card"
    );

  if (mainMenu) {

    mainMenu.style.display =
      "";
  }


  const nutritionSection =
    document.querySelector(
      ".nutrition-section"
    );

  if (nutritionSection) {

    nutritionSection.style.display =
      "";
  }


  const warningBox =
    document.querySelector(
      ".warning-box"
    );

  if (warningBox) {

    warningBox.style.display =
      "";
  }


  const emptyState =
    document.getElementById(
      "emptyState"
    );

  if (emptyState) {

    emptyState.style.display =
      "none";
  }
}


/* =========================================================
   SABTU / MINGGU - OFF
========================================================= */

function renderWeekendOff() {

  /* =======================================================
     SEMBUNYIKAN MENU UTAMA
  ======================================================= */

  const mainMenu =
    document.querySelector(
      ".menu-card"
    );

  if (mainMenu) {

    mainMenu.style.display =
      "none";
  }


  /* =======================================================
     SEMBUNYIKAN PERHATIAN
  ======================================================= */

  const warningBox =
    document.querySelector(
      ".warning-box"
    );

  if (warningBox) {

    warningBox.style.display =
      "none";
  }


  /* =======================================================
     SEMBUNYIKAN NUTRISI
  ======================================================= */

  const nutritionSection =
    document.querySelector(
      ".nutrition-section"
    );

  if (nutritionSection) {

    nutritionSection.style.display =
      "none";
  }


  /* =======================================================
     TAMPILKAN OFF
  ======================================================= */

  let emptyState =
    document.getElementById(
      "emptyState"
    );


  if (!emptyState) {

    emptyState =
      document.createElement(
        "div"
      );

    emptyState.id =
      "emptyState";

    const weeklyMenu =
      document.querySelector(
        ".weekly-menu"
      );

    if (weeklyMenu) {

      weeklyMenu.parentNode.insertBefore(
        emptyState,
        weeklyMenu
      );

    } else {

      document.body.appendChild(
        emptyState
      );
    }
  }


  emptyState.innerHTML = `
    <div
      style="
        text-align:center;
        padding:35px 20px;
        margin:20px 0;
        background:#fff5f5;
        border:1px solid #f1b5b5;
        border-radius:15px;
      "
    >

      <div
        style="
          font-size:38px;
          margin-bottom:10px;
        "
      >
        🔴
      </div>

      <div
        style="
          font-size:24px;
          font-weight:900;
          color:#c62828;
          margin-bottom:6px;
        "
      >
        OFF
      </div>

      <div
        style="
          font-size:15px;
          font-weight:600;
          color:#555;
        "
      >
        Hari ${esc(
          getDayName(
            getCurrentSelectedDate()
          )
        )}
      </div>

      <div
        style="
          font-size:13px;
          color:#777;
          margin-top:5px;
        "
      >
        Tidak ada pelayanan menu
        pada hari Sabtu dan Minggu.
      </div>

    </div>
  `;


  emptyState.style.display =
    "block";
}


/* =========================================================
   TANGGAL YANG SEDANG DIPILIH
========================================================= */

function getCurrentSelectedDate() {

  const activeButton =
    document.querySelector(
      ".day-button.active"
    );

  if (
    activeButton &&
    activeButton.dataset.date
  ) {

    return activeButton.dataset.date;
  }

  return todayWIB();
}


/* =========================================================
   MENU KOSONG
========================================================= */

function renderEmptyMenu(
  message = "Menu belum tersedia."
) {

  const mainMenu =
    document.querySelector(
      ".menu-card"
    );

  if (mainMenu) {

    mainMenu.style.display =
      "none";
  }


  const warningBox =
    document.querySelector(
      ".warning-box"
    );

  if (warningBox) {

    warningBox.style.display =
      "none";
  }


  const nutritionSection =
    document.querySelector(
      ".nutrition-section"
    );

  if (nutritionSection) {

    nutritionSection.style.display =
      "none";
  }


  let emptyState =
    document.getElementById(
      "emptyState"
    );


  if (!emptyState) {

    emptyState =
      document.createElement(
        "div"
      );

    emptyState.id =
      "emptyState";

    const weeklyMenu =
      document.querySelector(
        ".weekly-menu"
      );

    if (weeklyMenu) {

      weeklyMenu.parentNode.insertBefore(
        emptyState,
        weeklyMenu
      );

    } else {

      document.body.appendChild(
        emptyState
      );
    }
  }


  emptyState.innerHTML = `
    <div
      style="
        text-align:center;
        padding:30px 20px;
        margin:20px 0;
        background:#f8fafc;
        border:1px solid #e5eaf2;
        border-radius:15px;
      "
    >

      <div
        style="
          font-size:17px;
          font-weight:700;
          color:#555;
        "
      >
        ${esc(message)}
      </div>

    </div>
  `;


  emptyState.style.display =
    "block";
}


/* =========================================================
   RENDER AWAL
========================================================= */

async function render() {

  const today =
    todayWIB();


  /* =======================================================
     HARI & TANGGAL
  ======================================================= */

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
      getDayName(today);
  }


  if (displayDate) {

    displayDate.textContent =
      formatDisplayDate(today);
  }


  /* =======================================================
     MENU HARI INI
  ======================================================= */

  await loadMenu(today);


  /* =======================================================
     MENU MINGGU INI
  ======================================================= */

  await loadWeek();
}


/* =========================================================
   JALANKAN APLIKASI
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    render();
  }
);


/* =========================================================
   JIKA UKURAN LAYAR BERUBAH
   HP <-> LAPTOP
========================================================= */

let lastMobileState =
  window.innerWidth <= 700;


window.addEventListener(
  "resize",
  async () => {

    const currentMobileState =
      window.innerWidth <= 700;


    if (
      currentMobileState !==
      lastMobileState
    ) {

      lastMobileState =
        currentMobileState;

      await loadWeek();
    }
  }
);
