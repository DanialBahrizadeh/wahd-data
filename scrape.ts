import dotenv from "dotenv";
import puppeteer from "puppeteer";

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

console.log(page.frames().map((f) => f.name()));

let formBody = page
  .frames()
  .filter((f) => f.name() === "Form_Body")
  .at(-1);

await formBody?.waitForSelector("#tdmsrt a", { visible: true });
await formBody?.click("#tdmsrt a");

// wait and then enter the data
// await page.waitForNavigation();

page.waitForSelector("#username", { visible: true });
await page.type("#username", process.env.USERNAME || "faild");
await page.type("#password", process.env.USERNAME || "faild");

// await page.locator("#kc-login").click();
await page.click("#kc-login");

// wait and then pick the 102 report and click
await page.waitForNavigation({ waitUntil: "networkidle0" });

let f2 = await page.waitForSelector("#Faci2", { visible: true });

while (!f2) {
  await new Promise(() => setTimeout(() => {}, 1000));
  f2 = await page.waitForSelector("#Faci2", { visible: true });
}

console.log(page.frames().map((f) => f.name()));
console.log(f2);
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

console.log(page.frames().map((f) => f.name()));
console.log(f3);
formBody = page
  .frames()
  .filter((f) => f.name() === "Form_Body")
  .at(-1);

await formBody?.waitForSelector("#GV024722_0", { visible: true });
await formBody?.type("#GF078012_0", "57");

let commander = page
  .frames()
  .filter((f) => f.name() === "Commander")
  .at(-1);

await commander?.waitForSelector("#IM16_ViewRep", { visible: true });
await commander?.click("#IM16_ViewRep");
