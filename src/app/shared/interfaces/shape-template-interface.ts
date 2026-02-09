export interface ShapeTemplate {
  canvasHeight: number
  repeatDesign: number
  shapes: ShapeDetails[]
}

export interface ShapeDetails {
  type: 'rectangle' | 'circle'
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
  borderRadiusTopLeft: number
  borderRadiusTopRight: number
  borderRadiusBottomRight: number
  borderRadiusBottomLeft: number
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
