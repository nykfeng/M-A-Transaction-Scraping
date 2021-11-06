module.exports = (temp, transDetail) => {
  let output = temp.replace(/{%TRANS-TITLE%}/g, transDetail.transactionTitle);
  output = output.replace(/{%TRANS-URL%}/g, transDetail.transactionUrl);
  output = output.replace(/{%IMAGE-SOURCE%}/g, transDetail.transactionImage);
  output = output.replace(/{%TRANS-DATE%}/g, transDetail.transactionDate);

  return output;
};
