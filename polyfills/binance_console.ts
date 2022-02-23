export default console;

export class Console {
}
(console as unknown as { Console: Console }).Console = Console;

export const {
  assert,
  clear,
  count,
  countReset,
  debug,
  dir,
  dirxml,
  error,
  group,
  groupCollapsed,
  groupEnd,
  info,
  log,
  table,
  time,
  timeEnd,
  timeLog,
  trace,
  warn,
} = console;
