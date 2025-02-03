import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Colour, Data, MatrixFile } from '../../types';
import { loadFromFile, saveToFile } from '../../utils/file.utils';

@Component({
  selector: 'app-matrix',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './matrix.component.html',
  imports: [CommonModule, ReactiveFormsModule],
})
export class MatrixComponent {
  @Input() width: number = 16;
  @Input() height: number = 16;

  matrix: Data[][] = this.generateSnakeMatrix(this.width, this.height);
  flatMatrix: Data[] = [];

  defaultGroup: string = 'data_group_1';
  currentGroup: string = this.defaultGroup;
  groups: string[] = [this.currentGroup];
  
  form = new FormGroup({
    fileName: new FormControl(''),
    newGroup: new FormControl(''),
  });

  defaultColour = '#f8f9fa';
  currentColour: Colour = this.hexToRgb(this.defaultColour);

  defaultFileName = 'my-led-matrix';

  displayLedNumbers: boolean = true;

  constructor(private cdr: ChangeDetectorRef) {}

  generateSnakeMatrix(width: number, height: number): Data[][] {
    const matrix: Data[][] = Array.from({ length: height }, (_, row) =>
      Array.from({ length: width }, (_, col) => ({
        num: 0,   
        colour: null, 
        group: this.currentGroup, 
      }))
    );

    let number = 0; 

    for (let col = width - 1; col >= 0; col--) {
      if ((width - 1 - col) % 2 === 0) {
        for (let row = height - 1; row >= 0; row--) {
          matrix[row][col].num = number++;
        }
      } else {
        for (let row = 0; row < height; row++) {
          matrix[row][col].num = number++;
        }
      }
    }
    return matrix;
  }

  setColour(row: number, col: number): void {
    const flatMatrixIndex = this.flatMatrix.findIndex(data => data.num === this.matrix[row][col].num);
    const matrixData = this.matrix[row][col];

    // If led has a colour, reset it.
    if (matrixData.colour !== null) {   
      matrixData.colour = null;
      matrixData.group = null;

      if (flatMatrixIndex !== -1) {
        this.flatMatrix.splice(flatMatrixIndex, 1);
      }
      return;
    }

    // Otherwise, set the colour.
    matrixData.colour = this.currentColour;
    matrixData.group = this.currentGroup;

    if (flatMatrixIndex === -1) {
      this.flatMatrix.push(this.matrix[row][col]);
    }
    else {
      this.flatMatrix[flatMatrixIndex].colour = this.currentColour;
      this.flatMatrix[flatMatrixIndex].group = this.currentGroup;
    }
  }

  changeColour(event: Event): void {
    const colorInput = event.target as HTMLInputElement;
    const hexColor = colorInput.value;
    const rgb = this.hexToRgb(hexColor);
    this.currentColour = rgb;
  }

  flatMatrixString(): string[] {
    const groupedData: Record<string, Data[]> = {};
  
    this.groups.forEach(group => {
      groupedData[group] = [];
    });

    this.flatMatrix.forEach(data => {
      if (data.group && groupedData[data.group]) {
        groupedData[data.group].push(data);
      }
    });

    const outputStrings: string[] = [];
  
    Object.keys(groupedData).forEach(groupName => {
      outputStrings.push(`Data ${groupName}[] = {`);
  
      groupedData[groupName].forEach((data, index) => {
        const isNotLast = index < groupedData[groupName].length - 1;
        outputStrings.push(`    {${data.num}, CRGB(${data.colour?.r}, ${data.colour?.g}, ${data.colour?.b})}${isNotLast ? ',' : ''}`);
      });
      outputStrings.push('};');
      outputStrings.push('\n');
    });
  
    return outputStrings;
  }

  rgbToHex(r: number, g: number, b: number) {
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
  }

  hexToRgb(hex: string): Colour {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  addGroup(): void {
    const newGroup = this.form.controls.newGroup.value?.trim();

    if (newGroup && !this.groups.includes(newGroup)) {
      this.groups.push(newGroup);
    }

    this.form.reset();
  }

  setGroup(group: string): void {
    this.currentGroup = group;
  }

  removeGroup(group: string): void {
    this.groups = this.groups.filter(g => g !== group);
    this.flatMatrix = this.flatMatrix.filter(data => data.group !== group);

    this.matrix.forEach(row => {
      row.forEach(cell => {
        if (cell.group === group) {
          cell.group = null;
          cell.colour = null;
        }
      });
    });

    if (this.currentGroup === group) {
      if (this.groups.length > 0 ) {
        this.currentGroup = this.groups[0] ;
      } else {
        this.currentGroup = this.defaultGroup;
        this.groups.push(this.currentGroup);
      }
    }
  }

  saveToFile(): void {
    const matrixFile: MatrixFile = {
      width: this.width,
      height: this.height,
      groups: this.groups,
      matrix: this.matrix,
      flatMatrix: this.flatMatrix,
    };
    const fileName = this.form.controls.fileName.value ?? this.defaultFileName;
    saveToFile(matrixFile, fileName);
  }

  async loadFromFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    try {
      const matrixFile: MatrixFile = await loadFromFile(file);
      this.width = matrixFile.width;
      this.height = matrixFile.height;
      this.groups = matrixFile.groups;
      this.matrix = matrixFile.matrix;
      this.flatMatrix = matrixFile.flatMatrix;
      this.cdr.markForCheck();
    } catch (error) {
      console.error("An error occurred: ", error);
    }
  }

  toggleDisplayLedNumbers(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.displayLedNumbers = input.checked;
  }
}
