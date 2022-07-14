const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');

const { NUMBER_MAP } = require('./number_mapping.js');

const getAllEpisodeURLs = async (page) => {
  await page.goto('https://musicforprogramming.net/latest', { waitUntil: 'domcontentloaded' });

  const results = await page.evaluate(() => {
    const elems = Array.from(document.querySelectorAll('a'));
    const urls = elems.map(elem => elem.href);
    return urls;
  });

  const episodeURLs = results.filter(url => NUMBER_MAP.hasOwnProperty(url.split('/').pop()));

  return episodeURLs;
}

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const urls = await getAllEpisodeURLs(page);

    for (let i = 0; i < urls.length; i++) {
      // Load page
      await page.goto(urls[i], { waitUntil: 'networkidle0' });
      console.log('Loaded page:', urls[i]);

      // Get mp3 URL
      const mp3URL = await page.evaluate(() => {
        const elems = Array.from(document.querySelectorAll('section#content a'));
        return elems[0].href;
      });

      // Download mp3 file
      const currentDownload = new Promise((resolve, reject) => {
        console.log('Downloading', mp3URL, '...');

        https.get(mp3URL, (res) => {

          if (res.statusCode !== 200) {
            reject('Error downloading .mp3 file!');
          }

          const path = `mp3s/${mp3URL.split('/').pop()}`;
          const writeStream = fs.createWriteStream(path);

          res.pipe(writeStream);

          writeStream.on('finish', () => {
            writeStream.close();
            console.log('Download complete');
            resolve();
          })
        });
      });

      await currentDownload;
    }
    console.log('Downloaded all .mp3 files');

    await browser.close();
    console.log('Browser closed!');
  } catch (err) {
    console.error(err);
  }
})();