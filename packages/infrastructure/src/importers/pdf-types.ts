export interface PdfTextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfPageText {
  pageNumber: number;
  pageWidth: number;
  pageHeight: number;
  items: PdfTextItem[];
  /**
   * Número de objeto indirecto real de esta página en el PDF (`page.ref.num`
   * de pdfjs). Permite ubicar el diccionario `/Resources` de la página en
   * los bytes crudos del archivo para resolver imágenes por objeto exacto
   * en vez de asumir orden secuencial — ver `pdf-page-images.ts`.
   */
  pageObjNum: number;
}

/** Imagen de producto ya resuelta: posición en la página + bytes reales. */
export interface PdfPageImage {
  x: number;
  y: number;
  width: number;
  height: number;
  bytes: Buffer;
}
