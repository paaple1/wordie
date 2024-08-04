const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
};

// 静的ファイルを提供するための設定
app.use(express.static('public'));

app.get('/search', async (req, res) => {
    const { query, site } = req.query;
    let url = '';

    switch (site) {
        case 'oxford':
            url = `https://www.oxfordlearnersdictionaries.com/definition/english/${query}`;
            break;
        case 'ldoce':
            url = `https://www.ldoceonline.com/dictionary/${query}`;
            break;
        case 'cambridge':
            url = `https://dictionary.cambridge.org/dictionary/english/${query}`;
            break;
        case 'alc':
            url = `https://eow.alc.co.jp/search?q=${query}`;
            break;
        default:
            return res.status(400).send('Invalid site');
    }

    try {
        const response = await axios.get(url, { headers, timeout: 10000, httpAgent, httpsAgent });
        const html = response.data;
        const $ = cheerio.load(html);
        let result;

        switch (site) {
            case 'oxford':
                result = $('#entryContent').html() || $('.senses_wrapper').html();
                break;
            case 'ldoce':
                result = $('.dictentry').html() || $('.sense').html();
                break;
            case 'cambridge':
                result = $('.entry-body__el').html() || $('.def-block').html();
                break;
            case 'alc':
                result = $('#resultsList').html() || $('.result').html();
                break;
        }

        // 不要な要素を削除
        if (site === 'oxford') {
            $('#entryContent .social-buttons').remove();
            $('#entryContent .promotion').remove();
        }

        res.send(result || 'No results found');
    } catch (error) {
        console.error(`Error fetching data from ${site}:`, error.message);
        res.status(500).send(`Error fetching data: ${error.message}`);
    }
});

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
