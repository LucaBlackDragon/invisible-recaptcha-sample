const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const querystring = require('querystring');

const config = require('./package.json').config;

const clientPort = config.clientPort;
const recaptchaSecretKey = config.recaptchaSecretKey;

const app = express();

// client configuration
app.use(express.static('src'));
app.use('/axios', express.static('node_modules/axios/dist')); // <script src="axios/axios.min.js"></script>

// server configuration
app.use('/api', bodyParser.json());
app.post('/api', function (req, res) {

    const token = req.body.token;
    const value = parseInt(req.body.value);

    console.log(`\nValidating recaptcha:\nsecret: ${recaptchaSecretKey}\ntoken: ${token}\n`);

    const postParams = {
        secret: recaptchaSecretKey,
        response: token
    };

    // Google si aspetta i parametri in QUERYSTRING e non in JSON (questa cosa non è scritta da nessuna parte!!!)
    const postQuerystring = querystring.stringify(postParams);

    axios.post('https://www.google.com/recaptcha/api/siteverify', postQuerystring)
        .then(({ data, status, statusText, headers, config, request }) => {

            console.log(`\nRecaptcha response:\n${JSON.stringify(data, null, 4)}\n`);

            if (data.success === true) {
                res.json({
                    success: true,
                    answer: value*value,
                });
                return;
            }

            res.status(401).send(`Unauthorized - ${JSON.stringify(data['error-codes'])}`);

        })
        .catch(err => {
            res.status(500).send(err);
        });

});

app.listen(8080, function () {
    console.log(`\nExample site ready on port ${clientPort}!\n`);
});
