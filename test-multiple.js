const https = require('https');

function makeRequest(hostname, path, method, headers, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      path,
      method,
      headers: {
        ...headers,
        'User-Agent': 'Node.js'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testMultipleTimes() {
  console.log('Testing API 3 times to check mode...\n');
  
  for (let i = 1; i <= 3; i++) {
    console.log(`--- Test ${i} ---`);
    
    const testRes = await makeRequest(
      'karrot-shrine.onrender.com',
      '/api/ask',
      'POST',
      { 'Content-Type': 'application/json' },
      JSON.stringify({ message: 'What is your name?' })
    );
    
    console.log('Mode:', testRes.data.mode);
    console.log('llmAvailable:', testRes.data.llmAvailable);
    console.log('Response:', testRes.data.response || testRes.data.answer);
    console.log('');
    
    if (i < 3) {
      console.log('Waiting 2s before next test...\n');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

testMultipleTimes().catch(console.error);
