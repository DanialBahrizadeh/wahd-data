import dotenv from "dotenv";
import { writeFile } from "fs/promises";
import puppeteer, { Page } from "puppeteer";

// TODO: shuold make the term and the collegeId as an argument so we could get the data of old terms too
const term = "4041";
const collegeId = "57";
// row type
type Row = {
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
  examInfo: string;
  limits: string;
  chosenSimister: string;
  moreInfo: string;
};

dotenv.config({ override: true });

// start the broser
const browser = await puppeteer.launch({
  headless: false,
});
const page = await browser.newPage();

await page.goto("https://golestan.kntu.ac.ir/forms/authenticateuser/main.htm", {
  waitUntil: "networkidle0",
});

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
await page.type("#username", process.env.USERNAME || "faild");
await page.type("#password", process.env.USERNAME || "faild");

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
const tableData = await newPage!.evaluate((term) => {
  const rows: Row[] = [];
  const tbody = document.querySelector("tbody");
  const trElements = tbody!.querySelectorAll("tr");

  // the header of each column
  const idxToHeader = {
    0: "collegeId",
    1: "collegeName",
    2: "lessonGruopId",
    3: "lessonGruopName",
    4: "lessonId",
    5: "lessonName",
    6: "credits",
    7: "actionCredits",
    8: "cap",
    9: "signin",
    10: "waitingList",
    11: "sex",
    12: "teacher",
    13: "placeAndTime",
    14: "examInfo",
    15: "limits",
    16: "chosenSimister",
    20: "moreInfo",
  };

  trElements.forEach((tr, rowIndex) => {
    // NOTE: first row is only the headers
    if (rowIndex === 0) return;

    // NOTE: the the 4th col of each row is the lessonId thus making the term + row a unique id
    const row: Row = { id: term + tr.children[4].textContent } as Row;

    const cells = tr.querySelectorAll("td");

    cells.forEach((cell, colIndex) => {
      // skip unimportant cols
      if ([17, 18, 19].includes(colIndex)) return;

      // those have nested element inside
      if (colIndex === 6 || colIndex === 7) {
        row[idxToHeader[colIndex]] = cell.querySelector("nobr")!.textContent;
        return;
      }

      row[idxToHeader[colIndex]] = cell.textContent;
    });
    rows.push(row);
  });

  return rows;
}, term);

await writeFile("data.json", JSON.stringify(tableData));

await newPage!.close();
await page.close();
await browser.close();
