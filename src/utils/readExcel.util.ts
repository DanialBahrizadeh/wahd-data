import * as XLSX from "xlsx";
import { readFile } from "fs/promises";

import type { BehestanRow } from "../types/behestan.type";

export async function readBehestanExcel(path: string): Promise<BehestanRow[]> {
  const buffer = await readFile(path);

  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("No worksheet found");
  }

  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error("Worksheet not found");
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  return rows.slice(1).map((row) => {
    const value = (column: number) => String(row[column] ?? "").trim();

    return {
      facultyId: value(0),
      facultyName: value(1),

      departmentId: value(2),
      departmentName: value(3),

      lessonId: value(4),
      lessonName: value(5),

      credits: value(6),
      actionCredits: value(7),

      capacity: value(8),
      registered: value(9),
      waitingList: value(10),

      sex: value(11),
      teacher: value(12),

      scheduleAndExam: value(13),

      description: value(14),
      otherCenters: value(15),
      emergencyDrop: value(16),
    };
  });
}
