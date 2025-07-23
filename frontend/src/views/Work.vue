<template>
  <div class="work-container">
    <div class="work-sidebar">
      <h5>INFORMACIÓN DEL CLIENTE</h5>
      <table class="client-info-table">
        <tr><td><b>Cliente:</b></td><td>Tipificación estándar</td></tr>
        <tr><td><b>T. Documento:</b></td><td>1</td></tr>
        <tr><td><b>Doc. No.:</b></td><td>0000</td></tr>
        <tr><td><b>Teléfono:</b></td><td>No Info</td></tr>
        <tr><td><b>Correo:</b></td><td>No Info</td></tr>
        <tr><td><b>Departamento:</b></td><td>No Info</td></tr>
        <tr><td><b>Municipio:</b></td><td>No Info</td></tr>
      </table>
      <button class="btn-update">Actualizar</button>
    </div>
    <div class="work-main">
      <div class="tipificacion-header">
        <button class="tab-active">TIPIFICACIONES</button>
      </div>
      <div class="tipificacion-form">
        <h4>Formulario de Tipificación</h4>
        <div class="form-row">
          <label for="nivel1">Nivel 1</label>
          <select id="nivel1">
            <option>Selecciona una opción...</option>
          </select>
        </div>
        <div class="form-row">
          <label for="observaciones">Observaciones</label>
          <textarea id="observaciones" placeholder="Escribe tus observaciones aquí..."></textarea>
        </div>
      </div>
    </div>
    <div class="work-history">
      <h5>Historial de Transferencias</h5>
      <div class="history-list">
        <div class="history-item">
          <div class="history-header">
            <span class="history-index">1 -</span>
            <span class="history-skl">SKL:CAN_001</span>
            <span class="history-vdn">VDN:20000001</span>
            <span class="history-asr">ASR:Pruebas PC</span>
          </div>
          <table class="history-table">
            <tr><th>Autogestión IVR</th><th>Tipificación Asesor</th></tr>
            <tr><td>UIIERR</td><td>CANAL TELEFÓNICO Y CORREOS ELECTRÓNICOS</td></tr>
            <tr><td>UIIERR</td><td>Aplicativos</td></tr>
            <tr><td>UIIERR</td><td>SGD - SISTEMA DE GESTIÓN DE DATOS (BODEGA DE DATOS SISPRO)</td></tr>
            <tr><td>UIIERR</td><td>PROBLEMAS DE CONEXIÓN CON LOS CUBOS</td></tr>
            <tr><td>UIIERR</td><td>PROBLEMAS DE CONEXIÓN CON LOS CUBOS</td></tr>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Work',
};
</script>

<style scoped>
.work-container {
  display: flex;
  flex-direction: row;
  gap: 24px;
  padding: 24px;
  background: #f8f9fa;
  min-height: 90vh;
}
.work-sidebar {
  width: 260px;
  background: #e9ecef;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.client-info-table {
  width: 100%;
  margin-bottom: 16px;
  font-size: 0.95rem;
}
.btn-update {
  background: #ffc107;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
}
.work-main {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.tipificacion-header {
  margin-bottom: 16px;
}
.tab-active {
  background: #1976d2;
  color: #fff;
  border: none;
  padding: 8px 24px;
  border-radius: 4px 4px 0 0;
  font-weight: bold;
}
.tipificacion-form {
  margin-top: 8px;
}
.form-row {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}
.form-row label {
  font-weight: 500;
  margin-bottom: 4px;
}
.form-row select, .form-row textarea {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 1rem;
}
.work-history {
  width: 350px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  overflow-y: auto;
  max-height: 80vh;
}
.history-list {
  margin-top: 8px;
}
.history-item {
  margin-bottom: 16px;
  border: 1px solid #1976d2;
  border-radius: 6px;
  padding: 8px;
}
.history-header {
  font-size: 0.95rem;
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.history-skl { color: #009688; font-weight: bold; }
.history-vdn { color: #1976d2; font-weight: bold; }
.history-asr { color: #388e3c; font-weight: bold; }
.history-table {
  width: 100%;
  font-size: 0.93rem;
  border-collapse: collapse;
}
.history-table th, .history-table td {
  border-bottom: 1px solid #eee;
  padding: 4px 6px;
}
</style> 