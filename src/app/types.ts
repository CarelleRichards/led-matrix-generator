export interface MatrixFile {
  width: number,
  height: number,
  groups: string[],
  matrix: Data[][],
  flatMatrix: Data[],
};

export interface Colour {
  r: number; 
  g: number; 
  b: number; 
};

export interface Data {
  num: number;
  colour: Colour | null;
  group: string | null;
};

