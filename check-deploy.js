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

async function checkDeployStatus() {
  console.log('📋 Checking deployment status...\n');
  
  const res = await makeRequest(
    'api.render.com',
    '/v1/services/srv-d6bgqbmr433s73d54jcg/deploys',
    'GET',
    {
      'Accept': 'application/json',
      'Authorization': 'Bearer rnd_Rh6HKo3qpfqgrWZDlJ7Si4QI97yc'
    }
  );
  
  console.log('Raw Data Structure:');
  console.log(JSON.stringify(res.data, null, 2));
}

checkDeployStatus().catch(console.error);
