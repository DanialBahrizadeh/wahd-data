const faculties = [
  0, // all
  11, // electrical
  19, // computer
  20, // e-learning
  21,
  22, // civil
  33, // mechanical
  42, // physics
  44, // science
  48, // chemistry
  55,
  57, // mathematics
  66, // industrial
  77, // geomatics
  88, // aerospace
  99, // materials
] as const;

const facultyIndexMap: Record<number, number> = {
  11: 2,
  19: 3,
  20: 4,
  21: 5,
  22: 6,
  33: 7,
  42: 8,
  44: 9,
  48: 10,
  55: 11,
  57: 12,
  66: 13,
  77: 14,
  88: 15,
  99: 16,
};

export default faculties;

