import { ShapeDetails } from './shape-template-interface';

export interface UserPreset {
  id: string;
  name: string;
  createdAt: number;
  template: string;
  newShapeColor: string;
  canvas: Record<string, any>;
  shapes: ShapeDetails[];
}
