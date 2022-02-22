const upload = require("./upload");
const express = require("express");
const { urlencoded } = require("express");
const app = express();
const http = require("http");
const https = require("https");
const Stream = require("stream").Transform;
const fs = require("fs");
const cors = require("cors");
const AWS = require("aws-sdk");
const dotenv = require("dotenv");

dotenv.config({});

app.use(express.json());
app.use(urlencoded({ extended: false }));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({
    message: "Success!! and Docker test for ec2",
  });
});

app.get("/hello", (req, res) => {
  res.json({
    message: "지라연동 커밋 테스트, 브랜치 및 커밋",
  });
});

// app.post("/multer", upload.single("img"), (req, res) => {
//   const image = req.file.location;
//   if (image === undefined) {
//     return res.status(400).send(util.fail(400, "이미지가 존재하지 않습니다."));
//   }
// });

/* request body: { "img": "http://postfiles.pstatic.net/MjAyMjAyMTRfMTMg/MDAxNjQ0ODI0NTAyMTkz.ObOk294g3V53BRiAQnzK8c536a2FCJxeKbvD_txcdowg.Af0cOVeKt-Nk-qCMoGLajManffDbL4zHmbpEt7PODNYg.PNG.catalyst88/%EC%98%A4%EB%A0%8C%EC%A7%80%EB%B3%B4%EB%93%9C-logo(%EC%83%81%ED%95%98)_ccexpress.png?type=w773" } */
app.post("/download", (req, res) => {
  var url = req.body.img;
  let imageUrl = "";
  const globalRegex = new RegExp("http(?=s)", "g");
  /* 이미지 주소의 프로토콜을 체크*/
  let httpsMatch = globalRegex.test(url) ? https : http;

  httpsMatch
    .request(url, function (response) {
      var data = new Stream();

      response.on("data", function (chunk) {
        data.push(chunk);
      });
      response.on("end", function (c) {
        fs.writeFileSync("image.png", data.read());
      });
    })
    .end();

  /* 로컬에 저장된 이미지를 읽어와서 S3에 바로 저장 */
  fs.readFile("image.png", (err, data) => {
    if (err) throw err;
    /* IAM에서 발급받은 ACCESS_KEY, SECRET ACCESS KEY */
    const ACCESS_KEY = process.env.ACCESS_KEY;
    const SECRET_ACCESS_KEY = process.env.SECRET_ACCESS_KEY;
    /* S3의 REGION */
    const REGION = "ap-northeast-2";
    /* 사용하려는 S3 버킷 이름 */
    const S3_BUCKET = "orangeboard-front";
    /* 에디터에 추가된 이미지의 확장자 명 */
    const ext = "png";
    const now = new Date();
    /* 에디터에 추가된 이미지의 파일 이름 변경 */
    const reportImgFile = `image_${now.getHours()}${now.getMinutes()}${now.getSeconds()}${Math.floor(
      Math.random() * 1000000000
    )}.${ext}`;
    /* 사용하려는 S3 버킷에서 이미지가 등록되는 경로 */
    const itemKey = `report/${reportImgFile}`;

    AWS.config.update({
      accessKeyId: ACCESS_KEY,
      secretAccessKey: SECRET_ACCESS_KEY,
    });

    const s3 = new AWS.S3({
      params: { Bucket: S3_BUCKET },
      region: REGION,
    });

    /* S3에 전달한 이미지 정보 */
    const params = {
      ACL: "public-read",
      Body: data,
      Bucket: S3_BUCKET,
      Key: itemKey,
    };

    s3.putObject(params, (err) => {
      if (err) {
        console.error("S3 PutObject Error", err);
        return err;
      }

      /* 이미지가 S3에 등록될 때 생성되는 URL 주소 */
      imageUrl = `${s3.endpoint.href}${S3_BUCKET}/${itemKey}`;
      console.log("s3 업로드 완료");
      return res.send({ imageUrl });
    });
  });
});

app.listen(80, () => {
  console.log("Server starting on port 80");
});
