export default {
  methods: {
    $toast: {
      success(message) {
        console.log('✅ Success:', message);
      },
      error(message) {
        console.error('❌ Error:', message);
      },
      warning(message) {
        console.warn('⚠️ Warning:', message);
      },
      info(message) {
        console.info('ℹ️ Info:', message);
      }
    }
  }
}; 