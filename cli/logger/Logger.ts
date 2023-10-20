import { logBox, screen } from "../blessed/windows";

class Logger {
  log(...args: any) {
    const message = args.join(" ");
    logBox.pushLine(`{bold}${message}{/bold}`);
    logBox.setScrollPerc(100);
    screen.render();
  }
}
const logger = new Logger();
export { logger };
