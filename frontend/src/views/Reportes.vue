<template>
  <div class="reportes-container">
    <h2 class="reportes-title">📊 Reportes</h2>
    <div class="reportes-filtros">
      <!-- Aquí irán los filtros de fecha, usuario, estado, etc. -->
      <p>Filtros próximamente...</p>
    </div>
    <div class="reportes-tabla">
      <!-- Aquí irá la tabla de resultados de reportes -->
      <p>Tabla de reportes próximamente...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Reportes',
};
</script>

<style scoped>
.reportes-container {
  background: #fff;
  border-radius: 12px;
  padding: 32px;
  margin: 32px auto;
  max-width: 1100px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.07);
}
.reportes-title {
  font-size: 2rem;
  color: #1976d2;
  margin-bottom: 24px;
  font-weight: 700;
}
.reportes-filtros {
  margin-bottom: 32px;
  background: #f8f9fa;
  padding: 16px 24px;
  border-radius: 8px;
}
.reportes-tabla {
  min-height: 200px;
  background: #f4f6fb;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  color: #888;
}
</style> 