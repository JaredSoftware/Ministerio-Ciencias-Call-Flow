<template>
  <div class="status-validation">
    <div class="validation-header">
      <h6>🔍 Validación de Estados</h6>
      <button @click="validateStatuses" class="btn btn-sm btn-primary">
        Validar Estados
      </button>
    </div>
    
    <div v-if="validation" class="validation-results">
      <div class="summary">
        <div class="summary-item">
          <span class="label">Esperados:</span>
          <span class="value">{{ validation.expected }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Actuales:</span>
          <span class="value">{{ validation.actual }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Coinciden:</span>
          <span class="value">{{ validation.matching }}</span>
        </div>
      </div>
      
      <div v-if="validation.missing.length > 0" class="section">
        <h6 class="section-title text-danger">❌ Estados Faltantes ({{ validation.missing.length }})</h6>
        <div class="status-list">
          <div v-for="status in validation.missing" :key="status.value" class="status-item missing">
            <span class="status-value">{{ status.value }}</span>
            <span class="status-label">{{ status.label }}</span>
            <span class="status-category">{{ status.category }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="validation.extra.length > 0" class="section">
        <h6 class="section-title text-warning">⚠️ Estados Extra ({{ validation.extra.length }})</h6>
        <div class="status-list">
          <div v-for="status in validation.extra" :key="status.value" class="status-item extra">
            <span class="status-value">{{ status.value }}</span>
            <span class="status-label">{{ status.label }}</span>
            <span class="status-category">{{ status.category }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="validation.mismatched.length > 0" class="section">
        <h6 class="section-title text-warning">⚠️ Estados con Diferencias ({{ validation.mismatched.length }})</h6>
        <div class="status-list">
          <div v-for="item in validation.mismatched" :key="item.expected.value" class="status-item mismatched">
            <span class="status-value">{{ item.expected.value }}</span>
            <div class="comparison">
              <span class="expected">Esperado: {{ item.expected.label }} ({{ item.expected.category }})</span>
              <span class="actual">Actual: {{ item.actual.label }} ({{ item.actual.category }})</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="validation.allPresent && validation.allMatch" class="section">
        <div class="success-message">
          <i class="fas fa-check-circle text-success"></i>
          <span>Todos los estados están sincronizados correctamente</span>
        </div>
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Validando estados...</span>
    </div>
    
    <div v-if="error" class="error-message">
      <i class="fas fa-exclamation-triangle text-danger"></i>
      <span>{{ error }}</span>
    </div>
  </div>
</template>

<script>
import axios from '@/router/services/axios';

export default {
  name: 'StatusValidation',
  data() {
    return {
      validation: null,
      loading: false,
      error: null
    };
  },
  methods: {
    async validateStatuses() {
      this.loading = true;
      this.error = null;
      this.validation = null;
      
      try {
        console.log('🔍 Iniciando validación de estados...');
        
        const response = await axios.get('/status-types/validate', {
          withCredentials: true
        });
        
        if (response.data.success) {
          this.validation = response.data.validation;
          console.log('✅ Validación completada:', this.validation);
        } else {
          this.error = response.data.message || 'Error en la validación';
        }
      } catch (error) {
        console.error('❌ Error validando estados:', error);
        this.error = 'Error de conexión: ' + error.message;
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    // Validar automáticamente al montar el componente
    this.validateStatuses();
  }
};
</script>

<style scoped>
.status-validation {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.validation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.validation-header h6 {
  margin: 0;
  color: #333;
}

.summary {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.summary-item .label {
  font-size: 0.8rem;
  color: #666;
}

.summary-item .value {
  font-weight: bold;
  font-size: 1.2rem;
  color: #333;
}

.section {
  margin-bottom: 1rem;
}

.section-title {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.85rem;
}

.status-item.missing {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.status-item.extra {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.status-item.mismatched {
  background: #d1ecf1;
  border: 1px solid #bee5eb;
  color: #0c5460;
}

.status-value {
  font-weight: bold;
  margin-right: 0.5rem;
  min-width: 80px;
}

.status-label {
  margin-right: 0.5rem;
  flex: 1;
}

.status-category {
  font-size: 0.75rem;
  opacity: 0.7;
}

.comparison {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.comparison .expected {
  font-size: 0.8rem;
  color: #28a745;
}

.comparison .actual {
  font-size: 0.8rem;
  color: #dc3545;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  color: #155724;
}

.loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #666;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
}
</style> 