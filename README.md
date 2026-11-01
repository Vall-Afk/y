<div align="center">

# ✦ Beauté. ✦
### WhatsApp Multi-Device Bot — Legacy × Modern

**Legacy Complete Roadmap · Version 1.3.0**

**Tanpa prefix · Free & Premium · Bahasa Indonesia & English · Jadibot 1 Sesi**

[**🔗 LINK SCRIPT BEAUTÉ.**](https://github.com/Vall-Afk/y/tree/feature/beaute-legacy-modern) · [**GitHub Repository**](https://github.com/Vall-Afk/y) · [**Status Migrasi**](FEATURES.md) · [**Audit Legacy**](LEGACY_AUDIT.md)

</div>

---

## ♛ Credits / Kredit

| Identitas | Nama / Akun |
|---|---|
| Nama / Name | **Vall** |
| Owner BOT | **Vall** — WhatsApp: 6287721373781 |
| Recoder | **Vall** |
| Owner source code versi modifikasi | **Vall-Afk** |
| GitHub | **[@Vall-Afk](https://github.com/Vall-Afk)** |
| Instagram | **[@v4lonenonly](https://www.instagram.com/v4lonenonly/)** |
| Nama bot | **Beauté.** |
| Source / Script | **https://github.com/Vall-Afk/y** |

### ♡ Thanks To
- **Tritunggal Mahakudus**
- **Orang Tua**
- **Keluarga**
- **Saya sendiri**

**Original project attribution:** kode legacy dalam repository berasal dari proyek terdahulu termasuk **Haruka-Md / ZeeoneOfc**, sebagaimana disebutkan README dan package source v9.1. Beauté. ini adalah *recode/pengembangan versi modifikasi* oleh Vall, bukan klaim kepemilikan atas karya kontributor asal. Hak cipta, lisensi, dan pemberitahuan atribusi karya pihak lain tetap harus dihormati.

---

## 📦 Link Script

**GitHub:** https://github.com/Vall-Afk/y

**Versi pengembangan Beauté. (fitur terbaru):**
https://github.com/Vall-Afk/y/tree/feature/beaute-legacy-modern

**Buka / unduh source melalui GitHub** menggunakan tautan di atas (menu **Code → Download ZIP**) atau Git clone. Branch default v9.1 berisi source lama dan **belum** otomatis menerima perubahan di branch pengembangan. Gunakan branch yang tertulis di atas jika ingin menjalankan Beauté. versi ini.

> **Penting:** Legacy Complete adalah *roadmap migrasi*, belum berarti 428 command lama sudah sepenuhnya berfungsi. Periksa daftar yang sudah aktif di FEATURES.md dan hasil audit di LEGACY_AUDIT.md.

## ⚙️ Persyaratan / Requirements

- **Windows PowerShell atau Command Prompt** (tersedia juga pada OS lain yang mendukung Node.js).
- **Node.js 22 atau lebih baru**, dan **Git**.
- Akun WhatsApp yang kamu kendalikan untuk pairing bot utama.
- Koneksi internet aktif. Terminal harus tetap berjalan supaya bot merespons.
- Akun WhatsApp **kedua yang berbeda** bila ingin menguji Jadibot.

> Di PowerShell gunakan **npm.cmd**, bukan npm. Tidak perlu mengubah kebijakan keamanan eksekusi PowerShell.

## 🚀 Cara install baru — Windows PowerShell

Buka PowerShell, kemudian:

~~~powershell
git clone --branch feature/beaute-legacy-modern https://github.com/Vall-Afk/y.git
cd y
Copy-Item .env.example .env
notepad .env
~~~

Isi file .env dengan identitas yang benar; contoh:

~~~dotenv
OWNER_NUMBER=6287721373781
OWNER_NAME=Vall
OWNER_INSTAGRAM=v4lonenonly
BOT_NAME=Beauté.
PREFIX=!
~~~

Kemudian jalankan:

~~~powershell
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd audit --omit=dev
npm.cmd start
~~~

Pada koneksi pertama, pindai QR utama di terminal dari **WhatsApp → Perangkat tertaut → Tautkan perangkat**. Bila sesi utama sudah ada dan valid, bot akan menggunakan sesi tersebut tanpa perlu pairing ulang.

## 🔄 Update untuk instalasi yang sudah berhasil — D:\y

**Hentikan bot dengan Ctrl+C** terlebih dahulu. Di PowerShell:

~~~powershell
Set-Location D:\y
git status --short
git switch feature/beaute-legacy-modern
git fetch origin
git pull --ff-only origin feature/beaute-legacy-modern
npm.cmd install
npm.cmd test
npm.cmd run check
npm.cmd audit --omit=dev
npm.cmd start
~~~

Jika ada perubahan lokal yang belum disimpan, selesaikan terlebih dahulu agar git pull tidak berbenturan. Jangan pernah menghapus **.env**, **data/auth**, atau database di **data/** untuk sekadar update. Folder tersebut berisi login serta data pengguna. Pastikan tidak ada proses bot lain yang membuka sesi yang sama.

## ✨ Menu dan fitur Free vs Premium

Ketik **menu** melalui chat ke Beauté. Menu menampilkan **FITUR GRATIS / FREE FEATURES**, **PREMIUM EXCLUSIVE**, dan **KHUSUS OWNER / OWNER ONLY** dengan pemisahan jelas.

| FREE — Gratis | PREMIUM — Berbayar/akses admin |
|---|---|
| Menu, status, owner, ganti bahasa, AFK | **Jadibot via pairing code** |
| Manajemen grup dan welcome/left untuk admin | **Jadibot via QR** |
| Daftar toko grup: list, addlist, update, dellist | **1 slot Jadibot tambahan GLOBAL** untuk semua premium |
| Status pesanan proses/done di grup | **Kuota command network yang didukung tanpa batas harian** |
| Tools, hitungan, konverter stiker & TTP/SMEME | Sesi terpisah dari akun bot utama |
| RPG, game, ekonomi virtual, daily, balance | Premium dapat dikelola HANYA oleh owner bot |
| Wiki, cuaca, GitHub / Gitclone (kuota network free berlaku) | Perpanjangan dengan addpremium oleh owner |

**Free**: fitur lookup/API publik tertentu memiliki kuota harian (saat ini 20 + tambahan limit yang dibeli menggunakan koin virtual). **Premium**: tidak dikenai kuota harian tersebut pada command yang sudah menerapkan batas itu. Pengaturan grup hanya boleh diubah admin grup; perintah owner seperti addpremium tidak pernah otomatis menjadi hak semua pengguna premium.

**Semua perintah tidak perlu prefix**. Contoh: **menu**, **ping**, **inventory**, **daily**, **calc 10+5*2**. Bentuk lama **!menu** tetap berlaku. Bot hanya mengenali *kata pertama yang cocok persis*, bukan percakapan yang kebetulan mengandung kata menu.

### 📚 Perintah cepat

~~~text
menu                  → menu utama (Free / Premium / Owner)
menugroup             → fitur grup
menustore             → katalog toko dan status pesanan
menumedia             → stiker dan media
menurpg               → RPG
menupremium           → Jadibot Premium
menutools             → utilitas dan kalkulator
language en           → gunakan English
bahasa id             → kembali ke Bahasa Indonesia
listbahasa            → pilihan bahasa
~~~

### 🛒 Migrasi fitur Store dari source lama

Di grup, **admin grup** dapat menjalankan:

~~~text
addlist harga | Burger 20k
update harga | Burger 22k
dellist harga
list
list harga
setproses ⏳ Pesanan {order} sedang disiapkan untuk {user}
setdone ✅ Pesanan {order} selesai untuk {user}
delsetproses
delsetdone
~~~

Anggota boleh membaca daftar toko lewat **list** atau **list harga**, tetapi tidak boleh mengubah isinya. Untuk status order, **balas pesan pesanan** lalu admin mengetik **proses** atau **done**. Template mendukung **{order}**, **{user}**, dan **{group}**, dibatasi panjangnya, serta disimpan per grup.

### 🌐 Bahasa Inggris / English Language

~~~text
language en
menu
status
menugroup
inventory
wiki Earth
~~~

**English:** Send **language en** to switch the bot's menu and supported replies into English; send **bahasa id** to switch back. Your selection is saved per user, even after restarting the process. You can also preview the English main menu with **menu en**. Keywords are stable (some command names remain Indonesian for compatibility). Menus, core commands, main group operations, store, economy, tools, AFK and common RPG/game responses have English support; some inherited messages, third-party errors and external content may remain untranslated during subsequent phases.

## 💎 Jadibot Premium — maks. SATU sesi tambahan

Hanya member dengan premium aktif (atau main owner) yang boleh memakai Jadibot. **Batas 1 sesi berlaku global** untuk seluruh pengguna bot, bukan satu sesi per orang. Sesi tambahan berjalan pada proses Node.js yang sama.

1. Owner utama memberi premium (contoh 30 hari):

   ~~~text
   addpremium 6281111111111 30
   ~~~

2. Pengguna premium mengirim **chat pribadi ke bot utama**, bukan ke grup. Pilih salah satu:

   ~~~text
   jadibot 6282222222222
   jadibot qr
   ~~~

   Pada metode pertama bot mengirim *pairing code*. Pada metode kedua bot mengirim gambar QR ke chat pribadi. Scan atau masukkan kode melalui **Perangkat tertaut** milik akun WhatsApp kedua yang memang kamu miliki/kendalikan.

3. Cek atau hentikan sesi:

   ~~~text
   cekjadibot
   stopjadibot
   ~~~

Folder data/auth menyimpan sesi **bot utama**; data/jadibot/auth khusus sesi **Jadibot**. Penghentian Jadibot tidak menghapus auth utama. Ketika premium berakhir, koneksi tambahan ditangguhkan. Akun kedua tidak dapat membuat Jadibot lain.

**Keamanan:** QR dan pairing code adalah kredensial sensitif: jangan kirim kepada orang lain. Hubungkan hanya akun sendiri; cabut perangkat tertaut dari aplikasi WhatsApp jika diperlukan. Live pairing tidak diuji oleh GitHub Actions.

## ✅ Testing dan status migrasi

Setiap pengembangan di branch ini menjalankan unit test Node.js, pemeriksaan sintaks, serta audit dependency via GitHub Actions. Command utama sudah terbukti bekerja oleh penguji lokal; fitur baru (termasuk login Jadibot dengan QR, workflow toko, dan bahasa) tetap harus diuji langsung melalui akun WhatsApp percobaan sebelum merge ke branch stabil.

Fitur downloader TikTok/YouTube/Instagram/MediaFire, fitur search tertentu, animasi video, modul RPG lanjutan, dan sejumlah API berbayar lama **belum diklaim selesai**. Source legacy v9.1 memiliki banyak command dari handler terobfuskasi dan dependency usang; tidak disalin mentah-mentah. Token lama yang pernah terpublikasi perlu dicabut/diganti.

- [Daftar fitur aktual](FEATURES.md)
- [Audit dan roadmap Legacy Complete](LEGACY_AUDIT.md)
- [Draft pengembangan (PR #2)](https://github.com/Vall-Afk/y/pull/2)

---

<div align="center">

**✧ Beauté. · Recode by Vall · GitHub @Vall-Afk · Instagram @v4lonenonly ✧**

*Terima kasih — Tritunggal Mahakudus, Orang Tua, Keluarga, dan Saya sendiri.*

</div>
