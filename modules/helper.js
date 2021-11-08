const utilities = require("./utilities.js");

const verifyDate = function (enteredDate) {
  const dateDiff = (new Date() - new Date(enteredDate)) / (1000 * 3600 * 24);
  if (dateDiff >= 0 && dateDiff <= 7) return true;
  else return false;
};

const getDate = function (date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};

const fixDateString = function (dateString) {
  // November 05, 2021 22:59 ET taking this date format and return November 05, 2021
  return dateString.substring(
    0,
    dateString.indexOf(new Date().getFullYear()) + 4
  );
};

const fixPRnewswireTitleString = function (titleString) {
  return titleString
    .substring(titleString.indexOf("</small>") + 8, titleString.length)
    .replace(/\n/g, "");
};

const resetVariable = function () {
  utilities.transactionTile.splice(0, utilities.transactionTile.length);
  utilities.dataResults.splice(0, utilities.dataResults.length); // Empty the array each run
  utilities.output = "";
  utilities.transactionCount = 0;
  utilities.foundChosenDate.foundDate = false;
  utilities.foundChosenDate.finishDate = false;
};

module.exports = {
  verifyDate,
  getDate,
  fixDateString,
  fixPRnewswireTitleString,
  resetVariable,
};
