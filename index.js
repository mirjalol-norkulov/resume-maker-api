const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs');
const puppeteer = require('puppeteer');

const app = express()

const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json({extended: true, limit: '50mb'}))

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    const allowedOrigins = [
        'http://localhost:8080',
        'https://resume-maker-uz.netlify.app',
        'https://resume.mirjalolnorkulov.uz'
    ]
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.post('/export-pdf', (req, res) => {
    const templateHTML = req.body.html;
    const fullHTML = getFullHTML(templateHTML)
    let htmlFilePath = 'CV.html'
    let buffer = Buffer.from(fullHTML)
    fs.open(htmlFilePath, 'w', function (err, fd) {
        if (err) {
            throw 'could not open file: ' + err;
        }

        // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
        fs.write(fd, buffer, 0, buffer.length, null, function (err) {
            if (err) throw 'error writing file: ' + err;
            fs.close(fd, function () {
                console.log('wrote the file successfully');

                (async () => {
                    const browser = await puppeteer.launch({args: ['--no-sandbox']});
                    const page = await browser.newPage();
                    await page.goto(`file:${path.join(__dirname, 'CV.html')}`, {
                        waitUntil: 'networkidle2',
                    });
                    await page.pdf({path: 'CV.pdf', format: 'a4', printBackground: true});
                    await browser.close();
                    res.download(`${__dirname}/CV.pdf`, () => {
                        fs.unlinkSync(`${__dirname}/CV.html`)
                        fs.unlinkSync(`${__dirname}/CV.pdf`)
                    });
                })();
            });
        });
    });
})

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
})


function getFullHTML(templateHTML) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body>
        <div class="flex w-full min-h-screen">
            ${templateHTML}
        </div>
    </body>
    </html>
    `
}
