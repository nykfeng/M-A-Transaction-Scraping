const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const languageDetect = require("languagedetect");

const app = express();
const PORT = process.env.port || 8000;

app.use(express.static("public"));
app.set("view engine", "ejs");

let businesswireURL =
  "https://www.businesswire.com/portal/site/home/news/subject/?vnsId=31333";
const businesswireArr = [];

let withinToday = true;

// while (withinToday) {
axios(businesswireURL)
  .then((response) => {
    const html = response.data;
    const $ = cheerio.load(html);
    const lngDetector = new languageDetect();
    $(".bwNewsList li", html).each(function () {
      let transactionTitle = $(this).find("span[itemprop*='headline']").text();
      let transactionUrl = "businesswire.com" + $(this).find("a").attr("href");
      let transactionDate = getDate(
        new Date($(this).find("time").attr("datetime"))
      );
      if (transactionDate != getDate(new Date())) {
        withinToday = false;
        return;
      }
      if (lngDetector.detect(transactionTitle)[0][0] === "english") {
        businesswireArr.push({
          transactionTitle,
          transactionUrl,
          transactionDate,
        });
      }
    });
    console.log(businesswireArr);
    businesswireURL = `businesswire.com${$("#paging .pagingNext")
      .find("a")
      .attr("href")}`;
    console.log(businesswireURL);
  })
  .catch((err) => console.log(err));
// businesswireURL = document.querySelector("#paging .pagingNext a").href;
// }

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});

app.get("/", function (req, res) {
  res.render("view", {
    businesswireData: businesswireArr,
  });
});

const getDate = function (date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
};
