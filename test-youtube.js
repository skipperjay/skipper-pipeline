require('dotenv').config();
const https = require('https');

const channelId = process.env.YOUTUBE_CHANNEL_ID;
const apiKey = process.env.YOUTUBE_API_KEY;

console.log('Channel ID:', channelId);
console.log('API Key (first 8 chars):', apiKey ? apiKey.substring(0, 8) + '...' : 'NOT SET');

if (!channelId || !apiKey) {
  console.error('❌ Missing env vars — check your .env file');
  process.exit(1);
}

const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('\nFull API response:');
    console.log(JSON.stringify(json, null, 2));

    if (json.items && json.items.length > 0) {
      console.log('\n✅ Channel found:', json.items[0].snippet.title);
    } else {
      console.log('\n❌ No items returned — channel ID is likely wrong');
      console.log('Tip: Channel ID must start with UC (e.g. UCxxxxxxxxxxxxxx)');
      console.log('Find it: YouTube Studio → Settings → Channel → Advanced settings');
    }
  });
}).on('error', (e) => {
  console.error('❌ Request error:', e.message);
});
