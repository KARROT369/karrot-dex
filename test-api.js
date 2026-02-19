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

async function testApi() {
  console.log('🔍 Testing POST https://karrot-shrine.onrender.com/api/ask\n');
  
  const testRes = await makeRequest(
    'karrot-shrine.onrender.com',
    '/api/ask',
    'POST',
    { 'Content-Type': 'application/json' },
    JSON.stringify({ message: 'Hello, can you describe yourself in one sentence?' })
  );
  
  console.log('HTTP Status:', testRes.status);
  console.log('\nResponse Data:');
  console.log(JSON.stringify(testRes.data, null, 2));
  
  // Verify the response
  console.log('\n--- Verification ---');
  if (testRes.data.mode === 'llm') {
    console.log('✅ SUCCESS: mode is "llm" (AI-generated response)');
  } else if (testRes.data.mode === 'rules') {
    console.log('❌ FAILED: mode is "rules" (scripted response)');
  } else if (testRes.data.error) {
    console.log('❌ ERROR:', testRes.data.error);
  } else {
    console.log('⚠️  mode returned:', testRes.data.mode || 'undefined');
  }
  
  if (testRes.data.answer) {
    console.log('\n📝 Answer preview:', testRes.data.answer.substring(0, 150) + (testRes.data.answer.length > 150 ? '...' : ''));
  }
  
  return testRes.data;
}

testApi().catch(console.error);
