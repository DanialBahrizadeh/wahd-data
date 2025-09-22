export type Sex = 0 | 1 | 2;
export type Schedule = { day: number; start: number; end: number };
export type Row = {
  id: string;
  collegeId: string;
  collegeName: string;
  lessonGruopId: string;
  lessonGruopName: string;
  lessonId: string;
  lessonName: string;
  credits: string;
  actionCredits: string;
  cap: string;
  signin: string;
  waitingList: string;
  sex: Sex;
  teacher: string;
  place: string;
  classTime: Schedule[];
  examDate: number; // unix timeStamps
  limits: string;
  chosenSimister: string;
  moreInfo: string;
};

export type UnParsedRow = {
  id: string;
  collegeId: string;
  collegeName: string;
  lessonGruopId: string;
  lessonGruopName: string;
  lessonId: string;
  lessonName: string;
  credits: string;
  actionCredits: string;
  cap: string;
  signin: string;
  waitingList: string;
  sex: string;
  teacher: string;
  placeAndTime: string;
  examDate: string;
  limits: string;
  chosenSimister: string;
  moreInfo: string;
};
