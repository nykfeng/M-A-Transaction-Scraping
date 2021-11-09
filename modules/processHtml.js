const utilities = require("./utilities.js");
const cheerio = require("cheerio");
const languageDetect = require("languagedetect");
const helper = require("./helper.js");

// Using each website's name as the function name to process its HTML
const businesswire = async function (response) {
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

    if (
      new Date(transactionDate) - new Date(utilities.chosenDate) < 0 &&
      utilities.foundChosenDate.foundDate === false
    ) {
      utilities.foundChosenDate.finishDate = true;
    }
    if (transactionDate === utilities.chosenDate) {
      utilities.foundChosenDate.foundDate = true;
      if (titleLanguage === "english") {
        // We are only interested in English articles
        utilities.dataResults.push({
          transactionTitle,
          transactionUrl,
          transactionDate,
          transactionImage,
        });
      }
    } else if (
      new Date(transactionDate) - new Date(utilities.chosenDate) < 0 &&
      utilities.foundChosenDate.foundDate === true
    ) {
      utilities.foundChosenDate.finishDate = true;
    }
  });

  nextPageUrl = `https://businesswire.com${
    $("#paging .pagingNext a").attr("href") || ""
  }`;
  return nextPageUrl;
};

const globenewswire = async function (response) {
  const html = response.data;
  const $ = cheerio.load(html);
  const lngDetector = new languageDetect();
  const exclusionList = [
    "Rathbone Brothers Plc",
    "Dimensional Fund Advisors Ltd",
    "Investec Wealth & Investment Limited",
    "Proactive",
    "Fortune Business Insights",
    "Market Research Future",
  ];

  $(".pagnition-row", html).each(function () {
    let transactionTitle = $(this).find("a[data-autid=article-url]").text();
    let transactionUrl = `https://www.globenewswire.com/${$(this)
      .find("a[data-autid=article-url]")
      .attr("href")}`;
    let transactionDate = helper.getDate(
      new Date(helper.fixDateString($(this).find(".dataAndtimeH").text()))
    );
    let transactionImage = $(this).find("img").attr("src") || "";
    let source = $(this).find(".sourceLinkH a").text().trim();

    let titleLanguage =
      lngDetector.detect(transactionTitle).length === 0
        ? "Foreign"
        : lngDetector.detect(transactionTitle)[0][0];

    // -----------------------------------------------------------------------------
    // If the scraper past over the chosen date (from latest to oldest), the while loop should end
    // The while loop ends when utilities.foundChosenDate.finishDate is true
    // This condition (utilities.foundChosenDate.foundDate === false) is ued because sometimes
    // A chosen date does not have transactions, like weekends
    if (
      new Date(transactionDate) - new Date(utilities.chosenDate) < 0 &&
      utilities.foundChosenDate.foundDate === false
    ) {
      utilities.foundChosenDate.finishDate = true;
    }

    if (transactionDate === utilities.chosenDate) {
      utilities.foundChosenDate.foundDate = true;
      // Conditions to be considerd a valid transactions:
      // 1) in English 2) Not from the exclusion list
      if (
        titleLanguage === "english" &&
        exclusionList.find((el) => el === source) === undefined
      ) {
        utilities.dataResults.push({
          transactionTitle,
          transactionUrl,
          transactionDate,
          transactionImage,
        });
      }
    }
    // If transaction date is older than chosen date, so the program has gone through all necessary transactions
    // If foundDate is true, it means it has found the chosen date transactions
    else if (
      new Date(transactionDate) - new Date(utilities.chosenDate) < 0 &&
      utilities.foundChosenDate.foundDate === true
    ) {
      utilities.foundChosenDate.finishDate = true; // Used to break out of the while loop when condition breaks
    }
  });
  nextPageUrl = `https://www.globenewswire.com${
    $(".pagnition-container .pagnition-next a").attr("href") || ""
  }`;
  return nextPageUrl;
};

const prnewswire = async function (response) {
  const html = response.data;
  const $ = cheerio.load(html);

  $("div[lang=en-US]", html).each(function () {
    let transactionTitle = helper.fixPRnewswireTitleString(
      $(this).find(".card h3").html()
    );
    let transactionUrl = `https://www.prnewswire.com${$(this)
      .find(".newsreleaseconsolidatelink")
      .attr("href")}`;
    let transactionDate = $(this).find(".card h3 > small").text();
    transactionDate = helper.getDate(
      transactionDate.length < 10
        ? new Date()
        : new Date(helper.fixDateString(transactionDate))
    );

    let transactionImage = $(this).find(".card img").attr("src") || "";

    // console.log(`transactionTitle: ${transactionTitle}`);
    // console.log(`transactionUrl: ${transactionUrl}`);
    // console.log(`transactionDate: ${transactionDate}`);
    // console.log(`transactionImage: ${transactionImage}`);

    // -----------------------------------------------------------------------------
    // If the scraper past over the chosen date (from latest to oldest), the while loop should end
    // The while loop ends when utilities.foundChosenDate.finishDate is true
    // This condition (utilities.foundChosenDate.foundDate === false) is ued because sometimes
    // A chosen date does not have transactions, like weekends
    if (
      new Date(transactionDate) - new Date(utilities.chosenDate) < 0 &&
      utilities.foundChosenDate.foundDate === false
    ) {
      utilities.foundChosenDate.finishDate = true;
    }

    if (transactionDate === utilities.chosenDate) {
      utilities.foundChosenDate.foundDate = true;

      utilities.dataResults.push({
        transactionTitle,
        transactionUrl,
        transactionDate,
        transactionImage,
      });
    } else if (
      new Date(transactionDate) - new Date(utilities.chosenDate) < 0 &&
      utilities.foundChosenDate.foundDate === true
    ) {
      utilities.foundChosenDate.finishDate = true; // Used to break out of the while loop when condition breaks
    }
  });
  nextPageUrl = `https://www.prnewswire.com/news-releases/financial-services-latest-news/acquisitions-mergers-and-takeovers-list/${
    $(".pagination a[aria-label=Next]").attr("href") || ""
  }`;
  return nextPageUrl;
};

module.exports = { businesswire, globenewswire, prnewswire };
