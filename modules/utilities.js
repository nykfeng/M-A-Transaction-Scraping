const businesswireUrl =
  "https://www.businesswire.com/portal/site/home/news/subject/?vnsId=31333";
const globenewswireUrl =
  "https://www.globenewswire.com/search/subject/mna?page=1";
const prnewswireUrl =
  "https://www.prnewswire.com/news-releases/financial-services-latest-news/acquisitions-mergers-and-takeovers-list/?page=1&pagesize=100";
const biospaceUrl = "https://www.biospace.com/news/mergers-and-acquisitions/";

let chosenDate;
let output; // transaction tile output in HTML
let transactionCount = 0; // Counting the total number of transaction for the day
const foundChosenDate = {
  // This is used to find if the algo reached the desired date and finished going thru the same date
  foundDate: false,
  finishDate: false,
};
const dataResults = []; //To store transaction title, url, date, image
const transactionTile = []; // To store display tile HTML
let jsonFile = [];

module.exports = {
  businesswireUrl,
  globenewswireUrl,
  prnewswireUrl,
  biospaceUrl,
  chosenDate,
  transactionCount,
  foundChosenDate,
  dataResults,
  transactionTile,
  output,
  jsonFile,
};
