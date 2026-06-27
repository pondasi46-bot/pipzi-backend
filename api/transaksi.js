import crypto from 'crypto';

let akumulasiTampungan = 0; 

export default async function handler(req, res) {
    // Pengaturan CORS agar bisa diakses oleh aplikasi Android Appsgeyser Anda
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { phone, operator, nominal, buktiString } = req.body;

    const regexResiAngka = /^[0-9]{10,25}$/;
    if (!buktiString || !regexResiAngka.test(buktiString)) {
        return res.status(200).json({ success: false, message: "ID Transaksi/Resi tidak sah atau salah format." });
    }

    // SILAHKAN GANTI DENGAN DATA ASLI ANDA JIKA SUDAH SIAP JUALAN
    const username = "vowovigvq71W"; 
    const devKey = "dev-21a68080-1eab-11f1-8cb0-eb2ed44b2ebb"; 

    try {
        // 1. SISTEM PENGAMAN SALDO
        const signCekSaldo = crypto.createHash('md5').update(username + devKey + "depo").digest('hex');
        const resCekSaldo = await fetch('https://digiflazz.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cmd: "deposit", username: username, sign: signCekSaldo })
        });
        const dataSaldo = await resCekSaldo.json();
        const sisaSaldoKulakan = dataSaldo.data ? dataSaldo.data.deposit : 0;

        if (sisaSaldoKulakan < 11000) {
            return res.status(200).json({ success: false, message: "Maaf, stok pulsa sedang kosong. Silahkan coba beberapa saat lagi." });
        }

        // 2. MAPPING SKU
        let skuCode = "";
        const op = operator.toLowerCase();
        if (op.includes("telkomsel")) skuCode = "t10";
        else if (op.includes("indosat")) skuCode = "i10";
        else if (op.includes("3") || op.includes("three")) skuCode = "three10";
        else if (op.includes("xl")) skuCode = "xl10";
        else if (op.includes("axis")) skuCode = "ax10";
        else if (op.includes("smartfren")) skuCode = "sm10";

        // 3. PENGUNCIAN ANTI-DUPLIKAT RESI
        const refId = "pipzi_" + buktiString; 
        const signTransaksi = crypto.createHash('md5').update(username + devKey + refId).digest('hex');

        // 4. TEMBAK DIGIFLAZZ
        const response = await fetch('https://digiflazz.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                buyer_sku_code: skuCode,
                customer_no: phone,
                ref_id: refId,
                sign: signTransaksi
            })
        });

        const dataTransaksi = await response.json();

        if (dataTransaksi.data && dataTransaksi.data.status === 'Gagal') {
            return res.status(200).json({ success: false, message: dataTransaksi.data.message || "ID Transaksi sudah pernah digunakan." });
        }

        acumulasiTampungan += 11500; 
        let infoTransferVA = false;
        if (acumulasiTampungan >= 100000) {
            infoTransferVA = true;
            console.log(`[SETORAN MANUAL] Omset terkumpul Rp ${acumulasiTampungan}. Silahkan top up modal Digiflazz Anda.`);
            akumulasiTampungan = 0; 
        }

        return res.status(200).json({ success: true, data: dataTransaksi, infoTransferVA });

    } catch (error) {
        return res.status(200).json({ success: false, message: "Gangguan sistem: " + error.message });
    }
}
