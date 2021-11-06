const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const fs = require("fs");
const url = require("url");
const languageDetect = require("languagedetect");
const transactionTemplate = require("./modules/transactionTemplate.js");
const { createHook } = require("async_hooks");
const { verify } = require("crypto");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static("public"));

const indexPage = fs.readFileSync(`${__dirname}/public/M&A.html`, "utf-8");
const transactionTemp = fs.readFileSync(
  `${__dirname}/public/template/transactionTemp.html`,
  "utf-8"
);

let businesswireURL =
  "https://www.businesswire.com/portal/site/home/news/subject/?vnsId=31333";
const businesswireArr = [];

const getDate = function (date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

let chosenDate = getDate(new Date());
console.log(`chosen date at creation is ${chosenDate}`);
const foundChosenDate = {
  foundDate: false,
  finishDate: false,
};

const processHTML = async function (response) {
  const html = response.data;
  const $ = cheerio.load(html);
  const lngDetector = new languageDetect();

  $(".bwNewsList li", html).each(function () {
    // Targeting the HTML element containing each article
    let transactionTitle = $(this).find("span[itemprop*='headline']").text();
    let transactionUrl =
      "https://businesswire.com" + $(this).find("a").attr("href");
    let transactionDate = getDate(
      new Date($(this).find("time").attr("datetime"))
    );
    let transactionImage =
      $(this).find(".bwThumbs img").attr("src") || "NO IMAGE";
    let titleLanguage =
      lngDetector.detect(transactionTitle).length === 0
        ? "Foreign"
        : lngDetector.detect(transactionTitle)[0][0];

    // console.log("chosen date " + chosenDate);
    if (transactionDate === chosenDate) {
      foundChosenDate.foundDate = true;
      if (titleLanguage === "english") {
        // We are only interested in English articles
        businesswireArr.push({
          transactionTitle,
          transactionUrl,
          transactionDate,
          transactionImage,
        });
      }
    } else if (
      transactionDate != chosenDate &&
      foundChosenDate.foundDate === true
    ) {
      foundChosenDate.finishDate = true;
    }
  });

  businesswireURL = `https://businesswire.com${$("#paging .pagingNext a").attr(
    "href"
  )}`;
  return businesswireURL;
};
let output;
// const businesswireScraping = async function () {
//   try {
//     let response = await axios(businesswireURL);
//     let nextPageURL = await processHTML(response);
//     response = await axios(nextPageURL);
//     nextPageURL = await processHTML(response);
//     response = await axios(nextPageURL);
//     nextPageURL = await processHTML(response);
//     // console.log(businesswireArr);
//     const transHTML = businesswireArr
//       .map((el) => transactionTemplate(transactionTemp, el))
//       .join("");
//     output = indexPage.replace("{%TRANS-TEMPLATE%}", transHTML);
//   } catch (err) {
//     console.log(err);
//     throw err;
//   }
// };

let response;
let nextPageURL;

const businesswireScraping = async function () {
  try {
    while (!foundChosenDate.finishDate) {
      response = await axios(businesswireURL);
      nextPageURL = await processHTML(response);
    }
    // console.log(businesswireArr);
    const transHTML = businesswireArr
      .map((el) => transactionTemplate(transactionTemp, el))
      .join("");
    return indexPage.replace("{%TRANS-TEMPLATE%}", transHTML);
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const verifyDate = function (enteredDate) {
  const dateDiff = (new Date() - new Date(enteredDate)) / (1000 * 3600 * 24);
  if (dateDiff >= 0 && dateDiff <= 7) return true;
  else return false;
};

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

app.get("/", function (req, res) {
  // res.writeHead(200, { "content-type": "text/html" });
  res.send(indexPage);
});

app.get(`/results.html`, async (req, res) => {
  chosenDate =
    getDate(new Date(req.query.chosenDate?.replace(/-/g, ","))) ||
    getDate(new Date());

  if (verifyDate(chosenDate)) {
    // console.log(`chosenDate is T/F: ${verifyDate(chosenDate)}`);
    // console.log(`chosen date after post request is ${chosenDate}`);
    resetVariable();
    output = await businesswireScraping();

    res.send(output);
  } else res.sendFile(indexPage);
});

const resetVariable = function () {
  businesswireArr.splice(0, businesswireArr.length); // Empty the array each run
  output = "";
  businesswireURL =
    "https://www.businesswire.com/portal/site/home/news/subject/?vnsId=31333";
  foundChosenDate.foundDate = false;
  foundChosenDate.finishDate = false;
};
// app.post("/", urlencodedParser, function (req, res) {
//   console.log(req.body);
// });

// console.log(`Doing replace ${req.query.chosenDate.replace(/-/g, ",")}`);
// console.log(`chosen date before converting ${req.query.chosenDate}`);
