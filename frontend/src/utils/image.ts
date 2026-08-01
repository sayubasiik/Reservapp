// Lee un archivo de imagen y lo devuelve como dataURL (para guardarlo
// en localStorage sin necesidad de un servidor). Rechaza archivos que
// no sean imagen o que superen el tamaño máximo.
export function readImageFile(file: File, maxMB = 4): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen.'));
      return;
    }
    if (file.size > maxMB * 1024 * 1024) {
      reject(new Error(`La imagen no debe superar ${maxMB} MB.`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.readAsDataURL(file);
  });
}
