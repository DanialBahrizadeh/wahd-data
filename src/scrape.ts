import puppeteer, { Page } from "puppeteer";
import type { UnParsedRow } from "./types/lesson";
import { writeFile } from "fs/promises";
import { env } from "./config/env";
import { parseRow } from "./utils/parsers";

// TODO: shuold make the term and the collegeId as an argument so we could get the data of old terms too
// row type

// start the broser

export default async function scrape(collegeId: string, term: string = "4041") {
  const browser = await puppeteer.launch({
    headless: env.DEBUG_MODE ? false : true,
  });

  const page = await browser.newPage();

  await page.goto(
    "https://golestan.kntu.ac.ir/forms/authenticateuser/main.htm",
    {
      waitUntil: "networkidle0",
    },
  );

  // click on sso to auth
  // console.log(page.frames().map((f) => f.name()));

  // NOTE: golestan add frames on top each other so i have to always chose the last one
  let formBody = page
    .frames()
    .filter((f) => f.name() === "Form_Body")
    .at(-1);

  await formBody?.waitForSelector("#tdmsrt a", { visible: true });
  await formBody?.click("#tdmsrt a");

  // wait and then enter the data
  page.waitForSelector("#username", { visible: true });
  await page.type("#username", env.USERNAME);
  await page.type("#password", env.PASSWORD);

  await page.click("#kc-login");

  // wait and then pick the 102 report and click
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  let f2 = await page.waitForSelector("#Faci2", { visible: true });

  while (!f2) {
    await new Promise(() => setTimeout(() => {}, 1000));
    f2 = await page.waitForSelector("#Faci2", { visible: true });
  }

  // console.log(page.frames().map((f) => f.name()));
  // console.log(f2);
  formBody = page
    .frames()
    .filter((f) => f.name() === "Form_Body")
    .at(-1);

  await formBody?.waitForSelector("#F20851", { visible: true });
  await formBody?.type("#F20851", "102");
  await formBody?.click("#OK");

  // wait and fill the college code

  await page.waitForNetworkIdle();

  let f3 = page.frames().find((f) => f.name() === "Faci3");

  while (!f3) {
    await new Promise(() => setTimeout(() => {}, 1000));
    f3 = page.frames().find((f) => f.name() === "Faci3");
  }

  // console.log(page.frames().map((f) => f.name()));
  // console.log(f3);
  formBody = page
    .frames()
    .filter((f) => f.name() === "Form_Body")
    .at(-1);

  await formBody!.waitForSelector("#GV024722_0", { visible: true });
  await formBody!.type("#GF078012_0", collegeId);

  let commander = page
    .frames()
    .filter((f) => f.name() === "Commander")
    .at(-1);

  await commander?.waitForSelector("#IM16_ViewRep", { visible: true });
  await commander?.click("#IM16_ViewRep");

  // NOTE: golestand open a new page when clicking "show as a table"
  let newPage: Page | null = null;

  const newTargetPromise = new Promise((resolve) => {
    browser.on("targetcreated", async (target) => {
      if (target.type() === "page") {
        newPage = await target.page();
        console.log("New page created:", newPage!.url());
        resolve(newPage);
      }
    });
  });

  commander = page
    .frames()
    .filter((f) => f.name() === "Commander")
    .at(-1);

  await commander?.waitForSelector("#ExToEx", { visible: true });
  await commander?.click("#ExToEx");

  // just to be sure the page pupped
  await Promise.race([
    newTargetPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("No popup opened")), 10000),
    ),
  ]);

  await newPage!.waitForSelector("table", { visible: true });

  // itarate over the table
  const UnParsedTableData = await newPage!.evaluate((term) => {
    const rows: UnParsedRow[] = [];
    const tbody = document.querySelector("tbody");
    const trElements = tbody!.querySelectorAll("tr");

    // the header of each column
    const idxToHeader: Record<number, keyof UnParsedRow> = {
      // 0: "collegeId",
      // 1: "collegeName",
      // 2: "lessonGruopId",
      // 3: "lessonGruopName",
      4: "lessonId",
      5: "lessonName",
      6: "credits",
      7: "actionCredits",
      8: "cap",
      9: "signin",
      // 10: "waitingList",
      // 11: "sex",
      12: "teacher",
      14: "examDate",
      15: "limits",
      16: "chosenSimister",
      20: "moreInfo",
    };

    trElements.forEach((tr, rowIndex) => {
      // NOTE: first row is only the headers
      if (rowIndex === 0) return;

      // NOTE: the the 4th col of each row is the lessonId thus making the term + row a unique id
      const row: UnParsedRow = {
        id: term + tr.children[4].textContent,
      } as UnParsedRow;

      const cells = tr.querySelectorAll("td");

      cells.forEach((cell, colIndex) => {
        // NOTE: the 14th cell is placeAndTime
        if (colIndex === 13) {
          row["place"] = cell.textContent?.trim() || "";
          row["classTime"] = cell.textContent?.trim() || "";
        }

        if (!Object.keys(idxToHeader).map(Number).includes(colIndex)) {
          return;
        }

        //@ts-ignore
        row[idxToHeader[colIndex]] = cell.textContent?.trim() || "";
      });
      rows.push(row);
    });

    return rows;
  }, term);

  const tableData = UnParsedTableData.map(parseRow);
  // write the data only in DEBUG_MODE
  if (env.DEBUG_MODE) await writeFile("data.json", JSON.stringify(tableData));

  await newPage!.close();
  await page.close();
  await browser.close();

  return tableData;
}
