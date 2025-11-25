import type { FlashCardGenerationResponse } from '@/types/FlashCardQuestion'

export const generateMockFlashCards = (pdfFileName: string): FlashCardGenerationResponse => {
  return {
    pdfFileName,
    questions: [
      {
        id: '1',
        question: 'What is the primary purpose of this document?',
        trueAnswer: '',
        falseAnswer: '',
        numericValue: 1,
      },
      {
        id: '2',
        question: 'What are the key concepts discussed in this document?',
        trueAnswer: '',
        falseAnswer: '',
        numericValue: 2,
      },
      {
        id: '3',
        question: 'How does this information apply to real-world scenarios?',
        trueAnswer: '',
        falseAnswer: '',
        numericValue: 3,
      },
      {
        id: '4',
        question: 'What are the main benefits of understanding this content?',
        trueAnswer: '',
        falseAnswer: '',
        numericValue: 4,
      },
      {
        id: '5',
        question: 'What methodology or approach is recommended?',
        trueAnswer: '',
        falseAnswer: '',
        numericValue: 5,
      },
      {
        id: '6',
        question: 'What are the common challenges mentioned?',
        trueAnswer: 'Implementation difficulties and constraints',
        falseAnswer: '',
        numericValue: 6,
      },
      {
        id: '7',
        question: 'How can these challenges be overcome?',
        trueAnswer: '',
        falseAnswer: '',
        numericValue: 7,
      },
      {
        id: '8',
        question: 'What are the expected outcomes or results?',
        trueAnswer: '',
        falseAnswer: '',
        numericValue: 8,
      },
      {
        id: '9',
        question: 'What are the critical success factors?',
        trueAnswer: '',
        falseAnswer: '',
        numericValue: 9,
      },
      {
        id: '10',
        question: 'What recommendations are provided for implementation?',
        trueAnswer: '',
        falseAnswer: '',
        numericValue: 10,
      },
    ],
  }
}
