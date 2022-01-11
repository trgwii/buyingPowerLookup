export const scrambleArray = <T>(a: T[]) =>
  a.map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
