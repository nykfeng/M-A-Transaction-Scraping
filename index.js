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

// Reading the HTML files for HTML manipulation later
const indexPage = fs.readFileSync(`${__dirname}/public/M&A.html`, "utf-8");
const transactionTemp = fs.readFileSync(
  `${__dirname}/public/template/transactionTemp.html`,
  "utf-8"
);

// The main control function
// Loop through the transaction by dates, from newest date to oldest date
// It stops when the transaction date is older than the chosen date
const scraping = async function (websiteUrl, processingFunction) {
  let response;
  let nextPageURL = websiteUrl; // Set which website to start with
  utilities.foundChosenDate.finishDate = false; // Set the while loop break condition to be false

  utilities.dataResults.splice(0, utilities.dataResults.length); // Empty this data storage array each time a new website is visited

  try {
    while (!utilities.foundChosenDate.finishDate) {
      // console.log(nextPageURL);
      response = await axios(nextPageURL);
      nextPageURL = await processingFunction(response);
    }
    // console.log(utilities.dataResults);

    utilities.transactionCount += utilities.dataResults.length; // Counting the number of transactions
    return utilities.dataResults
      .map((el) => transactionTemplate(transactionTemp, el))
      .join("");
    // Each data point here is inserted into transaction HTML template
    // And then they will all be joined together to add to the result page
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
  // Use url query to determine which date was input to scrape
  // Test if the date was correct, otherwise default to today
  utilities.chosenDate = helper.getDate(
    req.query.chosenDate.length != 0
      ? new Date(req.query.chosenDate.replace(/-/g, ","))
      : new Date()
  );

  // The if condition is that the date is betwee today and 7 days prior
  if (helper.verifyDate(utilities.chosenDate)) {
    // Each time a date is chosen, these variables should be reset
    helper.resetVariable();

    // Add the transaction HTML template of each website into this array
    utilities.transactionTile.push(
      await scraping(utilities.prnewswireUrl, processHtml.prnewswire)
    );
    utilities.transactionTile.push(
      await scraping(utilities.businesswireUrl, processHtml.businesswire)
    );
    utilities.transactionTile.push(
      await scraping(utilities.globenewswireUrl, processHtml.globenewswire)
    );

    // If the no results were found
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
