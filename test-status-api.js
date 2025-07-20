const axios = require('axios');

async function testStatusAPI() {
  console.log('🧪 Probando API de estados...');
  
  try {
    // Probar la API de estados
    const response = await axios.get('http://localhost:9035/api/status-types', {
      withCredentials: true
    });
    
    console.log('✅ API Response:', response.status);
    console.log('📊 Datos:', response.data);
    
    if (response.data.success) {
      console.log(`✅ Estados encontrados: ${response.data.statuses.length}`);
      response.data.statuses.forEach(status => {
        console.log(`  - ${status.value}: ${status.label} (${status.color})`);
      });
    } else {
      console.log('❌ API no retornó success');
    }
    
  } catch (error) {
    console.error('❌ Error probando API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testStatusAPI(); 