/**
 * Puerto del dominio para leer una imagen almacenada localmente y
 * convertirla a un data URI embebible en HTML. Implementado en
 * `infrastructure` leyendo de `data/images/`.
 */
export interface ImageStore {
  readAsDataUri(relativePath: string): Promise<string | null>;
}
