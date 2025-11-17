// 🕐 UTILIDAD: Fechas en UTC-5 (Colombia)
// Todas las fechas se guardan en UTC-5 para consistencia con la zona horaria de Colombia
// IMPORTANTE: MongoDB guarda fechas en UTC, así que creamos fechas que representen
// la hora de Colombia pero que MongoDB interprete correctamente

/**
 * Obtiene la fecha/hora actual en UTC-5 (Colombia)
 * Crea una fecha que representa "ahora" en hora Colombia (UTC-5)
 * MongoDB la guardará en UTC, pero cuando se lea y se convierta a hora local Colombia,
 * mostrará la hora correcta
 * @returns {Date} Fecha que representa la hora actual de Colombia
 */
function getFechaColombia() {
  const ahora = new Date();
  // Obtener la fecha/hora actual en UTC (timestamp UTC)
  const utcTimestamp = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
  // Crear una fecha que cuando MongoDB la guarde en UTC, represente la hora de Colombia
  // Si son las 10:00 AM en Colombia (UTC-5), MongoDB debe guardar 15:00 UTC
  // Entonces creamos una fecha UTC que sea 5 horas adelante de la hora local de Colombia
  // Pero como queremos representar "ahora en Colombia", necesitamos ajustar
  const colombiaOffsetMs = 5 * 60 * 60 * 1000; // 5 horas en milisegundos
  // Crear fecha UTC que represente la hora actual de Colombia
  const fechaColombia = new Date(utcTimestamp - colombiaOffsetMs);
  return fechaColombia;
}

/**
 * Convierte una fecha a UTC-5 (Colombia)
 * @param {Date|String} fecha - Fecha a convertir
 * @returns {Date} Fecha en UTC-5
 */
function convertirFechaColombia(fecha) {
  if (!fecha) return null;
  
  const fechaObj = fecha instanceof Date ? fecha : new Date(fecha);
  // Obtener la fecha en UTC
  const utc = fechaObj.getTime() + (fechaObj.getTimezoneOffset() * 60000);
  // Aplicar offset de UTC-5 (Colombia)
  const colombiaTime = new Date(utc - (5 * 3600000));
  return colombiaTime;
}

module.exports = {
  getFechaColombia,
  convertirFechaColombia
};

