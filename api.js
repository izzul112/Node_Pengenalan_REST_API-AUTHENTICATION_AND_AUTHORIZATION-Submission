// inisiasi library
const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const mysql = require("mysql")
const moment = require("moment")
const md5 = require("md5")
const Cryptr = require("cryptr")
const crypt = new Cryptr("140533601705") // secret key, boleh diganti kok

// implementation
const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// create MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "penyewaan_mobil"
})

db.connect(error => {
    if (error) {
        console.log(error.message)
    } else {
        console.log("MySQL Connected")
    }
})


// Validasi Token

validateToken = () => {
    return (req, res, next) => {
        // cek keberadaan "Token" pada request header
        if (!req.get("Token")) {
            // jika "Token" tidak ada
            res.json({
                message: "Access Forbidden"
            })
        } else {
            // tampung nilai Token
            let token  = req.get("Token")
            
            // decrypt token menjadi id_user
            let decryptToken = crypt.decrypt(token)

            // sql cek id_user
            let sql = "select * from karyawan where ?"

            // set parameter
            let param = { id_user: decryptToken}

            // run query
            db.query(sql, param, (error, result) => {
                if (error) throw error
                 // cek keberadaan id_user
                if (result.length > 0) {
                    // id_user tersedia
                    next()
                } else {
                    // jika user tidak tersedia
                    res.json({
                        message: "Invalid Token"
                    })
                }
            })
        }

    }
}


// Autentication

// endpoint login user (authentication)
app.post("/user/auth", (req, res) => {
    // tampung username dan password
    let param = [
        req.body.username, //username
        md5(req.body.password) // password
    ]
    

    // create sql query
    let sql = "select * from karyawan where username = ? and password = ?"

    // run query
    db.query(sql, param, (error, result) => {
        if (error) throw error

        // cek jumlah data hasil query
        if (result.length > 0) {
            // user tersedia
            res.json({
                message: "Logged",
                token: crypt.encrypt(result[0].id_karyawan), // generate token
                data: result
            })
        } else {
            // user tidak tersedia
            res.json({
                message: "Invalid username/password"
            })
        }
    })
})


// MOBIL

// end-point akses data mobil
app.get("/mobil", validateToken(), (req, res) => {
    // create sql query
    let sql = "select * from mobil"

    // run query
    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                mobil: result // isi data
            }
        }
        res.json(response) // send response
    })
})

// end-point akses data mobil berdasarkan id_mobil tertentu
app.get("/mobil/:id", validateToken(), (req, res) => {
    let data = {
        id_mobil: req.params.id
    }
    // create sql query
    let sql = "select * from mobil where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                mobil: result // isi data
            }
        }
        res.json(response) // send response
    })
})

// end-point menyimpan data mobil
app.post("/mobil", validateToken(), (req, res) => {

    // prepare data
    let data = {
        id_mobil: req.body.id_mobil,
        nomor_mobil: req.body.nomor_mobil,
        merk: req.body.merk,
        jenis: req.body.jenis,
        warna: req.body.warna,
        tahun_pembuatan: req.body.tahun_pembuatan,
        biaya_sewa_per_hari: req.body.biaya_sewa_per_hari,
        image: req.body.image
    }

    // create sql query insert
    let sql = "insert into mobil set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data inserted"
            }
        }
        res.json(response) // send response
    })
})

// end-point mengubah data mobil
app.put("/mobil", validateToken(), (req, res) => {

    // prepare data
    let data = [
        // data
        {
            id_mobil: req.body.id_mobil,
            nomor_mobil: req.body.nomor_mobil,
            merk: req.body.merk,
            jenis: req.body.jenis,
            warna: req.body.warna,
            tahun_pembuatan: req.body.tahun_pembuatan,
            biaya_sewa_per_hari: req.body.biaya_sewa_per_hari,
            image: req.body.image
        },

        // parameter (primary key)
        {
            id_mobil: req.body.id_mobil
        }
    ]

    // create sql query update
    let sql = "update mobil set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data updated"
            }
        }
        res.json(response) // send response
    })
})

// end-point menghapus data mobil berdasarkan id_mobil
app.delete("/mobil/:id", validateToken(), (req, res) => {
    // prepare data
    let data = {
        id_mobil: req.params.id
    }

    // create query sql delete
    let sql = "delete from mobil where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response) // send response
    })
})

// PELANGGAN

// end-point akses data pelanggan
app.get("/pelanggan", validateToken(), (req, res) => {
    // create sql query
    let sql = "select * from pelanggan"

    // run query
    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                pelanggan: result // isi data
            }
        }
        res.json(response) // send response
    })
})

// end-point akses data pelanggan berdasarkan id_pelanggan tertentu
app.get("/pelanggan/:id", validateToken(), (req, res) => {
    let data = {
        id_pelanggan: req.params.id
    }
    // create sql query
    let sql = "select * from pelanggan where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                pelanggan: result // isi data
            }
        }
        res.json(response) // send response
    })
})

// end-point menyimpan data pelanggan
app.post("/pelanggan", validateToken(), (req, res) => {

    // prepare data
    let data = {
        id_pelanggan: req.body.id_pelanggan,
        nama_pelanggan: req.body.nama_pelanggan,
        alamat_pelanggan: req.body.alamat_pelanggan,
        kontak: req.body.kontak
    }

    // create sql query insert
    let sql = "insert into pelanggan set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data inserted"
            }
        }
        res.json(response) // send response
    })
})

// end-point mengubah data pelanggan
app.put("/pelanggan", validateToken(), (req, res) => {

    // prepare data
    let data = [
        // data
        {
            id_pelanggan: req.body.id_pelanggan,
            nama_pelanggan: req.body.nama_pelanggan,
            alamat_pelanggan: req.body.alamat_pelanggan,
            kontak: req.body.kontak
        },

        // parameter (primary key)
        {
            id_pelanggan: req.body.id_pelanggan
        }
    ]

    // create sql query update
    let sql = "update pelanggan set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data updated"
            }
        }
        res.json(response) // send response
    })
})

// end-point menghapus data pelanggan berdasarkan id_pelanggan
app.delete("/pelanggan/:id", validateToken(), (req, res) => {
    // prepare data
    let data = {
        id_pelanggan: req.params.id
    }

    // create query sql delete
    let sql = "delete from pelanggan where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response) // send response
    })
})

// KARYAWAN

// end-point akses data karyawan
app.get("/karyawan", validateToken(), (req, res) => {
    // create sql query
    let sql = "select * from karyawan"

    // run query
    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                karyawan: result // isi data
            }
        }
        res.json(response) // send response
    })
})

// end-point akses data karyawan berdasarkan id_karyawan tertentu
app.get("/karyawan/:id", validateToken(), (req, res) => {
    let data = {
        id_karyawan: req.params.id
    }
    // create sql query
    let sql = "select * from karyawan where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                karyawan: result // isi data
            }
        }
        res.json(response) // send response
    })
})

// end-point menyimpan data karyawan
app.post("/karyawan", validateToken(), (req, res) => {

    // prepare data
    let data = {
        id_karyawan: req.body.id_karyawan,
        nama_karyawan: req.body.nama_karyawan,
        alamat_karyawan: req.body.alamat_karyawan,
        kontak: req.body.kontak,
        username: req.body.username,
        password: md5(req.body.password)
    }

    // create sql query insert
    let sql = "insert into karyawan set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data inserted"
            }
        }
        res.json(response) // send response
    })
})

// end-point mengubah data karyawan
app.put("/karyawan", validateToken(), (req, res) => {

    // prepare data
    let data = [
        // data
        {
            id_karyawan: req.body.id_karyawan,
            nama_karyawan: req.body.nama_karyawan,
            alamat_karyawan: req.body.alamat_karyawan,
            kontak: req.body.kontak,
            username: req.body.username,
            password: md5(req.body.password)
        },

        // parameter (primary key)
        {
            id_karyawan: req.body.id_karyawan
        }
    ]

    // create sql query update
    let sql = "update karyawan set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data updated"
            }
        }
        res.json(response) // send response
    })
})

// end-point menghapus data karyawan berdasarkan id_karyawan
app.delete("/karyawan/:id", validateToken(), (req, res) => {
    // prepare data
    let data = {
        id_karyawan: req.params.id
    }

    // create query sql delete
    let sql = "delete from karyawan where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " data deleted"
            }
        }
        res.json(response) // send response
    })
})

// REST API Proses Transaksi

// end-point menambahkan data sewa

app.post("/sewa", validateToken(), (req, res) => {
    // prepare data to sewa
    let data = {
        id_sewa: req.body.id_sewa,
        id_mobil: req.body.id_mobil,
        id_karyawan: req.body.id_karyawan,
        id_pelanggan: req.body.id_pelanggan,
        tanggal_sewa: moment().format('YYYY-MM-DD HH:mm:ss'), // get current time
        tanggal_kembali: moment().format('YYYY-MM-DD HH:mm:ss'),
        total_bayar: req.body.total_bayar
    }

    // create query insert to pelanggaran_siswa
    let sql = "insert into sewa set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null

        if (error) {
            res.json({ message: error.message })
        }
         else {
            res.json({ message: "Data has been inserted" })
        }
    })
})

// end-point menampilkan data sewa
app.get("/sewa", validateToken(), (req, res) => {
    // create sql query
    let sql = `SELECT * FROM sewa `

    // run query
    db.query(sql, (error, result) => {
        if (error) {
            res.json({ message: error.message })
        } else {
            res.json({
                count: result.length,
                sewa: result
            })
        }
    })
})

// end-point untuk menampilkan detail sewa
app.get("/sewa/:id", validateToken(), (req, res) => {
    let param = req.params.id;

    db.query(`SELECT * FROM sewa WHERE sewa.id_sewa = ` + param,
     (error, result) => {
        if (error) {
            res.json({ message: error.message })
        } else {
            res.json({
                count: result.length,
                sewa: result
            })
        }
    })
})

// end-point untuk menghapus data pelanggaran_siswa
app.delete("/sewa/:id_sewa", validateToken(), (req, res) => {
    let param = { id_sewa: req.params.id_sewa }

    // create sql query delete detail_pelanggaran
    let sql = "delete from sewa where ?"

    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({ message: error.message })
        } else {
            res.json({ message: "Data has been deleted" })
        }
    })

})



app.listen(8000, () => {
    console.log("Run on port 8000")
})
