import persianDate from "persian-date";

// map the the time to querters so they are easir to work with
const timeToFloat = (time: string) => {
  const parts = time.split(":");
  return Number(parts[0]) + Number(parts[1]) / 60;
};

// map the persion day to numbers so they are easier to work with
const dayMap = {
  شنبه: 0,
  يكشنبه: 1,
  دوشنبه: 2,
  سهشنبه: 3,
  چهارشنبه: 4,
  پنجشنبه: 5,
  جمعه: 6,
};

export const scheduleParser = (placeAndTime: string) =>
  placeAndTime
    .replaceAll("درس(ت):", "")
    .split("،") // schedules are seperated via persion comma
    .map((schedule) => schedule.split("مکان:")[0]) // take the things before the place which are time
    .map((schedule) => {
      const parts = schedule.trim().split(" ");
      const [start, end] = parts.at(-1)!.split("-").map(timeToFloat); // the last things is time like 13:30-15:00
      const day = dayMap[parts.slice(0, -1).join("").trim()]; // everything before the last thing are the day and and other spaces

      return { day, start, end };
    });

export const placeParser = (placeAndTime: string) =>
  placeAndTime
    .replaceAll("درس(ت):", "")
    .split("،")[0] // schedules are seperated via persion comma
    .split("مکان:")[1];

export const sexParser = (sex: string) => {
  const sexMap = {
    زن: 0,
    مرد: 1,
    مختلط: 2,
  };
  return sexMap[sex];
};

export const examDateParser = (examDate: string) => {
  const [dates, hours] = examDate.split("ساعت:");
  const [year, month, day] = dates
    .replace("تاريخ:", "")
    .trim()
    .split("/")
    .map(Number);
  const [hour, minute] = hours.trim().split("-")[0].split(":").map(Number);

  return new persianDate([year, month, day, hour, minute]).valueOf(); // save the date unix timestamps
};
