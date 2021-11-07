const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const fs = require("fs");
const url = require("url");
const languageDetect = require("languagedetect");
const transactionTemplate = require("./modules/transactionTemplate.js");
const helper = require("./modules/helper.js");
const { createHook } = require("async_hooks");
const { verify } = require("crypto");
const urlencodedParser = bodyParser.urlencoded({ extended: false });

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

const indexPage = fs.readFileSync(`${__dirname}/public/M&A.html`, "utf-8");
const transactionTemp = fs.readFileSync(
  `${__dirname}/public/template/transactionTemp.html`,
  "utf-8"
);

let businesswireURL =
  "https://www.businesswire.com/portal/site/home/news/subject/?vnsId=31333";
const businesswireArr = [];

let chosenDate = helper.getDate(new Date()); // Default the date to be today

// This is used to find if the algo reached the desired date and finished going thru the same date
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
    let transactionDate = helper.getDate(
      new Date($(this).find("time").attr("datetime"))
    );
    let transactionImage = $(this).find(".bwThumbs img").attr("src") || "";
    let titleLanguage =
      lngDetector.detect(transactionTitle).length === 0
        ? "Foreign"
        : lngDetector.detect(transactionTitle)[0][0];

    // console.log("chosen date " + chosenDate);

    if (
      new Date(transactionDate) - new Date(chosenDate) < 0 &&
      foundChosenDate.foundDate === false
    ) {
      foundChosenDate.finishDate = true;
    }
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
      // transactionDate != chosenDate &&
      new Date(transactionDate) - new Date(chosenDate) < 0 &&
      foundChosenDate.foundDate === true
    ) {
      foundChosenDate.finishDate = true;
    }
  });

  businesswireURL = `https://businesswire.com${
    $("#paging .pagingNext a").attr("href") || ""
  }`;
  return businesswireURL;
};
let output;

let response;
let nextPageURL;

const scraping = async function () {
  try {
    while (!foundChosenDate.finishDate) {
      // console.log(businesswireURL);
      response = await axios(businesswireURL);
      businesswireURL = await processHTML(response);
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

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

app.get("/", function (req, res) {
  // res.writeHead(200, { "content-type": "text/html" });
  res.send(indexPage);
});

app.get("/results", async (req, res) => {
  chosenDate =
    helper.getDate(new Date(req.query.chosenDate?.replace(/-/g, ","))) ||
    helper.getDate(new Date());

  if (helper.verifyDate(chosenDate)) {
    // console.log(`chosenDate is T/F: ${helper.verifyDate(chosenDate)}`);
    // console.log(`chosen date after post request is ${chosenDate}`);

    resetVariable();
    // console.log(businesswireArr);
    // console.log(output);
    // console.log(businesswireURL);
    // console.log(foundChosenDate);
    output = await scraping();

    res.send(output);
  } else res.send(indexPage);
});

const resetVariable = function () {
  businesswireArr.splice(0, businesswireArr.length); // Empty the array each run
  output = "";
  businesswireURL =
    "https://www.businesswire.com/portal/site/home/news/subject/?vnsId=31333";
  foundChosenDate.foundDate = false;
  foundChosenDate.finishDate = false;
};

// console.log(`Doing replace ${req.query.chosenDate.replace(/-/g, ",")}`);
// console.log(`chosen date before converting ${req.query.chosenDate}`);
