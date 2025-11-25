export interface FlashCardQuestion {
  id: string
  question: string
  trueAnswer: string
  falseAnswer: string
  numericValue: number | string
}

export interface FlashCardGenerationResponse {
  questions: FlashCardQuestion[]
  pdfFileName: string
}
