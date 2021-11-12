const btnExport = document.getElementById("download-button");
const dataToExport = [
  "Transaction Title,",
  "Transaction Link,",
  "Transaction Date\n",
];

window.addEventListener("load", function () {
  (async function () {
    try {
      const response = await fetch(
        `https://mnatransactionscraping.herokuapp.com/results.json`
      );
      // const response = await fetch(`http://localhost:8000/results.json`);
      const data = await response.json();

      data.map((each) => {
        dataToExport.push(
          (/[,]/.test(each.transactionTitle)
            ? `"${each.transactionTitle}"`
            : each.transactionTitle) + ","
        );
        dataToExport.push(
          (/[",\n]/.test(each.transactionUrl)
            ? `"${each.transactionUrl}"`
            : each.transactionUrl) + ","
        );
        dataToExport.push(each.transactionDate + "\n");
      });
    } catch (err) {
      console.log(err);
      throw err;
    }
  })();
  btnExport.addEventListener("click", () => {
    const csvBlob = new Blob(dataToExport, { type: "text/csv" });
    const blobUrl = URL.createObjectURL(csvBlob);
    const anchorElement = document.createElement("a");

    anchorElement.href = blobUrl;
    anchorElement.download = "M&A Transaction List.csv";
    anchorElement.click();

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 500);
  });
});
