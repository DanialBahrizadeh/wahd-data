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

const genderSpecificFaculties = new Set<number>([42, 55]);

export function getFacultyCacheId(facultyId: number, gender: number): string {
  if (!genderSpecificFaculties.has(facultyId)) {
    return String(facultyId);
  }

  const prefix = gender === 1 ? "man" : "woman";

  return `${prefix}-${facultyId}`;
}

export default faculties;
