export default {
  methods: {
    showToast(message, type = 'info') {
      // Usar el sistema de toast global si está disponible
      if (window.showToast) {
        window.showToast(message, type);
        return;
      }
      
      // Fallback a console según el tipo
      switch (type) {
        case 'success':
          break;
        case 'error':
          console.error('❌ Error:', message);
          break;
        case 'warning':
          console.warn('⚠️ Warning:', message);
          break;
        case 'info':
        default:
          console.info('ℹ️ Info:', message);
          break;
      }
    },
    $toast: {
      success() {
        // Toast de éxito (sin mensaje)
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