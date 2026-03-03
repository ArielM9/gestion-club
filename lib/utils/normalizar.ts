export function normalizarTexto(texto: string | null | undefined): string {
    if (!texto) return '';
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

export function containsNormalized(
    campo: string | null | undefined, 
    busqueda: string
): boolean {
    const textoNormalizado = normalizarTexto(campo);
    const busquedaNormalizada = normalizarTexto(busqueda);
    return textoNormalizado.includes(busquedaNormalizada);
}
