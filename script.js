/**
 * ASHMETAL666 - Core Website Script (Final Version)
 * Berjalan murni menggunakan Vanilla JavaScript (No Framework, No Library)
 * Optimal untuk Vercel & XtGem
 */

// Ambil path URL saat ini untuk routing halaman
const currentPath = window.location.pathname;

// Muat database JSON terlebih dahulu untuk semua halaman aktif
window.onload = loadAllDatabases;

// Konfigurasi daftar file database JSON (Tanpa properti "img" karena cover dibaca langsung dari MP3)
const dbFiles = [
    'database.json', 'database2.json', 'database3.json', 'database4.json', 'database5.json',
    'database6.json', 'database7.json', 'database8.json', 'database9.json', 'database10.json', 'database11.json'
];

let allSongs = [];
const itemsPerPage = 15;
let currentPage = 1;

// Load seluruh database secara paralel agar performa muat halaman super cepat
async function loadAllDatabases() {
    try {
        const fetchPromises = dbFiles.map(file => fetch(file).then(res => res.ok ? res.json() : []).catch(() => []));
        const results = await Promise.all(fetchPromises);
        allSongs = results.flat(); // Menggabungkan seluruh array JSON menjadi satu
        initApp();
    } catch (err) {
        console.error("Gagal memuat database lagu:", err);
        initApp(); // Tetap inisialisasi agar halaman tidak freeze/stuck jika database kosong
    }
}

// Router Aplikasi untuk menentukan fungsi berdasarkan halaman aktif
function initApp() {
    if (currentPath.includes('play.html')) {
        renderPlayPage();
    } else if (currentPath.includes('sitemap.html')) {
        renderSitemap();
    } else if (currentPath.includes('about.html') || currentPath.includes('request.html')) {
        // Halaman statis murni tidak membutuhkan fungsi tambahan
    } else {
        // Default beranda (index / /)
        setupSearch();
        renderSongs(allSongs, currentPage);
        setupPagination(allSongs);
    }
}

// Menampilkan daftar lagu di halaman utama (Index)
function renderSongs(songs, page) {
    const listContainer = document.getElementById('songList');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    if (songs.length === 0) {
        listContainer.innerHTML = '<p style="text-align:center;padding:20px;color:#aaa;">Lagu tidak ditemukan.</p>';
        return;
    }

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedItems = songs.slice(start, end);

    paginatedItems.forEach(song => {
        const encodedParam = encodeURIComponent(JSON.stringify(song));
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
                <div class="song-actions">
                    <a href="play.html?data=${encodedParam}" class="btn btn-play">PLAY</a>
                    <a href="${song.src}" class="btn btn-dl" download="${song.artist} - ${song.title}.mp3">DOWNLOAD</a>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// Fitur Pencarian Instan berbasis Judul Lagu dan Nama Band
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        currentPage = 1; // Reset ke halaman 1 saat mengetik kata kunci
        const filtered = allSongs.filter(song => 
            song.title.toLowerCase().includes(query) || 
            song.artist.toLowerCase().includes(query)
        );
        renderSongs(filtered, currentPage);
        setupPagination(filtered);
    });
}

// Logika Navigasi Pagination Otomatis (Maksimal menampilkan 5 tombol nomor halaman)
function setupPagination(songs) {
    const pgnContainer = document.getElementById('pagination');
    if (!pgnContainer) return;
    pgnContainer.innerHTML = '';

    const totalPages = Math.ceil(songs.length / itemsPerPage);
    if (totalPages <= 1) return;

    // Tombol Previous
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; renderSongs(songs, currentPage); setupPagination(songs); window.scrollTo(0,0); };
    pgnContainer.appendChild(prevBtn);

    // Hitung rentang nomor halaman agar maksimal hanya menampilkan 5 tombol nomor
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        if (i === currentPage) btn.className = 'active';
        btn.onclick = () => { currentPage = i; renderSongs(songs, currentPage); setupPagination(songs); window.scrollTo(0,0); };
        pgnContainer.appendChild(btn);
    }

    // Tombol Next
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { currentPage++; renderSongs(songs, currentPage); setupPagination(songs); window.scrollTo(0,0); };
    pgnContainer.appendChild(nextBtn);
}

// Mengatur Konten Halaman Play & Ekstraksi Gambar Cover Langsung dari File MP3
function renderPlayPage() {
    const params = new URLSearchParams(window.location.search);
    const dataStr = params.get('data');
    if (!dataStr) return;
    
    try {
        const song = JSON.parse(decodeURIComponent(dataStr));
        
        // Atur Judul Halaman dan Elemen HTML secara Dinamis
        document.title = `Download Lagu ${song.artist} - ${song.title} MP3 | ASHMETAL666`;
        document.getElementById('h1Title').textContent = `${song.artist} - ${song.title}`;
        document.getElementById('audioPlayer').src = song.src;
        
        // Tombol Download langsung mengarah ke file asli Dropbox (Tanpa cek.html)
        const dlBtn = document.getElementById('btnDlDirect');
        dlBtn.href = song.src;
        dlBtn.setAttribute('download', `${song.artist} - ${song.title}.mp3`);
        
        // Fitur Copy Link Share
        document.getElementById('btnCopyLink').onclick = () => {
            navigator.clipboard.writeText(window.location.href);
            alert('Link lagu berhasil disalin ke papan klip!');
        };

        // --- PROSES PARSING BINER ID3 TAG: AMBIL COVER ART DARI FILE MP3 ---
        const targetImg = document.getElementById('songImg');
        targetImg.alt = `${song.artist} - ${song.title}`;

        // Mengambil rentang bita awal file MP3 (128KB pertama cukup untuk mencari header gambar)
        fetch(song.src, { headers: { 'Range': 'bytes=0-131072' } })
            .then(response => {
                if (!response.ok) throw new Error('Range request ditolak, muat penuh...');
                return response.arrayBuffer();
            })
            .catch(() => fetch(song.src).then(res => res.arrayBuffer())) // Fallback
            .then(buffer => {
                const view = new DataView(buffer);
                // Validasi header ID3v2 murni ("ID3")
                if (view.getUint8(0) === 0x49 && view.getUint8(1) === 0x44 && view.getUint8(2) === 0x33) {
                    let offset = 10;
                    while (offset < buffer.byteLength - 10) {
                        // Cari Frame ID "APIC" (Attached Picture)
                        if (view.getUint8(offset) === 0x41 && view.getUint8(offset+1) === 0x50 && view.getUint8(offset+2) === 0x49 && view.getUint8(offset+3) === 0x43) {
                            const frameSize = view.getUint32(offset + 4);
                            let pOffset = offset + 10;
                            
                            // Scan Magic Number untuk format JPEG (FF D8) atau PNG (89 50)
                            while (pOffset < offset + 10 + frameSize) {
                                if ((view.getUint8(pOffset) === 0xFF && view.getUint8(pOffset+1) === 0xD8) || 
                                    (view.getUint8(pOffset) === 0x89 && view.getUint8(pOffset+1) === 0x50)) {
                                    
                                    const imgBuffer = buffer.slice(pOffset, offset + 10 + frameSize);
                                    const blob = new Blob([imgBuffer], { type: "image/jpeg" });
                                    targetImg.src = URL.createObjectURL(blob);
                                    return; // Selesai, gambar ditemukan
                                }
                                pOffset++;
                            }
                        }
                        offset++;
                    }
                }
                // Jika MP3 tidak memiliki cover art tersemat, beri fallback background gelap tema metal
                targetImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3C/svg%3E";
            })
            .catch(() => {
                targetImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3C/svg%3E";
            });
        // ------------------------------------------------------------------

        // Injeksi JSON-LD Schema untuk MusicRecording
        const schema = {
            "@context": "https://schema.org",
            "@type": "MusicRecording",
            "name": song.title,
            "byArtist": { "@type": "MusicGroup", "name": song.artist },
            "url": window.location.href
        };
        const scriptSchema = document.createElement('script');
        scriptSchema.type = 'application/ld+json';
        scriptSchema.text = JSON.stringify(schema);
        document.head.appendChild(scriptSchema);

        // Menampilkan 10 Lagu Terkait Secara Acak (Tanpa thumbnail img untuk efisiensi data)
        if (allSongs.length > 0) {
            const shuffled = [...allSongs].sort(() => 0.5 - Math.random());
            const related = shuffled.filter(s => s.title !== song.title).slice(0, 10);
            const relatedContainer = document.getElementById('relatedSongs');
            if(relatedContainer) {
                relatedContainer.innerHTML = '';
                related.forEach(s => {
                    const enc = encodeURIComponent(JSON.stringify(s));
                    const item = document.createElement('div');
                    item.className = 'song-card';
                    item.innerHTML = `
                        <div class="song-info">
                            <div class="song-title">${s.title}</div>
                            <div class="song-artist">${s.artist}</div>
                            <div class="song-actions"><a href="play.html?data=${enc}" class="btn btn-play">PLAY</a></div>
                        </div>
                    `;
                    relatedContainer.appendChild(item);
                });
            }
        }
    } catch (e) {
        console.error("Gagal memproses data lagu di halaman play:", e);
    }
}

// Mengisi Daftar Link Otomatis pada Halaman Sitemap HTML
function renderSitemap() {
    const container = document.getElementById('sitemapLinks');
    if(!container) return;
    container.innerHTML = '';
    allSongs.forEach(song => {
        const enc = encodeURIComponent(JSON.stringify(song));
        const li = document.createElement('li');
        li.style.margin = "8px 0";
        li.innerHTML = `<a href="play.html?data=${enc}" target="_blank">${song.artist} - ${song.title}</a>`;
        container.appendChild(li);
    });
}
