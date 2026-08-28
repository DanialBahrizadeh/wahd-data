import ExcelJS from "exceljs";
import type { BehestanRow } from "../types/behestan.type";

export async function readBehestanExcel(path: string): Promise<BehestanRow[]> {
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.readFile(path);

  const sheet = workbook.worksheets[0];

  if (!sheet) {
    throw new Error("No worksheet found");
  }

  const result: BehestanRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    // first row = headers
    if (rowNumber === 1) {
      return;
    }

    const value = (column: number) =>
      String(row.getCell(column).value ?? "").trim();

    result.push({
      facultyId: value(1),
      facultyName: value(2),

      departmentId: value(3),
      departmentName: value(4),

      lessonId: value(5),
      lessonName: value(6),

      credits: value(7),
      actionCredits: value(8),

      capacity: value(9),
      registered: value(10),
      waitingList: value(11),

      sex: value(12),
      teacher: value(13),

      scheduleAndExam: value(14),

      description: value(15),
      otherCenters: value(16),
      emergencyDrop: value(17),
    });
  });

  return result;
}
