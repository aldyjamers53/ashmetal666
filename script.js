/**
 * ASHMETAL666 - Core Website Script (Full Stable Version)
 * Berjalan murni menggunakan Vanilla JavaScript (No Framework, No Library)
 * Optimal untuk XtGem & Vercel
 */

// Ambil path URL saat ini untuk routing halaman
const currentPath = window.location.pathname;

// Fungsi bantuan untuk membuat ID/Slug URL yang bersih (contoh: nama-artis-judul-lagu)
function createSlug(artist, title) {
    const rawString = `${artist}-${title}`;
    return rawString.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Semua halaman sekarang wajib memuat database JSON terlebih dahulu 
// agar bisa mencocokkan ID lagu dari URL dengan data aslinya.
window.onload = loadAllDatabases;

// Konfigurasi daftar file database JSON
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
    } else if (currentPath.includes('cek.html')) {
        handleDownloadCountdown(); // Dipindah ke sini agar database dimuat lebih dulu
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

// Menampilkan daftar lagu ke DOM dengan sistem Lazy Loading Gambar
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
        // Menggunakan slug ID alih-alih JSON.stringify panjang
        const songId = createSlug(song.artist, song.title);
        
        const card = document.createElement('div');
        card.className = 'song-card';
        card.innerHTML = `
            <img class="song-thumb" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" data-src="${song.img}" alt="${song.artist} - ${song.title}" loading="lazy">
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist}</div>
                <div class="song-actions">
                    <a href="play.html?id=${songId}" class="btn btn-play">PLAY</a>
                    <a href="cek.html?id=${songId}" class="btn btn-dl">DOWNLOAD</a>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
    lazyLoadImages();
}

// Fitur Pencarian Instan berbasis Judul Lagu dan Nama Band
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        currentPage = 1; 
        const filtered = allSongs.filter(song => 
            song.title.toLowerCase().includes(query) || 
            song.artist.toLowerCase().includes(query)
        );
        renderSongs(filtered, currentPage);
        setupPagination(filtered);
    });
}

// Logika Navigasi Pagination Otomatis
function setupPagination(songs) {
    const pgnContainer = document.getElementById('pagination');
    if (!pgnContainer) return;
    pgnContainer.innerHTML = '';

    const totalPages = Math.ceil(songs.length / itemsPerPage);
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { currentPage--; renderSongs(songs, currentPage); setupPagination(songs); window.scrollTo(0,0); };
    pgnContainer.appendChild(prevBtn);

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

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { currentPage++; renderSongs(songs, currentPage); setupPagination(songs); window.scrollTo(0,0); };
    pgnContainer.appendChild(nextBtn);
}

// Mengatur Konten Halaman Play & Injeksi Otomatis Metadata SEO
function renderPlayPage() {
    const params = new URLSearchParams(window.location.search);
    const songId = params.get('id'); // Mengambil ID dari URL
    if (!songId) return;
    
    try {
        // Mencari data lagu di database menggunakan ID
        const song = allSongs.find(s => createSlug(s.artist, s.title) === songId);
        
        if (!song) {
            document.getElementById('h1Title').textContent = "Lagu tidak ditemukan";
            return;
        }

        document.title = `Download Lagu ${song.artist} - ${song.title} MP3 | ASHMETAL666`;
        document.getElementById('h1Title').textContent = `${song.artist} - ${song.title}`;
        document.getElementById('songImg').src = song.img || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='100%25' height='100%25' fill='%23222'/%3E%3C/svg%3E";
        document.getElementById('songImg').alt = `${song.artist} - ${song.title}`;
        document.getElementById('audioPlayer').src = song.src;
        
        // Link download sekarang juga mengirimkan ID, bukan JSON
        document.getElementById('btnDlDirect').href = `cek.html?id=${songId}`;
        
        document.getElementById('btnCopyLink').onclick = () => {
            navigator.clipboard.writeText(window.location.href);
            alert('Link lagu berhasil disalin ke papan klip!');
        };

        const schema = {
            "@context": "https://schema.org",
            "@type": "MusicRecording",
            "name": song.title,
            "byArtist": { "@type": "MusicGroup", "name": song.artist },
            "image": song.img,
            "url": window.location.href
        };
        const scriptSchema = document.createElement('script');
        scriptSchema.type = 'application/ld+json';
        scriptSchema.text = JSON.stringify(schema);
        document.head.appendChild(scriptSchema);

        if (allSongs.length > 0) {
            const shuffled = [...allSongs].sort(() => 0.5 - Math.random());
            const related = shuffled.filter(s => s.title !== song.title).slice(0, 10);
            const relatedContainer = document.getElementById('relatedSongs');
            if(relatedContainer) {
                relatedContainer.innerHTML = '';
                related.forEach(s => {
                    const relatedId = createSlug(s.artist, s.title);
                    const item = document.createElement('div');
                    item.className = 'song-card';
                    item.innerHTML = `
                        <img class="song-thumb" src="${s.img || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E'}" alt="${s.artist} - ${s.title}" loading="lazy">
                        <div class="song-info">
                            <div class="song-title">${s.title}</div>
                            <div class="song-artist">${s.artist}</div>
                            <div class="song-actions"><a href="play.html?id=${relatedId}" class="btn btn-play">PLAY</a></div>
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

// Sistem Hitung Mundur 5 Detik Halaman Download `cek.html`
function handleDownloadCountdown() {
    const params = new URLSearchParams(window.location.search);
    const songId = params.get('id'); // Ambil ID lagu
    if (!songId) return;
    
    try {
        // Cari URL asli download di database
        const song = allSongs.find(s => createSlug(s.artist, s.title) === songId);
        if (!song) return;

        let count = 5;
        const countEl = document.getElementById('countdown');
        const fallbackEl = document.getElementById('fallbackZone');

        if(fallbackEl) {
            fallbackEl.innerHTML = `<a href="${song.src}" class="btn btn-play btn-large">Download Now</a>`;
        }

        const timer = setInterval(() => {
            count--;
            if (countEl) countEl.textContent = count;
            if (count <= 0) {
                clearInterval(timer);
                window.location.href = song.src;
            }
        }, 1000);
    } catch(e) {
        console.error("Gagal mengeksekusi hitung mundur:", e);
    }
}

// Mengisi Daftar Link Otomatis pada Halaman Sitemap HTML
function renderSitemap() {
    const container = document.getElementById('sitemapLinks');
    if(!container) return;
    container.innerHTML = '';
    allSongs.forEach(song => {
        const songId = createSlug(song.artist, song.title);
        const li = document.createElement('li');
        li.style.margin = "8px 0";
        li.innerHTML = `<a href="play.html?id=${songId}" target="_blank">${song.artist} - ${song.title}</a>`;
        container.appendChild(li);
    });
}

// Fungsi Internal Efisiensi Memori: Lazy Loading Gambar
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.getAttribute('data-src');
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });
        images.forEach(img => obs.observe(img));
    } else {
        images.forEach(img => img.src = img.getAttribute('data-src'));
    }
}
