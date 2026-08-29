import puppeteer from "puppeteer";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { env } from "./config/env";
import { parseBehestanRow } from "./utils/parsers.util";

import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { waitForExcelDownload } from "./utils/excelDownloader.util";
import { readBehestanExcel } from "./utils/readExcel.util";
import { Lesson } from "./types/lesson";
import faculties from "./utils/faculties.util";

// TODO: shuold make the term and the collegeId as an argument so we could get the data of old terms too
// row type

// start the browser

export default async function scrape(
  username: string,

  password: string,
  filter: number[] = [],
  term: string = "4041",
) {
  const downloadDir = await mkdtemp(join(tmpdir(), "behestan-"));

  const isVercel = Boolean(process.env.VERCEL);
  console.log("Launching browser:", isVercel ? "Vercel Chromium" : "local");

  const browser = isVercel
    ? await puppeteerCore.launch({
        args: chromium.args,
        executablePath: await chromium.executablePath(),
        headless: true,
        downloadBehavior: {
          policy: "allow",
          downloadPath: downloadDir,
        },
      })
    : await puppeteer.launch({
        headless: true,
        downloadBehavior: {
          policy: "allow",
          downloadPath: downloadDir,
        },
      });

  console.log("Browser launched:", await browser.version());

  try {
    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/128.0.0.0 Safari/537.36",
    );

    await page.goto("https://behestan.kntu.ac.ir/browser/fa/#/auth/login", {
      waitUntil: "networkidle0",
    });

    console.log("1 login page loaded");

    await page.waitForSelector(".external-link", {
      visible: true,
    });

    await page.click(".external-link");

    await page.type("#username", username);
    await page.type("#password", password);
    await page.click("#kc-login");

    await page.waitForNavigation({
      waitUntil: "networkidle0",
    });

    console.log("2 logged in");

    await page.goto(
      "https://behestan.kntu.ac.ir/browser/fa/#/pages?fid=110&ftype=1",
      {
        waitUntil: "networkidle0",
      },
    );

    console.log("3 report page loaded");

    await page.waitForFunction(() => {
      return document.querySelectorAll("input[orgid='BP2']").length >= 2;
    });

    await page.evaluate(() => {
      const fields =
        document.querySelectorAll<HTMLInputElement>("input[orgid='BP2']");

      fields[1].click();
    });

    await page.waitForNetworkIdle();

    await page.evaluate(() => {
      const fields =
        document.querySelectorAll<HTMLInputElement>("input[orgid='BP2']");

      fields[0].click();
    });

    // await page.waitForSelector(".ui-menu:nth-child(11) li:nth-child(12) a");

    await page.waitForSelector(".ui-menu:nth-child(9) li:nth-child(1) a");

    await page.$eval(".ui-menu:nth-child(9) li:nth-child(1) a", (el) =>
      (el as HTMLElement).click(),
    );

    for (
      let facultyIndex = 0;
      facultyIndex < faculties.length;
      facultyIndex++
    ) {
      console.log(
        `Selecting faculty ${faculties[facultyIndex]} at item ${facultyIndex + 1}`,
      );
      await page.waitForNetworkIdle();

      const selector = `.ui-menu:nth-child(11) li:nth-child(${facultyIndex + 1}) a`;

      await page.waitForSelector(selector);

      await page.$eval(selector, (el) => (el as HTMLElement).click());
    }

    console.log("4 faculties selected");

    await page.waitForSelector("#ShowReportExcel", {
      visible: true,
    });

    await page.click("#ShowReportExcel");

    console.log("5 excel clicked");

    const file = await waitForExcelDownload(downloadDir);

    console.log("6 excel downloaded", file);

    const rows = await readBehestanExcel(file);

    console.log("7 excel parsed", rows.length);

    const results: Record<string, Lesson[]> = {};

    for (const row of rows) {
      const facultyId = Number(row.facultyId);

      if (filter.length > 0 && !filter.includes(facultyId)) {
        continue;
      }

      results[row.facultyId] ??= [];

      results[row.facultyId].push(parseBehestanRow(row, term));
    }

    console.log("8 scrape complete");

    return results;
  } finally {
    await browser.close();

    await rm(downloadDir, {
      recursive: true,
      force: true,
    });
  }
}

// scrape(process.env.USERNAME!, process.env.PASSWORD!);
