<template>
  <div class="work-container">
    <div class="work-content">
      <div class="work-header">
        <h2>📞 Gestión de Tipificaciones</h2>
        <button @click="openPopupWindow" class="btn-open-form">
          <span>📋</span> Abrir Formulario de Tipificación
        </button>
      </div>
      <div class="work-info">
        <p>El formulario de tipificaciones se abrirá en una ventana popup.</p>
        <p>Si el navegador bloquea el popup, permite ventanas emergentes para este sitio.</p>
      </div>
    </div>
  </div>
</template>

<script>
import qs from 'qs';

export default {
  name: 'Work',
  data() {
    return {
      idAgent: null,
      popupWindow: null
    };
  },
  mounted() {
    // Obtener usuario del store o sessionStorage
    let user = this.$store.state.user;
    
    if (!user) {
      try {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
          user = qs.parse(userStr);
          this.$store.commit('setUser', user);
        }
      } catch (err) {
        console.error('❌ Error parseando usuario de sessionStorage:', err);
      }
    }
    
    // Obtener idAgent del usuario
    this.idAgent = user?.idAgent;
    
    if (!this.idAgent) {
      console.error('❌ No se encontró idAgent para el usuario');
      this.$router.push('/dashboard');
      return;
    }
  },
  methods: {
    openPopupWindow() {
      if (!this.idAgent) {
        console.error('❌ No hay idAgent para abrir el formulario');
        return;
      }
      
      // Construir URL completa del formulario EJS
      const baseUrl = window.location.origin;
      const formUrl = `${baseUrl}/api/tipificacion/formulario/${this.idAgent}`;
      
      // Características de la ventana popup
      const popupFeatures = [
        'width=1400',
        'height=900',
        'left=' + (screen.width / 2 - 700),
        'top=' + (screen.height / 2 - 450),
        'scrollbars=yes',
        'resizable=yes',
        'toolbar=no',
        'menubar=no',
        'location=no',
        'status=no',
        'directories=no'
      ].join(',');
      
      // Abrir ventana popup del navegador (debe ser desde evento de usuario)
      this.popupWindow = window.open(formUrl, 'TipificacionFormulario_' + this.idAgent, popupFeatures);
      
      // Verificar si se abrió correctamente
      if (!this.popupWindow || this.popupWindow.closed || typeof this.popupWindow.closed === 'undefined') {
        // El popup fue bloqueado
        alert('⚠️ El navegador bloqueó la ventana popup.\n\nPor favor:\n1. Permite ventanas emergentes para este sitio\n2. Haz clic en el botón nuevamente');
      } else {
        // Enfocar la ventana popup
        this.popupWindow.focus();
      }
    }
  },
  beforeUnmount() {
    // Cerrar popup si está abierto al desmontar el componente
    if (this.popupWindow && !this.popupWindow.closed) {
      this.popupWindow.close();
    }
  }
};
</script>

<style scoped>
/* Contenedor principal */
.work-container {
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 200px);
}

.work-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e9ecef;
}

.work-header h2 {
  margin: 0;
  color: #344767;
  font-weight: 600;
  font-size: 2rem;
}

.btn-open-form {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-open-form:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
}

.btn-open-form:active {
  transform: translateY(0);
}

.btn-open-form span {
  font-size: 1.3rem;
}

.work-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  color: #67748e;
  line-height: 1.8;
  border-left: 4px solid #667eea;
}

.work-info p {
  margin: 0.75rem 0;
  font-size: 1rem;
}

.work-info p:first-child {
  margin-top: 0;
}

.work-info p:last-child {
  margin-bottom: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .work-content {
    padding: 1rem;
  }
  
  .work-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
  
  .work-header h2 {
    font-size: 1.5rem;
  }
  
  .btn-open-form {
    width: 100%;
    justify-content: center;
  }
}
</style>
