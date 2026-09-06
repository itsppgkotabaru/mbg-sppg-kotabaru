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


/* =========================================================
   TANGGAL
========================================================= */

function toISO(d) {
  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}


function todayWIB() {
  const now = new Date();

  const wib = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Jakarta"
    })
  );

  return toISO(wib);
}


function parseISO(s) {
  const [y, m, d] =
    s.split("-").map(Number);

  return new Date(
    y,
    m - 1,
    d
  );
}


function mondayOf(s) {
  const d = parseISO(s);
  const day = d.getDay();

  d.setDate(
    d.getDate() +
    (day === 0 ? -6 : 1 - day)
  );

  return d;
}


function fmtDate(s) {
  const d = parseISO(s);

  return `${d.getDate()} ${
    months[d.getMonth()]
  } ${d.getFullYear()}`;
}


/* =========================================================
   URL
========================================================= */

function getInitialDate() {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const date =
    params.get("date");

  if (
    date &&
    /^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return date;
  }

  return todayWIB();
}


let selectedDate =
  getInitialDate();


let lastRealToday =
  todayWIB();


function setURL() {
  history.replaceState(
    null,
    "",
    `?date=${selectedDate}`
  );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function esc(v) {
  return String(v ?? "")
    .replace(
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


/* =========================================================
   HARI DAN TANGGAL
   DITAMPILKAN LANGSUNG
========================================================= */

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


/* =========================================================
   MENU MINGGU INI
   DITAMPILKAN LANGSUNG
========================================================= */

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


  weeklyButtons
    .querySelectorAll(
      ".day-button"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        function () {

          selectedDate =
            this.dataset.date;


          setURL();


          updateDayDate();


          renderWeekButtons();


          loadMenu();

        }
      );

    });


  /* Pusatkan tanggal aktif */

  requestAnimationFrame(() => {

    const activeButton =
      weeklyButtons.querySelector(
        ".day-button.active"
      );


    if (activeButton) {

      activeButton.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });

    }

  });

}


/* =========================================================
   SUPABASE
========================================================= */

let sb = null;


function initSupabase() {

  if (
    !window.SUPABASE_URL ||
    !window.SUPABASE_ANON_KEY
  ) {

    console.error(
      "Konfigurasi Supabase belum tersedia."
    );

    return false;

  }


  if (
    window.SUPABASE_URL.startsWith(
      "PASTE_"
    )
  ) {

    console.error(
      "SUPABASE_URL belum diisi."
    );

    return false;

  }


  if (
    !window.supabase ||
    !window.supabase.createClient
  ) {

    console.error(
      "Library Supabase belum dimuat."
    );

    return false;

  }


  sb =
    window.supabase.createClient(
      window.SUPABASE_URL,
      window.SUPABASE_ANON_KEY
    );


  return true;

}


/* =========================================================
   MENU
========================================================= */

async function loadMenu() {

  /*
     Hari dan tanggal TETAP ditampilkan
     walaupun Supabase bermasalah.
  */

  updateDayDate();


  const img =
    document.getElementById(
      "menuPhoto"
    );


  const placeholder =
    document.getElementById(
      "photoPlaceholder"
    );


  const menuContent =
    document.getElementById(
      "menuContent"
    );


  const emptyState =
    document.getElementById(
      "emptyState"
    );


  if (!initSupabase()) {

    if (menuContent) {
      menuContent.style.display =
        "none";
    }


    if (emptyState) {

      emptyState.style.display =
        "block";

    }


    const emptyText =
      document.getElementById(
        "emptyText"
      );


    if (emptyText) {

      emptyText.innerHTML = `
        <strong>
          📋 MENU BELUM TERSEDIA
        </strong>
        <br>
        Konfigurasi Supabase belum tersedia.
      `;

    }


    return;

  }


  try {

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


    if (error) {

      console.error(
        "Supabase error:",
        error
      );


      showEmpty(
        "Gagal mengambil data menu. Periksa konfigurasi Supabase dan RLS."
      );


      return;

    }


    /* =====================================================
       FOTO
    ===================================================== */

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


    /* =====================================================
       JIKA MENU BELUM ADA
    ===================================================== */

    if (!menu) {

      showEmpty(
        `Data menu untuk tanggal ${fmtDate(
          selectedDate
        )} belum dimasukkan oleh Admin.`
      );


      return;

    }


    if (emptyState) {

      emptyState.style.display =
        "none";

    }


    if (menuContent) {

      menuContent.style.display =
        "block";

    }


    /* =====================================================
       ISI OMPRENG
    ===================================================== */

    const foodItems = [
      "carbohydrate",
      "animal_protein",
      "plant_protein",
      "vegetable",
      "fruit"
    ];


    foodItems.forEach(key => {

      const element =
        document.getElementById(
          key
        );


      if (element) {

        element.textContent =
          menu[key] || "-";

      }

    });


    /* =====================================================
       GIZI
    ===================================================== */

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

  } catch (err) {

    console.error(
      "Terjadi kesalahan:",
      err
    );


    showEmpty(
      "Terjadi kesalahan saat mengambil data menu."
    );

  }

}


/* =========================================================
   EMPTY STATE
========================================================= */

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


/* =========================================================
   PERGANTIAN HARI
========================================================= */

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


/* =========================================================
   MULAI
========================================================= */

function startPage() {

  /*
     PENTING:
     Dua bagian ini dijalankan SEBELUM Supabase.
  */

  updateDayDate();

  renderWeekButtons();


  /*
     Baru setelah itu ambil data menu.
  */

  loadMenu();

}


/* =========================================================
   JALANKAN
========================================================= */

startPage();


/* =========================================================
   CEK PERGANTIAN HARI SETIAP 30 DETIK
========================================================= */

setInterval(
  checkDateChange,
  30000
);
