import prisma from '../lib/prisma';
import { procesarAnalisisPendiente, finalizarProcesamiento } from '../lib/documentos/analysis';

/**
 * Worker independiente para procesar documentos en segundo plano.
 * Escucha cambios en la tabla DocumentoPendiente y ejecuta el análisis 
 * o el archivado final según el estado.
 */
async function workerLoop() {
  console.log("🚀 [Document Worker] Iniciado y escuchando cambios en la base de datos...");
  console.log("   - Polling cada 3 segundos");
  console.log("   - Escuchando estados: SUBIDO (para analizar) y CONFIRMADO (para archivar)");

  while (true) {
    try {
      // 1. Procesar archivos recién subidos (SUBIDO) para análisis automático
      const nuevos = await prisma.documentoPendiente.findMany({
        where: { estado: 'SUBIDO' },
        take: 5
      });

      for (const doc of nuevos) {
        console.log(`[ANALISIS] Procesando archivo: ${doc.filename}...`);
        try {
          await procesarAnalisisPendiente(doc.id);
          console.log(`[ANALISIS] Completado para ${doc.filename}`);
        } catch (err) {
          console.error(`[ANALISIS ERROR] Falló ${doc.filename}:`, err);
        }
      }

      // 2. Procesar archivos confirmados por el usuario (CONFIRMADO) para archivado final
      const confirmados = await prisma.documentoPendiente.findMany({
        where: { estado: 'CONFIRMADO' },
        take: 5
      });

      for (const doc of confirmados) {
        console.log(`[ARCHIVADO] Finalizando procesamiento de ${doc.filename}...`);
        try {
          await finalizarProcesamiento(doc.id);
          console.log(`[ARCHIVADO] Documento movido y guardado: ${doc.filename}`);
        } catch (err) {
          console.error(`[ARCHIVADO ERROR] Falló finalización de ${doc.filename}:`, err);
        }
      }

      // Esperar antes de la siguiente vuelta
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error("[WORKER CRITICAL ERROR]", error);
      // En caso de error crítico de conexión, esperamos un poco más antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

// Ejecutar el loop
workerLoop().catch(err => {
  console.error("Worker fatal failure:", err);
  process.exit(1);
});
