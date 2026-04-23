const fs = require('fs');
const https = require('https');

function listModels() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const match = env.match(/GEMINI_API_KEY=([^\s]+)/);
  const apiKey = match ? match[1] : null;

  if (!apiKey) {
    console.error('API Key missing');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      console.log(data);
    });
  }).on('error', (err) => {
    console.error('Error:', err.message);
  });
}

listModels();
