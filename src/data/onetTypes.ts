export type OnetExamSetId =
  | 'set1'
  | 'set2'
  | 'set3'
  | 'set4'
  | 'set5'
  | 'set6'
  | 'set7'
  | 'set8'
  | 'set9'
  | 'set10'
  | 'set11'
  | 'set12'
  | 'set13'
  | 'set14'
  | 'set15'
  | 'set16'
  | 'set17'
  | 'set18'
  | 'set19'
  | 'set20';

export interface ExamQuestion {
  id: number;
  setId: OnetExamSetId;
  category: 'thinking' | 'coding' | 'data' | 'debugging' | 'search' | 'safety';
  categoryLabel: string;
  indicator: string;
  isMustKnow?: boolean;
  questionFormat: 'single_choice' | 'complex_choice';
  blueprintTopic: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  codeSnippet?: string;
}

export interface ExamSetMeta {
  id: OnetExamSetId;
  setNumber: number;
  title: string;
  subtitle: string;
  badgeText: string;
  focusIndicators: string[];
  difficulty:
    | 'มาตรฐาน (Standard)'
    | 'เข้มข้น (Intermediate)'
    | 'ท้าทาย O-NET & สสวท. (Advanced)';
  timeMinutes: number;
  questions: ExamQuestion[];
}
