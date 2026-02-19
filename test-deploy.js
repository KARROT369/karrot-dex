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

async function waitForDeploy() {
  console.log('Checking deployment status...\n');
  
  for (let i = 0; i < 30; i++) {
    const res = await makeRequest(
      'api.render.com',
      '/v1/services/srv-d6bgqbmr433s73d54jcg/deploys',
      'GET',
      {
        'Accept': 'application/json',
        'Authorization': 'Bearer rnd_Rh6HKo3qpfqgrWZDlJ7Si4QI97yc'
      }
    );
    
    const deploys = Array.isArray(res.data) ? res.data : [];
    if (deploys.length > 0) {
      const latest = deploys[0];
      console.log(`Status: ${latest.status} | Commit: ${latest.commit?.id?.substring(0, 7)} | Created: ${latest.createdAt}`);
      
      if (['live', 'canceled', 'failed'].includes(latest.status)) {
        console.log('\n✅ Deployment finished with status:', latest.status);
        return latest.status;
      }
    }
    
    // Wait 10 seconds
    await new Promise(r => setTimeout(r, 10000));
    console.log('...checking again in 10s...');
  }
  
  throw new Error('Timeout waiting for deployment');
}

async function testApi() {
  console.log('\n🔍 Testing POST /api/ask...');
  
  const testRes = await makeRequest(
    'karrot-shrive.onrender.com',
    '/api/ask',
    'POST',
    { 'Content-Type': 'application/json' },
    JSON.stringify({ question: 'Hello, can you describe yourself in one sentence?' })
  );
  
  console.log('Status:', testRes.status);
  console.log('Response:', JSON.stringify(testRes.data, null, 2));
  
  // Verify the response
  if (testRes.data.mode === 'llm') {
    console.log('\n✅ SUCCESS: mode is "llm" (AI-generated response)');
  } else if (testRes.data.mode === 'rules') {
    console.log('\n❌ FAILED: mode is "rules" (scripted response) - deployment issue');
  } else {
    console.log('\n⚠️  mode is:', testRes.data.mode);
  }
}

async function main() {
  const status = await waitForDeploy();
  if (status === 'live') {
    // Wait a moment for service to be fully ready
    console.log('\nWaiting 5s for service to stabilize...');
    await new Promise(r => setTimeout(r, 5000));
    await testApi();
  }
}

main().catch(console.error);
