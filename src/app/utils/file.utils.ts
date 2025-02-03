import { saveAs } from 'file-saver';
import { MatrixFile } from "../types";

export const saveToFile = (data: MatrixFile, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, `${filename}.json`);
}

export const loadFromFile = (file: File): Promise<MatrixFile> => {
  console.log('loading');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const data = JSON.parse(reader.result as string);
      const matrixFile: MatrixFile = {
        width: data.width,
        height: data.height,
        groups: data.groups,
        matrix: data.matrix,
        flatMatrix: data.flatMatrix,
      };
      resolve(matrixFile);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};