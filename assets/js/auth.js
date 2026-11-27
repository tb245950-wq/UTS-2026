// ==========================================
// SIAKAD - AUTHENTICATION SYSTEM
// ==========================================

// Nama key penyimpanan session
const SESSION_KEY = "siakad_session";

// Mengambil elemen form login
const loginForm = document.getElementById("loginForm");

// Memastikan form login tersedia
if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        // Mencegah pengiriman form bawaan browser
        event.preventDefault();

        // Mengambil nilai input
        const email = document
            .getElementById("email")
            .value.trim();

        const password = document
            .getElementById("password")
            .value;

        const message = document
            .getElementById("loginMessage");

        // Mengambil data dosen dari database
        const lecturers = DB.getAll("lecturers");

        // Mencocokkan email dan password
        const user = lecturers.find(function (lecturer) {

            return lecturer.email === email &&
                   lecturer.password === password;

        });

        // Jika akun tidak ditemukan
        if (!user) {

            message.innerHTML = `
                <div class="alert alert-danger">
                    Email atau password salah!
                </div>
            `;

            return;
        }

        // Membuat session pengguna
        const session = {
            id: user.id,
            email: user.email,
            homebase_id: user.homebase_id
        };

        // Menyimpan session
        sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify(session)
        );

        // Mengarahkan pengguna ke dashboard
        window.location.replace("dashboard.html");

    });
}


// ==========================================
// GET SESSION
// Mengambil session pengguna
// ==========================================

function getSession() {

    const session = sessionStorage.getItem(SESSION_KEY);

    return session ? JSON.parse(session) : null;
}


// ==========================================
// CHECK LOGIN
// Memeriksa apakah pengguna sudah login
// ==========================================

function isLoggedIn() {

    return getSession() !== null;
}


// ==========================================
// REQUIRE AUTH
// Membatasi akses halaman secara simulasi
// ==========================================

function requireAuth(loginPath = "index.html") {

    if (!isLoggedIn()) {

        window.location.replace(loginPath);

    }
}


// ==========================================
// LOGOUT
// Menghapus session pengguna
// ==========================================

function logout(loginPath = "index.html") {

    sessionStorage.removeItem(SESSION_KEY);

    window.location.replace(loginPath);
}