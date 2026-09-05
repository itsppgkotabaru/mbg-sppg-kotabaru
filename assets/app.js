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
   CEK CONFIG SUPABASE
========================================================= */

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


/* =========================================================
   TANGGAL REAL INDONESIA / WIB
========================================================= */

function todayWIB() {

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const get = type => {
    const item = parts.find(
      part => part.type === type
    );

    return item ? item.value : "";
  };

  return `${get("year")}-${get("month")}-${get("day")}`;
}


/* =========================================================
   UTILITAS TANGGAL
========================================================= */

function toISO(date) {

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}


function parseISO(value) {

  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}


/* =========================================================
   MENCARI HARI SENIN DALAM MINGGU
========================================================= */

function mondayOf(value) {

  const date = parseISO(value);

  const day = date.getDay();

  const difference =
    day === 0
      ? -6
      : 1 - day;

  date.setDate(
    date.getDate() + difference
  );

  return date;
}


/* =========================================================
   FORMAT TANGGAL
========================================================= */

function fmtDate(value) {

  const date = parseISO(value);

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}


/* =========================================================
   URL
========================================================= */

const params =
  new URLSearchParams(
    window.location.search
  );


const urlDate =
  /^\d{4}-\d{2}-\d{2}$/.test(
    params.get("date") || ""
  )
    ? params.get("date")
    : null;


/* =========================================================
   TANGGAL REAL HARI INI
========================================================= */

const realToday =
  todayWIB();


/* =========================================================
   MINGGU REAL SAAT INI
========================================================= */

const realWeekStart =
  mondayOf(realToday);


/* =========================================================
   TANGGAL MENU YANG DIPILIH
========================================================= */

/*
   Jika URL memiliki ?date=...
   gunakan tanggal tersebut.

   Jika tidak ada URL,
   gunakan Senin pada minggu berjalan.

   Ini penting agar saat Sabtu/Minggu,
   website tidak mencari menu Sabtu/Minggu.
*/

let selectedDate =
  urlDate ||
  toISO(realWeekStart);


/* =========================================================
   MINGGU YANG SEDANG DITAMPILKAN
========================================================= */

let weekStart =
  mondayOf(selectedDate);


/* =========================================================
   SET URL
========================================================= */

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

function esc(value) {

  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );
}


/* =========================================================
   MEMBUAT DAFTAR SENIN - JUMAT
========================================================= */

function getWeekDates() {

  const dates = [];

  for (let i = 0; i < 5; i++) {

    const date =
      new Date(weekStart);

    date.setDate(
      weekStart.getDate() + i
    );

    dates.push(
      toISO(date)
    );
  }

  return dates;
}


/* =========================================================
   LOAD MENU MINGGU
========================================================= */

async function loadWeek() {

  const dates =
    getWeekDates();


  /* -----------------------------------------
     Ambil data menu dari Supabase
  ----------------------------------------- */

  const {
    data,
    error
  } = await sb
    .from("menus")
    .select("menu_date")
    .in("menu_date", dates);


  if (error) {

    console.error(
      "Gagal mengambil daftar menu:",
      error
    );
  }


  const have =
    new Set(
      (data || []).map(
        item => item.menu_date
      )
    );


  /* -----------------------------------------
     Tampilkan kartu Senin-Jumat
  ----------------------------------------- */

  const weeklyButtons =
    document.getElementById(
      "weeklyButtons"
    );


  if (!weeklyButtons) {
    console.error(
      "Elemen #weeklyButtons tidak ditemukan."
    );

    return;
  }


  weeklyButtons.innerHTML =
    dates
      .map(dateString => {

        const date =
          parseISO(dateString);

        const active =
          dateString === selectedDate
            ? " active"
            : "";


        /*
           Tidak perlu menampilkan bulan.
           Hanya HARI + ANGKA TANGGAL.
        */

        return `
          <button
            class="day-button${active}"
            type="button"
            data-date="${dateString}"
          >
            <strong>
              ${labels[date.getDay()]}
            </strong>

            <span>
              ${date.getDate()}
            </span>
          </button>
        `;

      })
      .join("");


  /* -----------------------------------------
     Fungsi klik kartu tanggal
  ----------------------------------------- */

  document
    .querySelectorAll(".day-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        async () => {

          selectedDate =
            button.dataset.date;


          /*
             Pastikan weekStart
             mengikuti tanggal yang dipilih.
          */

          weekStart =
            mondayOf(selectedDate);


          setURL();


          /*
             Update tombol aktif
          */

          document
            .querySelectorAll(
              ".day-button"
            )
            .forEach(btn => {

              btn.classList.remove(
                "active"
              );

            });


          button.classList.add(
            "active"
          );


          /*
             Load menu tanggal tersebut
          */

          await loadMenu();

        }
      );

    });
}


/* =========================================================
   LOAD MENU HARIAN
========================================================= */

async function loadMenu() {

  const date =
    parseISO(selectedDate);


  /* -----------------------------------------
     Nama hari
  ----------------------------------------- */

  const dayName =
    document.getElementById(
      "dayName"
    );

  if (dayName) {

    dayName.textContent =
      labels[date.getDay()];

  }


  /* -----------------------------------------
     Tanggal lengkap
  ----------------------------------------- */

  const displayDate =
    document.getElementById(
      "displayDate"
    );

  if (displayDate) {

    displayDate.textContent =
      fmtDate(selectedDate);

  }


  /* -----------------------------------------
     Caption foto
  ----------------------------------------- */

  const photoCaption =
    document.getElementById(
      "photoCaption"
    );

  if (photoCaption) {

    photoCaption.textContent =
      `MENU ${labels[date.getDay()].toUpperCase()}`;

  }


  /* -----------------------------------------
     Ambil menu dari Supabase
  ----------------------------------------- */

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


  /* -----------------------------------------
     Error Supabase
  ----------------------------------------- */

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


  /* -----------------------------------------
     Foto menu
  ----------------------------------------- */

  const image =
    document.getElementById(
      "menuPhoto"
    );

  const placeholder =
    document.getElementById(
      "photoPlaceholder"
    );


  if (menu?.photo_url) {

    if (image) {

      image.src =
        menu.photo_url;

      image.alt =
        `Foto menu ${fmtDate(selectedDate)}`;

      image.style.display =
        "block";

    }


    if (placeholder) {

      placeholder.style.display =
        "none";

    }

  } else {

    if (image) {

      image.style.display =
        "none";

    }


    if (placeholder) {

      placeholder.style.display =
        "block";

    }

  }


  /* -----------------------------------------
     Jika menu belum tersedia
  ----------------------------------------- */

  if (!menu) {

    showEmpty(
      `Data menu untuk tanggal ${fmtDate(selectedDate)} belum dimasukkan oleh Admin.`
    );

    return;
  }


  /* -----------------------------------------
     Tampilkan konten menu
  ----------------------------------------- */

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


  /* -----------------------------------------
     Judul menu
  ----------------------------------------- */

  const menuTitle =
    document.getElementById(
      "menuTitle"
    );

  if (menuTitle) {

    menuTitle.textContent =
      menu.menu_title ||
      "Paket Makan Bergizi Gratis";

  }


  /* -----------------------------------------
     Deskripsi menu
  ----------------------------------------- */

  const menuDescription =
    document.getElementById(
      "menuDescription"
    );

  if (menuDescription) {

    menuDescription.textContent =
      menu.menu_description || "";

  }


  /* -----------------------------------------
     ISI OMPRANG
  ----------------------------------------- */

  const foodFields = [
    "carbohydrate",
    "animal_protein",
    "plant_protein",
    "vegetable",
    "fruit"
  ];


  foodFields.forEach(field => {

    const element =
      document.getElementById(
        field
      );


    if (element) {

      element.textContent =
        menu[field] || "";

    }

  });


  /* -----------------------------------------
     NUTRISI
  ----------------------------------------- */

  const nutritionRows = [

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


  const nutritionElement =
    document.getElementById(
      "nutritionRows"
    );


  if (nutritionElement) {

    nutritionElement.innerHTML =
      nutritionRows
        .map(row => {

          return `
            <tr>
              <td>${esc(row[0])}</td>
              <td>${esc(menu[row[1]])}</td>
              <td>${esc(menu[row[2]])}</td>
            </tr>
          `;

        })
        .join("");

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

    emptyText.textContent =
      text;

  }
}


/* =========================================================
   RENDER
========================================================= */

async function render() {

  await loadWeek();

  await loadMenu();

}


/* =========================================================
   MINGGU SEBELUMNYA
========================================================= */

const prevWeek =
  document.getElementById(
    "prevWeek"
  );


if (prevWeek) {

  prevWeek.onclick = async () => {

    const newWeek =
      new Date(weekStart);


    newWeek.setDate(
      newWeek.getDate() - 7
    );


    weekStart =
      newWeek;


    /*
       Setelah pindah minggu,
       otomatis pilih Senin.
    */

    selectedDate =
      toISO(weekStart);


    setURL();


    await render();

  };

}


/* =========================================================
   MINGGU BERIKUTNYA
========================================================= */

const nextWeek =
  document.getElementById(
    "nextWeek"
  );


if (nextWeek) {

  nextWeek.onclick = async () => {

    const newWeek =
      new Date(weekStart);


    newWeek.setDate(
      newWeek.getDate() + 7
    );


    weekStart =
      newWeek;


    /*
       Setelah pindah minggu,
       otomatis pilih Senin.
    */

    selectedDate =
      toISO(weekStart);


    setURL();


    await render();

  };

}


/* =========================================================
   MULAI WEBSITE
========================================================= */

render();
