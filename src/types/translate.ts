export interface TranslateResponse {
  detected_language: string
  translated_text: string
  original_text: string
  target_language: string
}

export interface TranslateRequest {
  text: string
  target_language: string
}
