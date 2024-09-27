const express = require("express");
const path = require("path");
const multer = require("multer");
var fs = require("fs");
const app = express();

const multerMiddleWareStorage = multer.diskStorage({
  destination: (req, res, callBack) => {
    callBack(null, "image-uploads/");
  },
  filename: (req, file, callBack) => {
    callBack(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, callBack) => {
  const allowedFileTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedFileTypes.includes(file.mimetype)) {
    callBack(null, true);
  } else {
    callBack(null, false);
  }
};

const upload = multer({
  storage: multerMiddleWareStorage,
  limits: {
    fileSize: 1000000000, // 1000 MB
  },
  fileFilter: fileFilter,
});

const UploadImage = app.post("/", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.json({ message: "Only Image File Allowed" });
    }
    const imageUpload = req.file.path;
    console.log(imageUpload);
    res.json(imageUpload);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = UploadImage;
