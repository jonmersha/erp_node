async function test() {
  const urls = [
    'http://localhost:4000/api/factories?companyId=1',
    'http://localhost:4000/api/warehouses?companyId=1',
    'http://localhost:4000/api/rawMaterials?companyId=1'
  ];

  for (let url of urls) {
    try {
      console.log('Fetching', url);
      const res = await fetch(url, { headers: { Authorization: 'Bearer test' }});
      console.log('Status:', res.status);
    } catch(e) {
      console.error('Error for', url, e.message);
    }
  }
}
test();
