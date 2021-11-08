const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const fs = require("fs");
const url = require("url");
const languageDetect = require("languagedetect");
const transactionTemplate = require("./modules/transactionTemplate.js");
const helper = require("./modules/helper.js");
const utilities = require("./modules/utilities.js");
const processHtml = require("./modules/processHtml.js");
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

const scraping = async function (websiteUrl, processingFunction) {
  let response;
  let nextPageURL = websiteUrl;
  utilities.foundChosenDate.finishDate = false;
  // Empty this data storage array each time a new website is visited

  utilities.dataResults.splice(0, utilities.dataResults.length);
  try {
    while (!utilities.foundChosenDate.finishDate) {
      console.log(nextPageURL);
      response = await axios(nextPageURL);
      nextPageURL = await processingFunction(response);
    }
    // console.log(businesswireArr);

    utilities.transactionCount += utilities.dataResults.length;
    return utilities.dataResults
      .map((el) => transactionTemplate(transactionTemp, el))
      .join("");
  } catch (err) {
    console.log(err);
    throw err;
  }
};

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

app.get("/", function (req, res) {
  res.send(indexPage);
});

app.get("/results", async (req, res) => {
  utilities.chosenDate = helper.getDate(
    req.query.chosenDate.length != 0
      ? new Date(req.query.chosenDate.replace(/-/g, ","))
      : new Date()
  );

  if (helper.verifyDate(utilities.chosenDate)) {
    helper.resetVariable();
    utilities.transactionTile.push(
      await scraping(utilities.prnewswireUrl, processHtml.prnewswire)
    );
    utilities.transactionTile.push(
      await scraping(utilities.businesswireUrl, processHtml.businesswire)
    );
    utilities.transactionTile.push(
      await scraping(utilities.globenewswireUrl, processHtml.globenewswire)
    );

    if (utilities.dataResults.length === 0) {
      res.send(indexPage.replace("{%TRANS-TEMPLATE%}", "<h1>No Results</h1>"));
    } else {
      console.log(
        `Total number of transaction for the date is ${utilities.transactionCount}`
      );
      utilities.output = indexPage.replace(
        "{%TRANS-TEMPLATE%}",
        utilities.transactionTile.join("")
      );
      utilities.output = utilities.output.replace(
        "{%TRANS-NUMBER%}",
        utilities.transactionCount
      );
      res.send(utilities.output);
    }
  } else {
    res.send(indexPage.replace("{%TRANS-TEMPLATE%}", "<h1>Invalid Date</h1>"));
  }
});
