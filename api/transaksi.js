const crypto = require('crypto');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Metode tidak diizinkan' });
    }

    try {
        const { customer_no, buyer_sku_code } = req.body;
        
        // Kredensial Resmi Anda (Aman di dalam server rahasia)
        const username = "vowovigvq71W";
        const apiKey = "dev-21a68080-1eab-11f1-8cb0-eb2ed44b2ebb"; // Ganti dengan Production Key jika sudah siap live nyata
        
        // -------------------------------------------------------------
        // LOGIKA JALUR 1: JIKA APLIKASI MEMINTA CEK SALDO REAL-TIME
        // -------------------------------------------------------------
        if (customer_no === "CEK_SALDO" || buyer_sku_code === "CEK_SALDO") {
            const rawSignSaldo = username + apiKey + "depo";
            const signSaldo = crypto.createHash('md5').update(rawSignSaldo).digest('hex');

            const responseSaldo = await fetch("https://digiflazz.com", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    "username": username,
                    "sign": signSaldo
                })
            });

            const dataSaldo = await responseSaldo.json();
            return res.status(200).json(dataSaldo);
        }

        // -------------------------------------------------------------
        // LOGIKA JALUR 2: JIKA APLIKASI MEMINTA TRANSAKSI UTAMA (PULSA/DATA/PLN)
        // -------------------------------------------------------------
        if (!customer_no) {
            return res.status(400).json({ error: 'Nomor tujuan wajib diisi' });
        }

        const refId = "pipzi-" + Date.now();
        const rawSignTx = username + apiKey + refId;
        const signTx = crypto.createHash('md5').update(rawSignTx).digest('hex');

        // Menggunakan url "/v1/test-window" untuk sandbox testing DigiFlazz
        const responseTx = await fetch("https://digiflazz.com", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "username": username,
                "buyer_sku_code": buyer_sku_code || "xpulsa5000",
                "customer_no": customer_no,
                "ref_id": refId,
                "sign": signTx
            })
        });

        const dataTx = await responseTx.json();
        return res.status(200).json(dataTx);

    } catch (error) {
        return res.status(500).json({ error: 'Gagal terhubung ke DigiFlazz', detail: error.message });
    }
}
