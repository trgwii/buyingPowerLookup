export const scrambleArray = <T>(a: T[]) =>
  a.map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
export const propIsNaN = (obj: any, prop: string) => {
  return prop in obj &&
    obj[prop as keyof typeof obj] &&
    String(obj[prop as keyof typeof obj]).length &&
    isNaN(Number(obj[prop as keyof typeof obj]));
};
