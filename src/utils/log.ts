// @

// const { inspect } = require("node:util");

// define colors used in \x1b[ escape sequences
const colors = {
  red: 31,
  green: 32,
  yellow: 33,
  blue: 34,
  purple: 35,
  cyan: 36,
  white: 37,
  brightRed: 91,
  brightGreen: 92,
  brightYellow: 93,
  brightBlue: 94,
  brightPurple: 95,
  brightCyan: 96,
  brightWhite: 7
};
Object.freeze(colors);

let titlecolor = 0;

export function log(color: keyof typeof colors = "white", suffix = "") {
  /**
   * @param {string} data
   */
  return (...data: string[]) => {
    const time = new Date();
    const ms = time.getMilliseconds().toString().charAt(0);
    let hours = time.getHours().toString();
    let minutes = time.getMinutes().toString();
    let seconds = time.getSeconds().toString();
    let month = (time.getMonth() + 1).toString();
    let date = time.getDate().toString();
    month = "0".repeat(2 - month.length) + month;
    date = "0".repeat(2 - date.length) + date;
    hours = "0".repeat(2 - hours.length) + hours;
    minutes = "0".repeat(2 - minutes.length) + minutes;
    seconds = "0".repeat(2 - seconds.length) + seconds;

    if (process.stdout.isTTY) process.stdout.write(
      `\r \x1b[${colors[color]};1m[${month}-${date} ${hours}:${minutes}:${seconds}.${ms}]\x1b[0m ` + suffix + " " + data.join(" ") + "\x1b[0m\n"
    ); else process.stdout.write(
      `[${month}-${date} ${hours}:${minutes}:${seconds}.${ms}] ` + suffix + " " + data.join(" ") + "\n"
    );
  }
}

log.title = (color: keyof typeof colors, data: string) => {
  titlecolor = colors[color];
  if (process.stdout.isTTY)
    process.stdout.write(`\x1b[${colors[color]};7;1m ${data}    \x1b[0;${colors[color]}m\x1b[0m\ns`);
  else {
    process.stdout.write(`<<<< ${data} >>>>\n`);
  }
}
log.end = () => {
  if (process.stdout.isTTY) process.stdout.write(`\x1b[${titlecolor};7;1m \x1b[0;${titlecolor}m\x1b[0m\n`);
  else process.stdout.write(">>>> <<<<\n");
  titlecolor = 0;
}
log.clear = () => {
  if (process.stdout.isTTY) process.stdout.write("\x1b[3J\x1b[2J\x1b[1;1H");
}
