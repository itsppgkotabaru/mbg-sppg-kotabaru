MBG SPPG POLRES BREBES KOTABARU — GITHUB + SUPABASE

Paket ini menggantikan PHP/MySQL dengan GitHub Pages + Supabase.

1. Buat project di https://supabase.com/
2. Supabase → SQL Editor → jalankan seluruh isi supabase.sql.
3. Supabase → Authentication → Users → buat akun Admin (email + password).
4. Salin assets/config.example.js menjadi assets/config.js.
5. Isi SUPABASE_URL dan SUPABASE_ANON_KEY memakai Project URL dan Publishable/anon key.
6. Upload seluruh isi paket ke repository GitHub.
7. Aktifkan GitHub Pages; index.html harus di root.
8. Publik: URL GitHub Pages Anda.
9. Admin: URL GitHub Pages Anda/login.html

Fitur:
- Menu per tanggal, tidak saling menimpa.
- Senin–Jumat dalam satu baris.
- Navigasi minggu sebelumnya/berikutnya.
- Foto mengikuti tanggal.
- Login Admin Supabase.
- Upload JPG/PNG/WebP maksimal 5 MB.
- Halaman publik tidak menampilkan tombol Admin.
- Tidak membutuhkan PHP atau MySQL.

KEAMANAN:
Jangan pernah memasukkan service_role/secret key ke GitHub. Gunakan Publishable/anon key pada config.js. RLS pada supabase.sql harus tetap aktif.

Catatan foto: foto lama tidak otomatis dihapus saat foto baru diunggah, sehingga Storage dapat berisi file lama. File lama dapat dibersihkan secara berkala dari Supabase Storage.
