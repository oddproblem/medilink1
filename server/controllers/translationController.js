const axios = require('axios');

const PYTHON_TRANSLATE_URL = process.env.PYTHON_TRANSLATE_URL || "http://localhost:5005";

exports.translateText = async (req, res) => {
    const { q, target } = req.body;

    if (!q || !target) {
        return res.status(400).json({ error: 'Missing text to translate or target language.' });
    }

    // Handle empty arrays
    if (Array.isArray(q) && q.length === 0) {
        return res.status(200).json({ translations: [] });
    }

    // Skip translation if target is English
    if (target === 'en') {
        return res.status(200).json({ translations: q });
    }

    try {
        const response = await axios.post(
            `${PYTHON_TRANSLATE_URL}/translate`,
            { q, target },
            { timeout: 60000 } // 60s timeout to Python service
        );

        res.status(200).json({ translations: response.data.translations });
    } catch (error) {
        const errMsg = error.response ? error.response.data : error.message;
        console.error('Translation proxy error:', errMsg);

        // On failure, return the original texts so the UI doesn't break
        res.status(200).json({ translations: q });
    }
};