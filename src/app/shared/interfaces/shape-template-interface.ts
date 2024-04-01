export interface ShapeTemplate {
  canvasHeight: number
  repeatDesign: number
  shapes: ShapeDetails[]
}

export interface ShapeDetails {
  type: string
  width: number | null;
  widthMeasurement: string | null;
  widthCalc: any
  widthCalcAmount: any
  widthCalcUnit: any
  height: number | null;
  heightMeasurement: string | null;
  heightCalc: any
  heightCalcAmount: any
  heightCalcUnit: any
  diameter: number | null;
  diameterMeasurement: string | null;
  diameterCalc: any
  diameterCalcAmount: any
  diameterCalcUnit: any
  color: string
  horizontalPositioningStartingPoint: string;
  horizontalPositioningAmount: number
  horizontalPositioningUnit: string
  verticalPositioningStartingPoint: string;
  verticalPositioningAmount: number
  verticalPositioningUnit: string
  allowShimmerOverlay: boolean
  antialias: boolean
}