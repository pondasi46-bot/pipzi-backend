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
        if (!customer_no) {
            return res.status(400).json({ error: 'Nomor tujuan wajib diisi' });
        }

        const username = "vowovigvq71W";
        const apiKey = "dev-21a68080-1eab-11f1-8cb0-eb2ed44b2ebb";
        
        const refId = "pipzi-" + Date.now();
        const rawSign = username + apiKey + refId;
        const sign = crypto.createHash('md5').update(rawSign).digest('hex');

        const response = await fetch("https://digiflazz.com", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "username": username,
                "buyer_sku_code": buyer_sku_code || "xpulsa5000",
                "customer_no": customer_no,
                "ref_id": refId,
                "sign": sign
            })
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Gagal terhubung ke DigiFlazz', detail: error.message });
    }
}
