declare module "persian-date" {
  class PersianDate {
    constructor(date?: number[] | Date | number);

    valueOf(): number;
  }

  export default PersianDate;
}
