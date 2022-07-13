const puppeteer = require('puppeteer');
const { NUMBER_MAP } = require('./number_mapping.js');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://musicforprogramming.net/latest', { waitUntil: 'domcontentloaded' });

    const results = await page.evaluate(() => {
      const elems = Array.from(document.querySelectorAll('a'));
      const urls = elems.map(elem => elem.href);
      return urls;
    });

    const episodeURLs = results.filter(url => NUMBER_MAP.hasOwnProperty(url.split('/').pop()));
    console.log(episodeURLs);

    await browser.close();
  } catch (err) {
    console.error(err);
  }
})();