import crypto from 'crypto';

let akumulasiTampungan = 0; 

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ success: false, message: 'Method not allowed' });

    const { phone, operator, nominal, buktiString } = req.body;

    const regexResiAngka = /^[0-9]{10,25}$/;
    if (!buktiString || !regexResiAngka.test(buktiString)) {
        return res.status(200).json({ success: false, message: "ID Transaksi/Resi tidak sah atau salah format." });
    }

    // =======================================================
    // KREDENSIAL AKUN (Ganti jika sudah siap jualan nyata)
    // =======================================================
    const username = "vowovigvq71W"; 
    const devKey = "dev-21a68080-1eab-11f1-8cb0-eb2ed44b2ebb"; 

    try {
        // 1. SISTEM PENGAMAN SALDO (URL RESMI)
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

        // 2. MAPPING SKU AUTOMATIC (ROBOT BACKEND PEMISAH BY.U & TELKOMSEL)
        let skuCode = "";
        const op = operator.toLowerCase();
        const cleanPhone = phone.trim();
        
        if (cleanPhone.startsWith("08515")) {
            skuCode = "by10"; // Jika nomor 08515 langsung belok ke produk by.U
        } else if (op.includes("telkomsel") || cleanPhone.startsWith("0851")) {
            skuCode = "s10"; // Sisa awalan 0851 lainnya tetap ke Telkomsel
        } else if (op.includes("indosat")) {
            skuCode = "i10";
        } else if (op.includes("axis")) {
            skuCode = "ax10";
        } else if (op.includes("smartfren")) {
            skuCode = "sm10";
        } else if (op.includes("three") || op.includes("3") || op.includes("tri")) {
            skuCode = "t10"; 
        } else if (op.includes("xl")) {
            skuCode = "x10";
        }

        // 3. PENGUNCIAN ANTI-DUPLIKAT RESI
        const refId = "pipzi_" + buktiString; 
        const signTransaksi = crypto.createHash('md5').update(username + devKey + refId).digest('hex');

        // 4. TEMBAK DIGIFLAZZ (URL RESMI)
        const response = await fetch('https://digiflazz.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username,
                buyer_sku_code: skuCode,
                customer_no: cleanPhone,
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
            acumulasiTampungan = 0; 
        }

        return res.status(200).json({ success: true, data: dataTransaksi, infoTransferVA });

    } catch (error) {
        return res.status(200).json({ success: false, message: "Gangguan sistem: " + error.message });
    }
                   }
        
