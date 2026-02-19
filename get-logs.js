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

async function getLogs() {
  console.log('📋 Fetching service logs from Render...\n');
  
  const res = await makeRequest(
    'api.render.com',
    `/v1/services/srv-d6bgqbmr433s73d54jcg/logs`,
    'GET',
    {
      'Accept': 'application/json',
      'Authorization': 'Bearer rnd_Rh6HKo3qpfqgrWZDlJ7Si4QI97yc'
    }
  );
  
  console.log('Status:', res.status);
  console.log('Logs:', JSON.stringify(res.data, null, 2));
}

getLogs().catch(console.error);
