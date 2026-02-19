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

async function waitAndTest() {
  console.log('⏳ Waiting for deployment to complete...\n');
  
  const startTime = Date.now();
  const timeout = 5 * 60 * 1000; // 5 minutes
  
  while (Date.now() - startTime < timeout) {
    const res = await makeRequest(
      'api.render.com',
      '/v1/services/srv-d6bgqbmr433s73d54jcg/deploys',
      'GET',
      {
        'Accept': 'application/json',
        'Authorization': 'Bearer rnd_Rh6HKo3qpfqgrWZDlJ7Si4QI97yc'
      }
    );
    
    const deploys = res.data;
    if (deploys && deploys.length > 0) {
      const latest = deploys[0].deploy;
      const status = latest.status;
      const commitId = latest.commit?.id?.substring(0, 7);
      
      process.stdout.write(`\rStatus: ${status} | Commit: ${commitId} | Elapsed: ${Math.floor((Date.now() - startTime)/1000)}s`);
      
      if (['live', 'canceled', 'failed'].includes(status)) {
        console.log('\n\n✅ Deployment finished with status:', status);
        
        if (status === 'live') {
          console.log('\n⏳ Waiting 10s for service to stabilize...');
          await new Promise(r => setTimeout(r, 10000));
          await testApi();
        }
        return;
      }
    }
    
    await new Promise(r => setTimeout(r, 5000));
  }
  
  console.log('\n\n⏰ Timeout waiting for deployment');
}

async function testApi() {
  console.log('\n🔍 Testing POST https://karrot-shrine.onrender.com/api/ask\n');
  
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
  
  console.log('\n--- Verification ---');
  if (testRes.data.mode === 'llm') {
    console.log('✅ SUCCESS: mode is "llm" (AI-generated response)');
  } else if (testRes.data.mode === 'rules') {
    console.log('❌ FAILED: mode is "rules" (scripted response)');
  } else if (testRes.data.error) {
    console.log('❌ ERROR:', testRes.data.error);
  }
  
  if (testRes.data.answer) {
    console.log('\n📝 Answer:', testRes.data.answer);
  }
}

waitAndTest().catch(console.error);
