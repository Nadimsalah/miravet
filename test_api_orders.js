async function testApi() {
    const amId = 'a54217ae-50fc-4680-8a48-15d9eac0ad1c'; // Soumiya
    const url = `http://localhost:3000/api/manager/orders?amId=${amId}`;
    console.log(`Testing API: ${url}`);
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testApi();
