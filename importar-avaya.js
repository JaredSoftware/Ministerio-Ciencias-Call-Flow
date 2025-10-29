const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');
require('dotenv').config();

// Importar el modelo de cliente
const Cliente = require('./models/cliente');

// Configurar conexión a MongoDB
const mongoUri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB}?authSource=admin`;

console.log('🔄 Conectando a MongoDB...');

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Conectado a MongoDB');
  console.log('📂 Leyendo archivo CSV...');
  importarDatos();
}).catch(err => {
  console.error('❌ Error conectando a MongoDB:', err);
  process.exit(1);
});

function dividirNombreCompleto(nombreCompleto) {
  if (!nombreCompleto) return { nombres: '', apellidos: '' };
  
  const partes = nombreCompleto.trim().split(/\s+/);
  
  if (partes.length === 1) {
    return { nombres: partes[0], apellidos: '' };
  } else if (partes.length === 2) {
    return { nombres: partes[0], apellidos: partes[1] };
  } else {
    // Asumir que los primeros 2 son nombres y el resto apellidos
    const nombres = partes.slice(0, 2).join(' ');
    const apellidos = partes.slice(2).join(' ');
    return { nombres, apellidos };
  }
}

function limpiarTelefono(telefono) {
  if (!telefono) return '';
  // Eliminar espacios y caracteres especiales
  return telefono.toString().replace(/[^0-9]/g, '');
}

function normalizarTipoDocumento(tipo) {
  if (!tipo) return '';
  
  const tipoLower = tipo.toLowerCase();
  
  if (tipoLower.includes('cédula de ciudadanía') || tipoLower.includes('cedula de ciudadania')) {
    return 'Cédula de ciudadanía';
  } else if (tipoLower.includes('cédula de extranjería') || tipoLower.includes('cedula de extranjeria')) {
    return 'Cédula de extranjería';
  } else if (tipoLower.includes('tarjeta de identidad')) {
    return 'Tarjeta de identidad';
  } else if (tipoLower.includes('pasaporte')) {
    return 'Pasaporte';
  } else if (tipoLower.includes('nit') || tipoLower.includes('tributaria')) {
    return 'Cédula de ciudadanía'; // Mapear NIT a cédula por defecto
  } else if (tipoLower.includes('permiso')) {
    return 'Permiso temporal de permanencia';
  }
  
  return '';
}

async function importarDatos() {
  const resultados = [];
  const csvPath = path.join(__dirname, 'Base de datos Avaya.csv');
  
  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      resultados.push(row);
    })
    .on('end', async () => {
      console.log(`📊 Total de registros en CSV: ${resultados.length}`);
      
      let insertados = 0;
      let actualizados = 0;
      let errores = 0;
      
      for (const row of resultados) {
        try {
          const cedula = row['Identificación peticionario']?.trim();
          
          if (!cedula) {
            console.warn('⚠️  Registro sin cédula, omitiendo...');
            errores++;
            continue;
          }
          
          const nombreCompleto = row['Nombre completo peticionario'] || '';
          const { nombres, apellidos } = dividirNombreCompleto(nombreCompleto);
          
          const celular = limpiarTelefono(row['Celular peticionario']);
          const telefonoFijo = limpiarTelefono(row['Teléfono peticionario']);
          const telefono = celular || telefonoFijo;
          
          const clienteData = {
            cedula: cedula,
            tipoDocumento: normalizarTipoDocumento(row['Tipo Identificación']),
            nombres: nombres,
            apellidos: apellidos,
            telefono: telefono,
            correo: row['Correo electrónico medio respuesta']?.toLowerCase().trim() || '',
            direccion: row['Dirección medio respuesta'] || '',
            pais: row['País'] || 'Colombia',
            departamento: row['Departamentos'] || '',
            ciudad: row['Ciudades / Municipios'] || '',
            activo: true,
            fechaCreacion: new Date(),
            fechaUltimaInteraccion: new Date()
          };
          
          // Usar upsert para insertar o actualizar
          const resultado = await Cliente.findOneAndUpdate(
            { cedula: cedula },
            clienteData,
            { 
              upsert: true, 
              new: true,
              setDefaultsOnInsert: true
            }
          );
          
          if (resultado) {
            insertados++;
            if (insertados % 100 === 0) {
              console.log(`📝 Procesados: ${insertados} registros...`);
            }
          }
          
        } catch (error) {
          errores++;
          console.error(`❌ Error procesando registro con cédula ${row['Identificación peticionario']}:`, error.message);
        }
      }
      
      console.log('\n🎉 Importación completada!');
      console.log(`✅ Registros procesados: ${insertados}`);
      console.log(`⚠️  Errores: ${errores}`);
      
      // Cerrar conexión
      await mongoose.connection.close();
      console.log('👋 Conexión cerrada');
      process.exit(0);
    })
    .on('error', (error) => {
      console.error('❌ Error leyendo CSV:', error);
      process.exit(1);
    });
}


