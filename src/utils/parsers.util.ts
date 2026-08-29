import persianDate from "persian-date";
import type { Lesson, Schedule, UnParsedRow } from "../types/lesson";
import { BehestanRow } from "../types/behestan.type";

const normalizePersian = (value: string) =>
  value.replaceAll("ي", "ی").replaceAll("ك", "ک").replace(/\s+/g, " ").trim();

// map the the time to querters so they are easir to work with
const timeToFloat = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);

  return hour + minute / 60;
};

// map the persion day to numbers so they are easier to work with
const dayMap: Record<string, number> = {
  شنبه: 0,

  یکشنبه: 1,
  "یک شنبه": 1,

  دوشنبه: 2,
  "دو شنبه": 2,

  سهشنبه: 3,
  "سه شنبه": 3,

  چهارشنبه: 4,
  "چهار شنبه": 4,

  پنجشنبه: 5,
  "پنج شنبه": 5,

  جمعه: 6,
};

const scheduleParser = (placeAndTime: string): Schedule[] => {
  if (!placeAndTime) return [];
  return placeAndTime
    .replaceAll("درس(ت):", "")
    .split("،") // schedules are seperated via persion comma
    .map((schedule) => schedule.split("مکان:")[0]) // take the things before the place which are time
    .map((schedule) => {
      const parts = schedule.trim().split(" ");
      const [start, end] = parts.at(-1)!.split("-").map(timeToFloat); // the last things is time like 13:30-15:00
      const day = dayMap[parts.slice(0, -1).join("").trim()]; // everything before the last thing are the day and and other spaces

      return { day, start, end };
    });
};

const placeParser = (placeAndTime: string) => {
  if (!placeAndTime) return "";
  return placeAndTime
    .replaceAll("درس(ت):", "")
    .split("،")[0] // schedules are seperated via persion comma
    .split("مکان:")[1];
};

// const sexParser = (sex: string): Sex => {
//   const sexMap: any = {
//     زن: 0,
//     مرد: 1,
//     مختلط: 2,
//   };
//
//   return sexMap[sex];
// };

function parseExam(value: string) {
  const text = normalizePersian(value);

  const match = text.match(
    /امتحان\((\d{4})[./](\d{1,2})[./](\d{1,2})\)\s*ساعت\s*:\s*(\d{1,2}):(\d{2})/,
  );

  if (!match) {
    return 0;
  }

  const [, year, month, day, hour, minute] = match;

  return new persianDate([
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
  ]).valueOf();
}

const examDateParser = (examDate: string) => {
  if (!examDate) return 0;
  const [dates, hours] = examDate.split("ساعت:");
  const [year, month, day] = dates
    .replace("تاريخ:", "")
    .trim()
    .split("/")
    .map(Number);
  const [hour, minute] = hours.trim().split("-")[0].split(":").map(Number);

  return new persianDate([year, month, day, hour, minute]).valueOf(); // save the date unix timestamps
};

export const parseRow = (unParsedRow: UnParsedRow): Lesson => ({
  ...unParsedRow,
  // sex: sexParser(unParsedRow["sex"]),
  examDate: examDateParser(unParsedRow["examDate"]),
  place: placeParser(unParsedRow["place"]),
  classTime: scheduleParser(unParsedRow["classTime"]),
});

function parseSchedule(value: string) {
  const text = normalizePersian(value);

  const regex =
    /درس\([^)]+\):\s*(.*?)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})(?:\s+مکان:\s*(.*?))?(?=\s+درس\([^)]+\):|\s+امتحان\(|$)/g;

  const schedules = [];

  for (const match of text.matchAll(regex)) {
    const [, dayText, start, end, place] = match;

    const day = dayMap[dayText.replace(/\s+/g, "")] ?? dayMap[dayText];

    schedules.push({
      day,
      start: timeToFloat(start),
      end: timeToFloat(end),
      place: place?.trim() ?? "",
    });
  }

  return schedules;
}

export function parseBehestanRow(row: BehestanRow, term: string): Lesson {
  const schedule = parseSchedule(row.scheduleAndExam);

  return {
    id: term + row.lessonId,

    lessonId: row.lessonId,
    lessonName: row.lessonName,

    credits: row.credits,
    actionCredits: row.actionCredits,

    cap: row.capacity,
    signin: row.registered,

    teacher: row.teacher,

    classTime: schedule.map(({ day, start, end }) => ({
      day,
      start,
      end,
    })),

    place: schedule.find((item) => item.place)?.place ?? "",

    examDate: parseExam(row.scheduleAndExam),

    // decide how you want these new Behestan fields
    // represented in your final API
    limits: row.description,
    chosenSimister: "",
    moreInfo: row.otherCenters,
  };
}
