const fs = require('fs');
const path = require('path');

// Daftar seluruh file database kamu saat ini
const dbFiles = [
    'database.json', 'database2.json', 'database3.json', 'database4.json', 'database5.json',
    'database6.json', 'database7.json', 'database8.json', 'database9.json', 'database10.json', 'database11.json'
];

let allSongs = [];

// Membaca seluruh file database jika ada isinya
dbFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        try {
            const rawData = fs.readFileSync(filePath, 'utf8');
            if (rawData.trim()) {
                // Bersihkan koma menggantung di ujung array sebelum di-parse jika ada
                let cleanData = rawData.trim();
                if (cleanData.endsWith(',')) cleanData = cleanData.slice(0, -1);
                if (!cleanData.startsWith('[')) cleanData = '[' + cleanData + ']';
                
                const songs = JSON.parse(cleanData);
                allSongs = allSongs.concat(songs);
            }
        } catch (e) {
            console.log(`Skip atau gagal membaca file: ${file}`);
        }
    }
});

const hariIni = new Date().toISOString().split('T')[0];

// Mulai merakit struktur XML murni yang disukai Google Webmaster
let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

// 1. Daftarkan Halaman Statis Utama
const staticPages = ['/', '/about.html', '/request.html'];
staticPages.forEach(page => {
    xml += `  <url>\n    <loc>https://ashmetal666.vercel.app${page}</loc>\n    <lastmod>${hariIni}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>${page === '/' ? '1.0' : '0.5'}</priority>\n  </url>\n`;
});

// 2. Daftarkan Seluruh Lagu Secara Otomatis dari Hasil Gabungan Database
allSongs.forEach(song => {
    const encodedData = encodeURIComponent(JSON.stringify(song));
    // Validasi karakter khusus XML (&, <, >, ", ') agar tidak merusak pembacaan sitemap oleh Google Bot
    const safeUrl = `https://ashmetal666.vercel.app/play.html?data=${encodedData}`
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    xml += `  <url>\n    <loc>${safeUrl}</loc>\n    <lastmod>${hariIni}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
});

xml += `</urlset>`;

// Tulis langsung hasilnya menjadi file sitemap.xml fisik sebelum server Vercel online
fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), xml);
console.log(`Sukses! sitemap.xml otomatis dibuat dengan total ${allSongs.length} link lagu.`);
