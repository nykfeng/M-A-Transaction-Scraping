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

const resetVariable = function (arr, html, url, dateBoolean) {
  arr.splice(0, arr.length); // Empty the array each run
  html = "";
  url =
    "https://www.businesswire.com/portal/site/home/news/subject/?vnsId=31333";
  dateBoolean.foundDate = false;
  dateBoolean.finishDate = false;
};

module.exports = {
  verifyDate,
  getDate,
  resetVariable,
};
