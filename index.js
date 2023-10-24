const body_parser = require("body-parser");
const express = require("express");
const logger = require("morgan");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const cmd = require("node-cmd"); // node-cmd 모듈 추가
const static = require("static");
var cors = require('cors')
require("moment-timezone");

const ABSOLUTE_UPLOAD_DIR = __dirname + `/public/uploads/`;
const ABSOLUTE_DOWNLOAD_DIR = __dirname + `/public/downloads/`;
const RELATIVE_UPLOAD_DIR = "/uploads/";
const RELATIVE_DOWNLOAD_DIR = "/downloads/";

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, ABSOLUTE_UPLOAD_DIR);
  },
  filename: function (req, file, callback) {
    const time = moment().format("YYYY.MM.DD_HH-mm-ss");
    const file_originalname = file.originalname;
    const extension = path.extname(file_originalname);
    const basename = path.basename(file_originalname, extension);

    console.log(basename);
    console.log(extension);

    callback(null, `${basename}_${time}${extension}`);
  },
});
const upload = multer({ storage: storage });


const app = express();
app.use(cors())
moment.tz.setDefault("Asia/Seoul");
app.use(logger("dev", fs.createWriteStream("server.log", { flags: "w" })));
app.use(express.static(path.join(__dirname, "./public")));
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class Response {
  constructor() {
    this.error = false;
    this.message = ""; // 오타 수정: "messagse" -> "message"
    this.filePath = "";
    this.fileName = "";
  }
}

/* 동영상 업로드 */
app.post("/upload", upload.single("selectFile"), (req, res) => {
  const result = new Response();
  const filename = req.file.filename;

  result.filePath = RELATIVE_UPLOAD_DIR + filename;
  res.send(result);
});

/* 모자이크 Go! */
app.post("/mosaic", async (req, res) => {
  const result = new Response();
  const mosaic_option = req.body;
  let option_list = [];

  for (element in mosaic_option) {
    option_list.push(mosaic_option[element]);
  }

  console.log(mosaic_option);

  option_list.push(ABSOLUTE_UPLOAD_DIR);
  option_list.push(ABSOLUTE_DOWNLOAD_DIR);
  option_list = option_list.join(" ");

  await delay(5000);

  // 방법 2 - 주석 해제
  await new Promise((resolve, reject) => {
    cmd.get(
      `python C:/web/server/mozaicfunction.ipynb ${option_list}`,
      function (error, stdout, stderr) {
        if (error) {
          console.log("ERROR: ", error);
        } else {
          console.log("SUCCESS: ", stdout);
        }
        resolve();
      }
    );
  });

  const input = fs.createReadStream(ABSOLUTE_UPLOAD_DIR + mosaic_option.filename);
  const output = fs.createWriteStream(ABSOLUTE_DOWNLOAD_DIR + mosaic_option.filename);
  input.pipe(output);

  result.filePath = RELATIVE_DOWNLOAD_DIR + mosaic_option.filename;
  result.fileName = mosaic_option.filename;
  res.send(result);
});

/* 동영상 다운로드 */
app.post("/download", async (req, res) => {
  const file_path = ABSOLUTE_DOWNLOAD_DIR + req.body.downloadFileName;
  let file_name = path.basename(file_path);

  console.log(file_name + " 파일 요청!");

  let is_exist = fs.existsSync(file_path);

  if (is_exist === false) {
    return res.status(404).send();
  }

  const readStream = fs.createReadStream(file_path);

  let encoded_file_name = encodeURI(file_name);

  res.set({
    "Content-Type": "video/mp4",
    "Content-Disposition": "attachment; filename=" + encoded_file_name,
    "Access-Control-Expose-Headers": "Content-Disposition",
  });

  try {
    await new Promise(function (resolve, reject) {
      readStream
        .on("Error", Error)
        .pipe(res)
        .on("Error", Error)
        .on("finish", finish);

      function finish() {
        console.log(`${file_name} 전송 완료`);
        return resolve();
      }

      function Error(err) {
        return reject(err);
      }
    });
  } catch (err) {
    console.log(err);
  }
});

app.listen("3030", () => {
  console.log("server listening on port 3030!");
});
