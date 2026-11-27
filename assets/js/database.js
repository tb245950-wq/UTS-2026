// ==========================================
// SIAKAD - SHARED DATABASE SYSTEM
// Penyimpanan menggunakan LocalStorage
// ==========================================


// 1. NAMA DATABASE
// Nama key untuk menyimpan database di browser.

const DB_KEY = "siakad_database";


// 2. SEED DATA
// Data awal yang dibuat saat aplikasi pertama dijalankan.

const seedData = {

    // Tabel Program Studi
    study_programs: [
        {
            id: 1,
            name: "Rekayasa Keamanan Siber"
        },
        {
            id: 2,
            name: "Sains dData"
        },
        {
            id: 3,
            name: "Rpbotika dan Artificial Intelligence"
        }
    ],

    // Tabel Dosen
    lecturers: [
        {
            id: 1,
            nuptk: "1000000001",
            nik: "3400000000000001",
            email: "dosen@example.com",
            password: "demo123",
            phone_no: "080000000001",
            homebase_id: 1
        }
    ],

    // Tabel Pengurus Program Studi
    study_program_organizers: [
        {
            id: 1,
            lecturer_id: 1,
            start_date: "2026-01-01",
            end_date: "2027-01-01",
            position: "chief"
        }
    ],

    // Tabel Mata Kuliah
    courses: [
        {
            id: 1,
            code: "RKS001",
            name: "Keamanan Informasi",
            study_program_id: 1,
            semester: 3
        }
    ],

    // Tabel Pengampu Mata Kuliah
    course_instructors: [
        {
            course_id: 1,
            instructor_id: 1,
            academic_year: "2026/2027"
        }
    ]
};


// ==========================================
// 3. INITIALIZE DATABASE
// Membuat database jika belum tersedia.
// ==========================================

function initDatabase() {

    if (localStorage.getItem(DB_KEY) === null) {

        localStorage.setItem(
            DB_KEY,
            JSON.stringify(seedData)
        );

        console.log("Database berhasil dibuat");

    }
}


// ==========================================
// 4. READ DATABASE
// Mengambil seluruh database dari LocalStorage.
// ==========================================

function readDatabase() {

    initDatabase();

    const data = localStorage.getItem(DB_KEY);

    return JSON.parse(data);
}


// ==========================================
// 5. SAVE DATABASE
// Menyimpan perubahan database ke LocalStorage.
// ==========================================

function saveDatabase(data) {

    localStorage.setItem(
        DB_KEY,
        JSON.stringify(data)
    );
}


// ==========================================
// 6. VALIDATE TABLE
// Memastikan nama tabel tersedia di database.
// ==========================================

function validateTable(database, table) {

    if (
        !Object.hasOwn(database, table) ||
        !Array.isArray(database[table])
    ) {

        throw new Error(
            "Tabel tidak ditemukan: " + table
        );

    }
}


// ==========================================
// 7. GET ALL DATA
// Mengambil seluruh data dari tabel tertentu.
// ==========================================

function getAll(table) {

    const database = readDatabase();

    validateTable(database, table);

    return database[table];
}


// ==========================================
// 8. GET DATA BY ID
// Mengambil satu data berdasarkan ID.
// ==========================================

function getById(table, id) {

    const records = getAll(table);

    return records.find(function (record) {

        return record.id === Number(id);

    });
}


// ==========================================
// 9. FIND DATA
// Mencari data berdasarkan beberapa kondisi.
// ==========================================

function findData(table, filters) {

    const records = getAll(table);

    return records.filter(function (record) {

        return Object.keys(filters).every(
            function (key) {

                return record[key] === filters[key];

            }
        );

    });
}


// ==========================================
// 10. CREATE DATA
// Menambahkan data baru ke tabel.
// ==========================================

function createData(table, data) {

    const database = readDatabase();

    validateTable(database, table);

    const records = database[table];

    let newData;

    // Khusus tabel pengampu mata kuliah
    // karena tidak memiliki kolom ID.

    if (table === "course_instructors") {

        const exists = records.some(
            function (record) {

                return (
                    record.course_id === data.course_id &&
                    record.instructor_id === data.instructor_id &&
                    record.academic_year === data.academic_year
                );

            }
        );

        // Mencegah data pengampu duplikat.

        if (exists) {

            throw new Error(
                "Data pengampu sudah tersedia"
            );

        }

        newData = { ...data };

    } else {

        // Mencari ID terbesar pada tabel.

        const maxId = records.reduce(
            function (max, record) {

                return Math.max(max, record.id);

            },
            0
        );

        // Membuat ID baru secara otomatis.

        newData = {
            ...data,
            id: maxId + 1
        };

    }

    // Menambahkan data ke array.

    records.push(newData);

    // Menyimpan perubahan database.

    saveDatabase(database);

    return newData;
}


// ==========================================
// 11. UPDATE DATA
// Mengedit data berdasarkan ID.
// ==========================================

function updateData(table, id, newData) {

    const database = readDatabase();

    validateTable(database, table);

    // Pengampu tidak memiliki ID tunggal.

    if (table === "course_instructors") {

        throw new Error(
            "Gunakan DB.updateWhere() untuk data pengampu"
        );

    }

    const records = database[table];

    // Mencari posisi data dalam array.

    const index = records.findIndex(
        function (record) {

            return record.id === Number(id);

        }
    );

    // Jika data tidak ditemukan.

    if (index === -1) {

        throw new Error("Data tidak ditemukan");

    }

    // Menggabungkan data lama dengan data baru.
    // ID lama tetap dipertahankan.

    records[index] = {
        ...records[index],
        ...newData,
        id: records[index].id
    };

    saveDatabase(database);

    return records[index];
}


// ==========================================
// 12. UPDATE WHERE
// Mengedit data berdasarkan beberapa kondisi.
// ==========================================

function updateWhere(table, filters, newData) {

    const database = readDatabase();

    validateTable(database, table);

    const records = database[table];

    // Mencari posisi data yang memenuhi kondisi.

    const index = records.findIndex(
        function (record) {

            return Object.keys(filters).every(
                function (key) {

                    return record[key] === filters[key];

                }
            );

        }
    );

    if (index === -1) {

        throw new Error("Data tidak ditemukan");

    }

    // Menggabungkan data lama dan data baru.

    const updated = {
        ...records[index],
        ...newData
    };

    // Memeriksa duplikasi pengampu mata kuliah.

    if (table === "course_instructors") {

        const duplicate = records.some(
            function (record, i) {

                return (
                    i !== index &&
                    record.course_id === updated.course_id &&
                    record.instructor_id === updated.instructor_id &&
                    record.academic_year === updated.academic_year
                );

            }
        );

        if (duplicate) {

            throw new Error(
                "Data pengampu sudah tersedia"
            );

        }

    } else {

        // Mempertahankan ID data lama.

        updated.id = records[index].id;

    }

    records[index] = updated;

    saveDatabase(database);

    return updated;
}


// ==========================================
// 13. SHARED DATABASE API
// Menggabungkan fungsi ke dalam object DB.
// ==========================================

const DB = {

    init: initDatabase,

    getAll: getAll,

    getById: getById,

    create: createData,

    update: updateData,

    find: findData,

    updateWhere: updateWhere

};


// ==========================================
// 14. GLOBAL ACCESS
// Agar DB dapat digunakan file JavaScript lain.
// ==========================================

window.DB = DB;


// ==========================================
// 15. RUN DATABASE
// Menjalankan inisialisasi database.
// ==========================================

DB.init();