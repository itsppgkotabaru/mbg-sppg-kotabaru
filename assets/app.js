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


/* =====================================================
   CEK CONFIG SUPABASE
===================================================== */

if (
  !window.SUPABASE_URL ||
  window.SUPABASE_URL.startsWith("PASTE_")
) {
  document.getElementById("emptyState").style.display = "block";

  document.getElementById("emptyText").textContent =
    "Konfigurasi Supabase belum diisi. Silakan ikuti README.";

  throw new Error("Konfigurasi Supabase belum diisi.");
}


const sb = window.supabase.createClient(
  window.SUPABASE_URL,
  window.SUPABASE_ANON_KEY
);


/* =====================================================
   TANGGAL REAL WIB
===================================================== */

function todayWIB() {

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const get = (type) => {

    const item = parts.find(
      part => part.type === type
    );

    return item ? item.value : "";
  };

  return `${get("year")}-${get("month")}-${get("day")}`;
}


/* =====================================================
   KONVERSI TANGGAL
===================================================== */

function parseISO(value) {

  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}


function toISO(date) {

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}


function fmtDate(value) {

  const date = parseISO(value);

  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}


/* =====================================================
   TANGGAL DARI URL
===================================================== */

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


/* =====================================================
   TANGGAL AWAL
===================================================== */

let selectedDate =
  urlDate || todayWIB();


/* =====================================================
   SET URL
===================================================== */

function setURL() {

  history.replaceState(
    null,
    "",
    `?date=${selectedDate}`
  );
}


/* =====================================================
   ESCAPE HTML
===================================================== */

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


/* =====================================================
   BUAT TANGGAL MENU
===================================================== */

/*
   LAPTOP / DESKTOP
   =================

   Tetap menggunakan sistem lama:

   Minggu:
   Minggu - Jumat

   Senin:
   Senin - Jumat

   Selasa:
   Selasa - Jumat

   Rabu:
   Rabu - Jumat

   Kamis:
   Kamis - Jumat

   Jumat:
   Jumat

   Sabtu:
   Senin - Jumat minggu berikutnya


   HP / MOBILE
   ===========

   Menampilkan tanggal:

   6 hari sebelumnya
   sampai
   12 hari sesudah hari ini

   Tujuannya agar HP dapat digeser:

   ← ke tanggal sebelumnya

   dan

   → ke tanggal berikutnya
*/


function getCurrentMenuDates() {

  const today =
    parseISO(todayWIB());

  const day =
    today.getDay();

  const dates = [];


  /* ===================================================
     HP / MOBILE
  =================================================== */

  if (window.innerWidth <= 700) {

    /*
       6 hari sebelum hari ini
       sampai 12 hari setelah hari ini
    */

    for (let i = -6; i <= 12; i++) {

      const date =
        new Date(today);

      date.setDate(
        today.getDate() + i
      );

      dates.push(
        toISO(date)
      );
    }

    return dates;
  }


  /* ===================================================
     LAPTOP / DESKTOP
  =================================================== */

  /*
     Jika Minggu:
     tampilkan Minggu + Senin-Jumat
  */

  if (day === 0) {

    for (let i = 0; i <= 5; i++) {

      const date =
        new Date(today);

      date.setDate(
        today.getDate() + i
      );

      dates.push(
        toISO(date)
      );
    }

    return dates;
  }


  /*
     Jika Senin-Jumat:
     tampilkan hari ini sampai Jumat
  */

  if (day >= 1 && day <= 5) {

    const daysUntilFriday =
      5 - day;

    for (
      let i = 0;
      i <= daysUntilFriday;
      i++
    ) {

      const date =
        new Date(today);

      date.setDate(
        today.getDate() + i
      );

      dates.push(
        toISO(date)
      );
    }

    return dates;
  }


  /*
     Jika Sabtu:
     tampilkan minggu berikutnya
     mulai Senin sampai Jumat
  */

  const daysUntilMonday = 2;

  const monday =
    new Date(today);

  monday.setDate(
    today.getDate() + daysUntilMonday
  );


  for (let i = 0; i < 5; i++) {

    const date =
      new Date(monday);

    date.setDate(
      monday.getDate() + i
    );

    dates.push(
      toISO(date)
    );
  }


  return dates;
}


/* =====================================================
   LOAD MENU MINGGU INI
===================================================== */

async function loadWeek() {

  /*
     Selalu hitung berdasarkan
     tanggal REAL sekarang.
  */

  const dates =
    getCurrentMenuDates();


  const weeklyButtons =
    document.getElementById(
      "weeklyButtons"
    );


  if (!weeklyButtons) {

    console.error(
      "Elemen weeklyButtons tidak ditemukan."
    );

    return;
  }


  /* ===================================================
     TAMPILKAN KARTU TANGGAL
  =================================================== */

  weeklyButtons.innerHTML =
    dates
      .map(dateString => {

        const date =
          parseISO(dateString);


        const active =
          dateString === selectedDate
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


  /* ===================================================
     EVENT KLIK TANGGAL
  =================================================== */

  document
    .querySelectorAll(".day-button")
    .forEach(button => {

      button.onclick = async () => {

        selectedDate =
          button.dataset.date;


        setURL();


        /*
           Update kartu aktif
        */

        document
          .querySelectorAll(".day-button")
          .forEach(btn => {

            btn.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );


        /*
           Tampilkan menu
        */

        await loadMenu();

      };

    });


  /* ===================================================
     POSISI AWAL HP
  =================================================== */

  /*
     Pada HP, setelah semua tanggal dibuat,
     geser otomatis ke tanggal aktif.

     Jadi tanggal hari ini tetap terlihat
     saat halaman pertama kali dibuka.

     Tanggal sebelumnya tetap bisa dilihat
     dengan geser ke kiri.

     Tanggal berikutnya tetap bisa dilihat
     dengan geser ke kanan.
  */

  if (window.innerWidth <= 700) {

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


/* =====================================================
   LOAD MENU HARIAN
===================================================== */

async function loadMenu() {

  const date =
    parseISO(selectedDate);


  /* ===================================================
     NAMA HARI
  =================================================== */

  const dayName =
    document.getElementById(
      "dayName"
    );


  if (dayName) {

    dayName.textContent =
      labels[date.getDay()];

  }


  /* ===================================================
     TANGGAL LENGKAP
  =================================================== */

  const displayDate =
    document.getElementById(
      "displayDate"
    );


  if (displayDate) {

    displayDate.textContent =
      fmtDate(selectedDate);

  }


  /* ===================================================
     CAPTION FOTO
  =================================================== */

  const photoCaption =
    document.getElementById(
      "photoCaption"
    );


  if (photoCaption) {

    photoCaption.textContent =
      `MENU ${labels[date.getDay()].toUpperCase()}`;

  }


  /* ===================================================
     AMBIL MENU DARI SUPABASE
  =================================================== */

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


  /* ===================================================
     ERROR SUPABASE
  =================================================== */

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


  /* ===================================================
     FOTO
  =================================================== */

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
        "flex";
    }
  }


  /* ===================================================
     MENU BELUM ADA
  =================================================== */

  if (!menu) {

    showEmpty(
      `Data menu untuk tanggal ${fmtDate(selectedDate)} belum dimasukkan oleh Admin.`
    );

    return;
  }


  /* ===================================================
     TAMPILKAN MENU
  =================================================== */

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


  /* ===================================================
     JUDUL
  =================================================== */

  const menuTitle =
    document.getElementById(
      "menuTitle"
    );


  if (menuTitle) {

    menuTitle.textContent =
      menu.menu_title ||
      "Paket Makan Bergizi Gratis";
  }


  /* ===================================================
     DESKRIPSI
  =================================================== */

  const menuDescription =
    document.getElementById(
      "menuDescription"
    );


  if (menuDescription) {

    menuDescription.textContent =
      menu.menu_description || "";
  }


  /* ===================================================
     ISI OMPRANG
  =================================================== */

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


  /* ===================================================
     NUTRISI
  =================================================== */

  const nutritionRows = [

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
                ${esc(menu[row[2]] ?? "-")}
              </td>

              <td>
                ${esc(menu[row[3]] ?? "-")}
              </td>

            </tr>
          `;

        })
        .join("");
  }

}


/* =====================================================
   EMPTY STATE
===================================================== */

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


/* =====================================================
   RENDER
===================================================== */

async function render() {

  /*
     Setiap kali halaman dimuat,
     tanggal menu ditentukan dari
     tanggal REAL WIB.
  */

  const realToday =
    todayWIB();


  /*
     Kalau tidak ada ?date=
     gunakan tanggal real hari ini.
  */

  if (!urlDate) {

    selectedDate =
      realToday;
  }


  /*
     Load tombol tanggal
  */

  await loadWeek();


  /*
     Load menu hari ini / tanggal terpilih
  */

  await loadMenu();
}


/* =====================================================
   MULAI
===================================================== */

render();
