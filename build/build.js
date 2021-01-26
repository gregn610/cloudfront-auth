const shell = require('shelljs');
const fs = require('fs');
const axios = require('axios');
const url = require('url');
const R = require('ramda');

var config = {AUTH_REQUEST: {}, TOKEN_REQUEST: {}};

/* Required env vars
    export CLOUDAUTH_BASE_URL=foobar
    export CLOUDAUTH_CLIENT_ID=foobar
    export CLOUDAUTH_CLIENT_SECRET=foobar
    export CLOUDAUTH_REDIRECT_URI=foobar
    export CLOUDAUTH_SESSION_DURATION=foobar
* */

function main() {
    if ( ! ("CLOUDAUTH_BASE_URL" in process.env)) {
        console.log('Required envvironment varaibel "CLOUDAUTH_BASE_URL" not set')
        process.exit(1)
    }
    if ( ! ("CLOUDAUTH_CLIENT_ID" in process.env)) {
        console.log('Required envvironment varaibel "CLOUDAUTH_CLIENT_ID" not set')
        process.exit(1)
    }
    if ( ! ("CLOUDAUTH_CLIENT_SECRET" in process.env)) {
        console.log('Required envvironment varaibel "CLOUDAUTH_CLIENT_SECRET" not set')
        process.exit(1)
    }
    if ( ! ("CLOUDAUTH_REDIRECT_URI" in process.env)) {
        console.log('Required envvironment varaibel "CLOUDAUTH_REDIRECT_URI" not set')
        process.exit(1)
    }
    if ( ! ("CLOUDAUTH_SESSION_DURATION" in process.env)) {
        console.log('Required envvironment varaibel "CLOUDAUTH_SESSION_DURATION" not set')
        process.exit(1)
    }

    config.AUTHN = "COGNITO";
    config.AUTHZ = "COGNITO";

    shell.mkdir('-p', 'distributions/');
    if (!fs.existsSync('distributions/id_rsa') || !fs.existsSync('./distributions/id_rsa.pub')) {
        shell.exec("ssh-keygen -t rsa -m PEM -b 4096 -f ./distributions/id_rsa -N ''");
        shell.exec("openssl rsa -in ./distributions/id_rsa -pubout -outform PEM -out ./distributions/id_rsa.pub");
    }

    config.AUTH_REQUEST.client_id = process.env.CLOUDAUTH_CLIENT_ID;
    config.AUTH_REQUEST.redirect_uri = process.env.CLOUDAUTH_REDIRECT_URI;
    config.AUTH_REQUEST.response_type = 'code';
    config.AUTH_REQUEST.scope = 'openid email';
    config.BASE_URL = process.env.CLOUDAUTH_BASE_URL
    config.BASE_URL = process.env.CLOUDAUTH_BASE_URL;
    config.CALLBACK_PATH = url.parse(process.env.CLOUDAUTH_REDIRECT_URI).pathname;
    config.CLIENT_ID = process.env.CLOUDAUTH_CLIENT_ID
    config.CLIENT_SECRET = process.env.CLOUDAUTH_CLIENT_SECRET
    config.DISCOVERY_DOCUMENT = process.env.CLOUDAUTH_BASE_URL + '/.well-known/openid-configuration';
    config.PRIVATE_KEY = fs.readFileSync('distributions/id_rsa', 'utf8');
    config.PUBLIC_KEY = fs.readFileSync('distributions/id_rsa.pub', 'utf8');
    config.REDIRECT_URI = process.env.CLOUDAUTH_REDIRECT_URI
    config.SESSION_DURATION = parseInt(process.env.CLOUDAUTH_SESSION_DURATION, 10) * 60 * 60;
    config.SESSION_DURATION = process.env.CLOUDAUTH_SESSION_DURATION
    config.TOKEN_REQUEST.client_id = process.env.CLOUDAUTH_CLIENT_ID;
    config.TOKEN_REQUEST.client_secret = process.env.CLOUDAUTH_CLIENT_SECRET;
    config.TOKEN_REQUEST.grant_type = 'authorization_code';
    config.TOKEN_REQUEST.redirect_uri = process.env.CLOUDAUTH_REDIRECT_URI;

    shell.cp('./authn/openid.index.js', './distributions/index.js');
    shell.cp('./nonce.js', './distributions/nonce.js');
    shell.cp('./authz/okta.js', './distributions/auth.js');

    writeConfig(config, zip, ['config.json', 'index.js', 'auth.js', 'nonce.js']);
}

function zip(files) {
    var filesString = '';
    for (var i = 0; i < files.length; i++) {
        filesString += ' distributions/' + files[i] + ' ';
    }
    shell.exec('zip -q distributions/package.zip ' + 'package-lock.json package.json -r node_modules');
    shell.exec('zip -q -r -j distributions/package.zip ' + filesString);
    console.log("Done... created Lambda function distributions/package.zip");
}

function writeConfig(config, callback, files) {
    fs.writeFile('distributions/config.json', JSON.stringify(config, null, 4), (err) => {
        if (err) throw err;
        callback(files);
    });
}

main()
