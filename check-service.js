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

async function checkServiceInfo() {
  // Check service info from Render API
  console.log('📋 Checking service details from Render API...\n');
  
  const res = await makeRequest(
    'api.render.com',
    '/v1/services/srv-d6bgqbmr433s73d54jcg',
    'GET',
    {
      'Accept': 'application/json',
      'Authorization': 'Bearer rnd_Rh6HKo3qpfqgrWZDlJ7Si4QI97yc'
    }
  );
  
  console.log('Service Status:', res.status);
  console.log('Service Data:', JSON.stringify(res.data, null, 2));
  
  if (res.data.service) {
    const svc = res.data.service;
    console.log('\n🌐 Service Name:', svc.name);
    console.log('🔗 Live URL:', `https://${svc.serviceDetails?.url || svc.name + '.onrender.com'}`);
    console.log('📊 Service State:', svc.serviceSuspended === 'not_suspended' ? 'Active' : 'Suspended');
    if (svc.serviceDetails?.lastDeployedAt) {
      console.log('🚀 Last Deployed:', svc.serviceDetails.lastDeployedAt);
    }
  }
}

checkServiceInfo().catch(console.error);
