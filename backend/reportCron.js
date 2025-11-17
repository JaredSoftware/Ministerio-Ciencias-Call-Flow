const cron = require('node-cron');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Report = require('../models/report');

let isProcessing = false;

async function processReports() {
  if (isProcessing) return;
  isProcessing = true;
  try {
    // Verificar que la conexión esté activa (sin intentar conectar)
    if (mongoose.connection.readyState !== 1) {
      return;
    }
    
    const pendientes = await Report.find({ status: 'pendiente' });
    for (const rep of pendientes) {
      try {
        // Simular generación de CSV
        const csvData = [
          ['Columna1', 'Columna2', 'Columna3'],
          ['Dato1', 'Dato2', 'Dato3'],
          [`Desde: ${rep.fechaInicio}`, `Hasta: ${rep.fechaFin}`, `Solicitado por: ${rep.solicitadoPor.correo}`]
        ].map(row => row.join(',')).join('\n');
        const filePath = path.join(__dirname, '../public/csv/', rep.nombreArchivo);
        fs.writeFileSync(filePath, csvData);
        rep.status = 'generado';
        rep.archivoUrl = `/csv/${rep.nombreArchivo}`;
        await rep.save();
      } catch (e) {
        rep.status = 'error';
        await rep.save();
        console.error(`❌ Error generando reporte ${rep.nombreArchivo}:`, e);
      }
    }
  } catch (err) {
    console.error('❌ Error en el cron de reportes:', err);
  } finally {
    isProcessing = false;
  }
}

// Ejecutar cada 2 minutos
cron.schedule('*/2 * * * *', processReports);

// Ejecutar una vez al iniciar (después de un delay para que la conexión esté lista)
setTimeout(processReports, 5000); 