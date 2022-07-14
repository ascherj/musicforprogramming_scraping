const puppeteer = require('puppeteer');
const https = require('https');
const fs = require('fs');

const { NUMBER_MAP } = require('./number_mapping.js');

const getAllEpisodeURLs = async (page) => {
  // Load page
  await page.goto('https://musicforprogramming.net/latest', { waitUntil: 'domcontentloaded' });

  // Get URLs from all <a> elements
  const results = await page.evaluate(() => {
    const elems = Array.from(document.querySelectorAll('a'));
    const urls = elems.map(elem => elem.href);
    return urls;
  });

  // Determine which URLs are episode URLs
  const episodeURLs = results.filter(url => NUMBER_MAP.hasOwnProperty(url.split('/').pop()));

  return episodeURLs;
}

const getMP3URL = async (page, episodeURL) => {
  // Load page
  await page.goto(episodeURL, { waitUntil: 'networkidle0' });
  console.log('Loaded page:', episodeURL);

  // Get mp3 URL
  const mp3URL = await page.evaluate(() => {
    const elems = Array.from(document.querySelectorAll('section#content a'));
    return elems[0].href;
  });

  return mp3URL;
}

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const episodeURLs = await getAllEpisodeURLs(page);

    for (let i = 0; i < episodeURLs.length; i++) {
      const episodeURL = episodeURLs[i];
      const mp3URL = await getMP3URL(page, episodeURL);

      // Download mp3 file
      const currentDownload = new Promise((resolve, reject) => {
        console.log('Downloading', mp3URL, '...');

        https.get(mp3URL, (res) => {

          if (res.statusCode !== 200) {
            reject('Error downloading .mp3 file!');
          }

          const path = `mp3s/${mp3URL.split('/').pop()}`;
          const writeStream = fs.createWriteStream(path);

          // Write .mp3 to disk
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