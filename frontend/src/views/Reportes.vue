<template>
  <div class="reportes-container">
    <h2 class="reportes-title">📊 Reportes</h2>
    <div class="reportes-filtros">
      <div class="filtro-fecha">
        <label class="filtro-label">
          <i class="ni ni-calendar-grid-58 icono-fecha"></i>
          Fecha inicio
        </label>
        <input type="date" v-model="fechaInicio" class="input-fecha" />
      </div>
      <div class="filtro-fecha">
        <label class="filtro-label">
          <i class="ni ni-calendar-grid-58 icono-fecha"></i>
          Fecha fin
        </label>
        <input type="date" v-model="fechaFin" class="input-fecha" />
      </div>
    </div>
    <div class="nombre-archivo-bloque">
      <label class="nombre-archivo-label">
        <i class="ni ni-single-copy-04 icono-archivo"></i>
        Nombre del archivo:
      </label>
      <input
        v-model="nombreArchivoEditable"
        @input="validarNombreArchivo"
        class="input-nombre-archivo"
        :class="{ error: errorNombreArchivo }"
        maxlength="50"
        placeholder="Ej: reporte_2025-07-25_xxxxxxxx.csv"
      />
      <span v-if="errorNombreArchivo" class="error-nombre">Solo letras, números, guiones y guiones bajos permitidos.</span>
      <button class="btn-generar" :disabled="errorNombreArchivo || !nombreArchivoEditable || !fechaInicio || !fechaFin" @click="generarArchivo">Generar archivo</button>
    </div>
    <div v-if="nombreArchivoMostrado" class="nombre-archivo-generado">
      <i class="ni ni-check-bold icono-ok"></i>
      <b>Archivo generado:</b> <span class="archivo-nombre-ok">{{ nombreArchivoMostrado }}</span>
    </div>
    <div class="reportes-tabla">
      <h4 class="tabla-titulo">Historial de reportes solicitados</h4>
      <table v-if="reportes.length > 0" class="tabla-reportes">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Fecha inicio</th>
            <th>Fecha fin</th>
            <th>Fecha solicitud</th>
            <th>Estado</th>
            <th>Descargar</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in reportes" :key="r._id">
            <td>{{ r.nombreArchivo }}</td>
            <td>{{ formatFecha(r.fechaInicio) }}</td>
            <td>{{ formatFecha(r.fechaFin) }}</td>
            <td>{{ formatFecha(r.createdAt || r.fechaCreacion) }}</td>
            <td>
              <span :class="['badge-estado', r.status]">
                {{ estadoLabel(r.status) }}
              </span>
            </td>
            <td>
              <a v-if="r.status === 'generado' && r.archivoUrl" :href="r.archivoUrl" target="_blank" class="link-descarga">Descargar</a>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="tabla-vacia">No has solicitado reportes aún.</div>
    </div>
  </div>
</template>

<script>
import axiosInstance from '@/router/services/axios';
export default {
  name: 'Reportes',
  data() {
    return {
      fechaInicio: '',
      fechaFin: '',
      nombreArchivo: '',
      nombreArchivoEditable: '',
      nombreArchivoMostrado: '',
      errorNombreArchivo: false,
      reportes: [],
    };
  },
  async mounted() {
    // Generar nombre aleatorio por defecto al cargar
    const random = Math.random().toString(36).substring(2, 10);
    const fecha = new Date().toISOString().slice(0,10);
    this.nombreArchivoEditable = `reporte_${fecha}_${random}.csv`;
    this.validarNombreArchivo();
    await this.cargarReportes();
  },
  methods: {
    async generarArchivo() {
      if (this.errorNombreArchivo || !this.nombreArchivoEditable || !this.fechaInicio || !this.fechaFin) return;
      try {
        const res = await axiosInstance.post('/api/reportes/solicitar', {
          fechaInicio: this.fechaInicio,
          fechaFin: this.fechaFin,
          nombreArchivo: this.nombreArchivoEditable
        });
        if (res.data && res.data.success) {
          this.nombreArchivoMostrado = this.nombreArchivoEditable;
          await this.cargarReportes();
        }
      } catch (e) {
        alert('Error solicitando el reporte');
      }
    },
    validarNombreArchivo() {
      const regex = /^[a-zA-Z0-9_-]+(\.csv)?$/;
      let nombre = this.nombreArchivoEditable.replace(/\.csv$/, '');
      if (!regex.test(nombre)) {
        this.errorNombreArchivo = true;
      } else {
        this.errorNombreArchivo = false;
        if (!this.nombreArchivoEditable.endsWith('.csv')) {
          this.nombreArchivoEditable = nombre + '.csv';
        }
        this.nombreArchivo = this.nombreArchivoEditable;
      }
    },
    async cargarReportes() {
      try {
        const res = await axiosInstance.get('/api/reportes/mis-reportes');
        if (res.data && res.data.success) {
          this.reportes = res.data.reportes;
        }
      } catch (e) {
        this.reportes = [];
      }
    },
    formatFecha(f) {
      if (!f) return '-';
      const d = new Date(f);
      return d.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' });
    },
    estadoLabel(status) {
      if (status === 'pendiente') return 'Pendiente';
      if (status === 'generado') return 'Generado';
      if (status === 'error') return 'Error';
      return status;
    }
  }
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
  background: #fff;
  padding: 24px 32px;
  border-radius: 12px;
  display: flex;
  align-items: flex-end;
  gap: 32px;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.06);
  justify-content: center;
}
.filtro-fecha {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}
.filtro-label {
  color: #1976d2;
  font-size: 1.08rem;
  font-weight: 600;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.icono-fecha {
  font-size: 1.15em;
  color: #1976d2;
  margin-right: 2px;
}
.input-fecha {
  padding: 10px 16px;
  border-radius: 6px;
  border: 1.5px solid #bdbdbd;
  font-size: 1.08rem;
  background: #f8f9fa;
  color: #333;
  width: 210px;
  box-sizing: border-box;
  transition: border 0.2s, background 0.2s;
}
.input-fecha:focus {
  border-color: #1976d2;
  background: #fff;
  outline: none;
}
.nombre-archivo-bloque {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #e8f5e9;
  border-radius: 10px;
  padding: 24px 32px 20px 32px;
  margin: 0 auto 24px auto;
  max-width: 480px;
  box-shadow: 0 2px 8px rgba(56, 142, 60, 0.07);
}
.nombre-archivo-label {
  color: #388e3c;
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.icono-archivo {
  font-size: 1.3em;
  color: #43a047;
  margin-right: 4px;
}
.input-nombre-archivo {
  padding: 12px 18px;
  border-radius: 6px;
  border: 1.5px solid #bdbdbd;
  font-size: 1.1rem;
  margin: 0 0 10px 0;
  width: 100%;
  max-width: 350px;
  box-sizing: border-box;
  transition: border 0.2s, background 0.2s;
}
.input-nombre-archivo.error {
  border-color: #e53935;
  background: #ffebee;
}
.error-nombre {
  color: #e53935;
  font-size: 0.98em;
  margin-bottom: 10px;
}
.btn-generar {
  background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
  color: #155724;
  border: none;
  border-radius: 6px;
  padding: 12px 32px;
  font-weight: 700;
  font-size: 1.1rem;
  margin-top: 8px;
  cursor: pointer;
  box-shadow: 0 1px 4px rgba(56, 142, 60, 0.08);
  transition: background 0.2s, color 0.2s;
}
.btn-generar:disabled {
  background: #bdbdbd;
  color: #fff;
  cursor: not-allowed;
}
.btn-generar:hover:not(:disabled) {
  background: linear-gradient(90deg, #38f9d7 0%, #43e97b 100%);
  color: #1b5e20;
}
.nombre-archivo-generado {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #388e3c;
  font-size: 1.1rem;
  margin-bottom: 24px;
  gap: 8px;
}
.icono-ok {
  color: #43a047;
  font-size: 1.3em;
  margin-right: 4px;
}
.archivo-nombre-ok {
  background: #e8f5e9;
  border-radius: 4px;
  padding: 2px 10px;
  font-weight: 600;
  color: #1b5e20;
  margin-left: 4px;
}
.reportes-tabla {
  min-height: 200px;
  background: #f4f6fb;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  color: #888;
}
.tabla-titulo {
  color: #1976d2;
  font-size: 1.15rem;
  margin-bottom: 12px;
  font-weight: 700;
}
.tabla-reportes {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(25, 118, 210, 0.06);
}
.tabla-reportes th, .tabla-reportes td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #e3e3e3;
}
.tabla-reportes th {
  background: #f4f6fb;
  color: #1976d2;
  font-weight: 700;
}
.tabla-reportes tr:last-child td {
  border-bottom: none;
}
.badge-estado {
  border-radius: 8px;
  padding: 4px 14px;
  font-size: 0.98em;
  font-weight: 600;
  color: #fff;
  display: inline-block;
}
.badge-estado.pendiente { background: #ff9800; }
.badge-estado.generado { background: #43a047; }
.badge-estado.error { background: #e53935; }
.tabla-vacia {
  color: #888;
  text-align: center;
  padding: 32px 0;
  font-style: italic;
}
.link-descarga {
  color: #1976d2;
  font-weight: 600;
  text-decoration: underline;
  transition: color 0.2s;
}
.link-descarga:hover {
  color: #125ea7;
}
</style> 