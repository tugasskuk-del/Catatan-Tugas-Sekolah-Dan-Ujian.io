# Catat Tugas — Web App

Aplikasi pencatat tugas sekolah berbasis HTML/CSS/JavaScript + Bootstrap.

## Fitur
- Login lokal (demo: `admin` / `admin123`)
- Tambah, edit, hapus tugas
- Status **✓ Sudah Dikerjakan** / **× Belum Dikerjakan**
- Upload dan preview foto tugas (maks. 2 MB per foto)
- Data: nama, kelas, jurusan, mata pelajaran, judul tugas, deadline, catatan
- Dashboard statistik dan progress
- Pencarian dan filter status
- Responsive untuk HP/laptop
- Tanpa database/backend
- Data disimpan dengan `localStorage` browser

## Struktur
- `index.html` — halaman login
- `dashboard.html` — aplikasi utama
- `style.css` — tampilan hitam putih
- `script.js` — login, CRUD, status, localStorage

## Login demo
Username: `admin`
Password: `admin123`

## Hosting GitHub Pages
1. Buat repository baru di GitHub.
2. Upload semua file di folder ini ke repository.
3. Masuk `Settings` → `Pages`.
4. Pilih `Deploy from a branch`, branch `main`, folder `/ (root)`.
5. Simpan dan tunggu GitHub Pages membuat alamat website.

## Catatan keamanan
Login ini hanya untuk kebutuhan aplikasi sekolah/demo. Karena tidak memakai server/database, username/password berada di JavaScript dan bukan autentikasi aman untuk data sensitif.

## Template
Struktur dashboard menggunakan pendekatan/layout Bootstrap admin yang diadaptasi dari **Start Bootstrap SB Admin**, yang tercantum sebagai template gratis berlisensi MIT:
https://startbootstrap.com/template/sb-admin
