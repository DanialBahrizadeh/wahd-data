import { readdir } from "fs/promises";
import { join } from "path";

export async function waitForExcelDownload(
  directory: string,
  timeout = 30_000,
) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const files = await readdir(directory);

    const stillDownloading = files.some((file) => file.endsWith(".crdownload"));

    const excelFile = files.find((file) => file.endsWith(".xlsx"));

    if (excelFile && !stillDownloading) {
      return join(directory, excelFile);
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  throw new Error("Excel download timed out");
}
