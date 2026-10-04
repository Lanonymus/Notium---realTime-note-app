export type QuestionTypeEnum = 'multipleChoice' | 'true/false' | 'shortAnswer';


export interface GeneratedQuestion {
  id: string;
  text: string;
  type: QuestionTypeEnum;
  options?: string[];       // Required for 'multipleChoice' (4 options)
  correctIndex?: number;   // Required for 'multipleChoice' (0-3)
  correctAnswer?: boolean; // Required for 'true/false'
  explanation: string;
  hint: string;
  topicId?: string;        // Link to topic
  timeInSeconds: number
}

export interface GeneratedTopic {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface QuizGenerationResponse {
  // Returned only if existing topics were not provided in the request
  topics?: GeneratedTopic[];
  questions: GeneratedQuestion[];
  quizStartTime: string
}

export type QuestionType = {
  id: string,
  text: string,
  options?: string[],
  type: "multipleChoice" | "true/false" | "shortAnswer",
  correctIndex?: number,
  correctAnswer?: boolean,
  explanation: string,
  hint: string,
  timeInSeconds: number
}

export type TopicType = {
    id: string;
    name: string;
    description: string;
    difficulty: string,
    accuracy?: string,
}

// --- TYPES ---



export type WrongAnswer = {
  question: string,
  userAnswer: string,
  correctAnswer: string
}



export type QuizSettings = {
  spacedRepetition: boolean;
  timeLimit: boolean;
  immediateFeedback: boolean;
};

export interface UserAnswer {
  questionId: string,
  selectedOptionIndex: number,
  userAnswer?: string,
  isCorrect: boolean,
  suggestedAnswer?: string
}



export type QuizInstance = {
  id: string;             // np. crypto.randomUUID()
  createdAt: string;      // data w formacie ISO (new Date().toISOString())
  quizFormats: string[];  // np. ['mc', 'fb'] lub nazwy pełne
  topics: TopicType[];
  questions: QuestionType[];
  settings: QuizSettings;
  userAnswers: UserAnswer[];
  selectedTopics: TopicType[],
  finishTime: string  
};

export type QuizState = 'createMode' | 'generating' | 'active' | 'finished';
export type GenerationState = "none" | "extractedNotes" | "CreatedQuestions"


