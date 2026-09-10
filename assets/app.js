```css
/* =========================================================
   MENU MINGGU INI
========================================================= */

.weekly-menu {
  margin-top: 28px;
  padding: 20px;
  background: #ffffff;
  border: 1px solid #e5eaf2;
  border-radius: 18px;
  box-shadow:
    0 8px 25px rgba(20, 45, 90, .07);
}


/* =========================================================
   JUDUL MENU MINGGU INI
========================================================= */

.section-title {
  margin: 0 0 15px;
  color: #163f91;
  font-size: 18px;
  font-weight: 800;
  text-align: left;
}


/* =========================================================
   NAVIGASI TANGGAL MINGGUAN
========================================================= */

.week-nav {
  display: flex;
  align-items: center;

  gap: 12px;

  width: 100%;
  box-sizing: border-box;

  /* WAJIB agar bisa digeser */
  overflow-x: auto;
  overflow-y: hidden;

  padding: 10px 0 16px;

  scroll-behavior: smooth;

  -webkit-overflow-scrolling: touch;

  /* Hilangkan scrollbar */
  scrollbar-width: none;
}

.week-nav::-webkit-scrollbar {
  display: none;
}


/* =========================================================
   TOMBOL HARI
========================================================= */

.week-nav .day-button {
  flex: 0 0 auto;

  box-sizing: border-box;

  width: 150px;
  min-width: 150px;

  height: 100px;

  border: 1px solid #dce3ed;
  border-radius: 13px;

  background: #f8fafc;

  cursor: pointer;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: center;

  gap: 5px;

  transition: .2s ease;

  color: #344054;

  padding: 10px;
}


/* =========================================================
   NAMA HARI
========================================================= */

.day-button strong {
  display: block;

  font-size: 14px;
  font-weight: 800;

  line-height: 1.1;

  text-align: center;

  white-space: nowrap;
}


/* =========================================================
   ANGKA TANGGAL
========================================================= */

.day-button .date-number {
  display: block;

  font-size: 30px;
  font-weight: 800;

  line-height: 1;

  text-align: center;
}


/* =========================================================
   HOVER
========================================================= */

.day-button:hover {
  border-color: #163f91;

  transform: translateY(-2px);
}


/* =========================================================
   TANGGAL AKTIF
========================================================= */

.day-button.active {
  background: #163f91;

  color: #ffffff;

  border-color: #163f91;

  box-shadow:
    0 6px 16px rgba(22, 63, 145, .25);
}


/* =========================================================
   MOBILE / HP
   TAMPILAN HP TETAP BISA DIGESER
========================================================= */

@media (max-width: 700px) {

  .weekly-menu {
    margin-top: 20px;

    padding: 15px;

    border-radius: 15px;
  }


  .section-title {
    font-size: 18px;

    margin-bottom: 10px;
  }


  .week-nav {

    width: 100%;

    gap: 8px;

    padding: 10px 0 16px;

    overflow-x: auto;
    overflow-y: hidden;

    -webkit-overflow-scrolling: touch;

    scrollbar-width: none;

    scroll-behavior: smooth;
  }


  .week-nav::-webkit-scrollbar {
    display: none;
  }


  /*
     JANGAN dibuat width: 100%.

     Setiap tombol tetap memiliki lebar sehingga
     7 hari dapat digeser kiri-kanan.
  */

  .week-nav .day-button {

    flex: 0 0 150px;

    width: 150px;

    min-width: 150px;

    max-width: 150px;

    height: 90px;

    padding: 8px;
  }


  .day-button strong {

    font-size: 10px;

    line-height: 1.1;

    text-align: center;
  }


  .day-button .date-number {

    font-size: 25px;

    line-height: 1;
  }

}


/* =========================================================
   DESKTOP / LAPTOP
========================================================= */

@media (min-width: 701px) {

  .week-nav {

    overflow-x: auto;
    overflow-y: hidden;

    -webkit-overflow-scrolling: touch;

    scrollbar-width: thin;
  }


  .week-nav .day-button {

    flex: 0 0 150px;

    width: 150px;

    min-width: 150px;

    height: 100px;
  }

}
```
