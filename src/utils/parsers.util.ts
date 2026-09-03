import type { Lesson, Schedule } from "../types/lesson";
import { BehestanRow } from "../types/behestan.type";
import { toGregorian } from "jalaali-js";

const toEnglishDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) =>
      String(digit.charCodeAt(0) - "۰".charCodeAt(0)),
    )
    .replace(/[٠-٩]/g, (digit) =>
      String(digit.charCodeAt(0) - "٠".charCodeAt(0)),
    );

const normalizePersian = (value: string) =>
  value
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replaceAll("ك", "ک")
    .replace(/\s+/g, " ")
    .trim();

const toPersianDigits = (value: string) =>
  value
    .replace(/[0-9]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])
    .replace(/[٠-٩]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit.charCodeAt(0) - 0x0660]);

export const normalizePersianText = (value: string) =>
  toPersianDigits(normalizePersian(value));

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
  if (!value) {
    return 0;
  }

  const text = toEnglishDigits(normalizePersian(value));

  const match = text.match(
    /(\d{4})[./](\d{1,2})[./](\d{1,2}).*?ساعت\s*:\s*(\d{1,2}):(\d{2})/,
  );

  if (!match) {
    return 0;
  }

  const [, year, month, day, hour, minute] = match;

  const { gy, gm, gd } = toGregorian(Number(year), Number(month), Number(day));

  // Behestan exam times are Tehran local time.
  // Iran currently uses UTC+03:30 year-round.
  const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;

  return (
    Date.UTC(gy, gm - 1, gd, Number(hour), Number(minute)) - TEHRAN_OFFSET_MS
  );
}

function parseSchedule(value: string) {
  const text = normalizePersian(value);

  const regex =
    /(?:درس|حل تمرین)\([^)]+\):\s*(.*?)\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/g;

  const matches = [...text.matchAll(regex)];

  return matches.map((match, index) => {
    const [, dayText, start, end] = match;

    const extraStart = (match.index ?? 0) + match[0].length;

    const extraEnd = matches[index + 1]?.index ?? text.length;

    const extra = text.slice(extraStart, extraEnd);

    const place =
      extra
        .match(/مکان:\s*(.*)/)?.[1]
        ?.replace(/[،,\s]+$/g, "")
        .trim() ?? "";

    const dayKey = dayText.replace(/\s+/g, "");

    const day = dayMap[dayKey] ?? dayMap[dayText.trim()];

    return {
      day,
      start: timeToFloat(start),
      end: timeToFloat(end),
      place,
    };
  });
}

export function parseBehestanRow(row: BehestanRow, term: string): Lesson {
  const schedule = parseSchedule(row.classTimeAndPlace);

  const normalizedMoreInfo = normalizePersian(row.moreInfo);

  const teacherFromInfo = normalizedMoreInfo.match(/استاد درس:\s*(.+)$/)?.[1];

  return {
    id: term + row.lessonId,

    lessonId: row.lessonId,
    lessonName: normalizePersianText(row.lessonName),

    credits: row.credits,
    actionCredits: row.actionCredits,

    cap: row.capacity,
    signin: row.registered,

    teacher: normalizePersianText(teacherFromInfo?.trim() || row.teacher),

    classTime: schedule.map(({ day, start, end }) => ({
      day,
      start,
      end,
    })),

    place: normalizePersianText(
      schedule.find((item) => item.place)?.place ?? "",
    ),

    examDate: parseExam(row.examDate),

    limits: normalizePersianText(row.limits),

    chosenSimister: normalizePersianText(row.chosenSimister),

    moreInfo: normalizePersianText(row.moreInfo),
  };
}
