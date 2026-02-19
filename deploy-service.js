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

async function deploy() {
  console.log('🚀 Triggering deployment with commit 3c22f65...\n');
  
  const deployRes = await makeRequest(
    'api.render.com',
    '/v1/services/srv-d6bgqbmr433s73d54jcg/deploys',
    'POST',
    {
      'Accept': 'application/json',
      'Authorization': 'Bearer rnd_Rh6HKo3qpfqgrWZDlJ7Si4QI97yc',
      'Content-Type': 'application/json'
    },
    JSON.stringify({ commitId: '3c22f65', clearCache: 'do_not_clear' })
  );
  
  console.log('Deploy Response Status:', deployRes.status);
  console.log('Deploy Response:', JSON.stringify(deployRes.data, null, 2));
  return deployRes.data;
}

deploy().catch(console.error);
