
const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/convert', async (req, res) => {
  const { html, duration = 60 } = req.body;
  
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const videoPath = `/tmp/video_${Date.now()}.webm`;
    const recorder = await page.screencast({ path: videoPath });
    
    await new Promise(resolve => setTimeout(resolve, duration * 1000));
    await recorder.stop();
    await browser.close();

    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Content-Disposition', 'attachment; filename=video.webm');
    
    const videoBuffer = fs.readFileSync(videoPath);
    res.send(videoBuffer);
    
    fs.unlinkSync(videoPath);

  } catch (error) {
    await browser.close();
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
