"use strict";
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const bodyParser = require("body-parser");
const router = express.Router();
const stream = require("stream");
const encoding = require("encoding");
var fs = require("fs");
var app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  bodyParser.json();
  next();
});
app.use("/.netlify/functions/server", router);

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200
};

app.post(
  "/api/upload",
  upload.single("file"),
  cors(corsOptions),
  async function(req, res, next) {
    let fileObject = req.file;
    let bufferStream = new stream.PassThrough();
    bufferStream.end(fileObject.buffer);

    return new Promise((resolve, reject) => {
      postFile(bufferStream, res);
    })
      .then(() => {
        res.end("Hello: ");
      })
      .catch(error => {
        assert.isNotOk(error, "Promise error");
      });
  }
);

app.listen(2000, function(a) {
  console.log("Listening to port 2000");
});

//
const readline = require("readline");
const { google } = require("googleapis");
const { assert } = require("console");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

var TOKEN = new Object();
var CREDS = new Object();
var DRIVE = new Object();

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Drive API.
  CREDS = JSON.parse(content);
  authorize(listFiles);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
  let { client_secret, client_id, redirect_uris } = CREDS.installed;
  let oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    TOKEN = JSON.parse(token);
    oAuth2Client.setCredentials(TOKEN);
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listFiles(auth) {
  DRIVE = google.drive({ version: "v3", auth });
  DRIVE.files.list(
    {
      pageSize: 10,
      fields: "nextPageToken, files(id, name)"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const files = res.data.files;
      if (files.length) {
        files.map(file => {
          //console.log(`${file.name} (${file.id})`);
          let message = { message: file.name };
          return null;
        });
      } else {
        //no files
      }
    }
  );
}
// [END drive_quickstart]

async function postFile(req, res) {
  var fileMetadata = {
    name: "photo.jpg",
    parents: ["1_JiAURW5r8GSccMuuQUdd7l9w9JNYfQL"] // images/headshots
  };
  var media = {
    mimeType: "image/jpeg",
    body: req
  };
  DRIVE.files
    .create({
      resource: fileMetadata,
      uploadType: "media",
      media: media,
      fields: "id"
    })
    .then(
      function(response) {
        console.log("File Id: ", response.data.id);
        res.end(response.data.id);
        return response.data.id;
      },
      function(err) {
        console.error(err);
        return err;
      }
    );
}

module.exports = {
  SCOPES,
  listFiles,
  postFile
};
module.exports.handler = serverless(app);
