import db from "../db/client";

export enum JobType {
  DOCUMENT_ANALYSIS = 'DOCUMENT_ANALYSIS',
  DOCUMENT_FINALIZATION = 'DOCUMENT_FINALIZATION'
}

export async function enqueueDocument(filename: string, tempPath: string) {
  return await db.documentoPendiente.create({
    data: {
      filename,
      tempPath,
      estado: 'SUBIDO',
    }
  });
}

export async function getNextAnalysisJob() {
  return await db.documentoPendiente.findFirst({
    where: { estado: 'SUBIDO' },
    orderBy: { createdAt: 'asc' }
  });
}

export async function getNextFinalizationJob() {
  return await db.documentoPendiente.findFirst({
    where: { estado: 'CONFIRMADO' },
    orderBy: { createdAt: 'asc' }
  });
}
