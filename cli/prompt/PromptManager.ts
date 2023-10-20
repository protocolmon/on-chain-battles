import * as blessed from "blessed";
import { screen } from "../blessed/windows";

type PromptType = "multiSelect" | "select";

const commonStyles = {
  fg: "white",
  bg: "cyan",
  focus: {
    bg: "cyan",
    fg: "white",
    bold: false,
    padding: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  },
};

class PromptManager {
  isPromptOpen = false;
  buttonSet?: blessed.Widgets.BoxElement;
  promptForm?: blessed.Widgets.FormElement<any>;
  loading?: blessed.Widgets.BoxElement;

  constructor() {
    this.initLoadingState();
  }

  initLoadingState() {
    this.loading = blessed.box({
      parent: screen,
      top: Number(screen.height) - 5,
      left: "center",
      width: "50%",
      height: 3,
      content: "Please wait...",
      align: "center",
      valign: "middle",
      border: {
        type: "line",
      },
      style: {
        ...commonStyles,
        border: {
          fg: "blue",
        },
      },
    });
  }

  showLoadingState() {
    this.loading?.show();
    screen.render();
  }

  hideLoadingState() {
    this.loading?.hide();
  }

  async createPrompt(
    type: PromptType,
    message: string,
    choices: string[],
    maxChoices?: number,
  ): Promise<string[]> {
    return new Promise((resolve) => {
      this.isPromptOpen = true;
      this.hideLoadingState();
      this.promptForm?.detach();

      this.promptForm = blessed.form({
        parent: screen,
        keys: true,
        left: 0,
        bottom: 0,
        width: "100%",
        height: choices.length + 3,
        border: { type: "line" },
        style: commonStyles,
      });

      this.buttonSet = blessed.box({
        parent: this.promptForm,
        top: 1,
        width: "100%",
      });

      let currentCheckedCount = 0;

      choices.forEach((choice, index) => {
        if (type === "multiSelect") {
          const checkBox = blessed.checkbox({
            parent: this.buttonSet,
            top: index,
            left: 0,
            content: choice.trim(),
            mouse: true,
            style: commonStyles,
          });

          checkBox.on("check", () => {
            currentCheckedCount++;
            if (maxChoices && currentCheckedCount > maxChoices) {
              checkBox.uncheck();
              currentCheckedCount--;
            }
          });

          checkBox.on("uncheck", () => currentCheckedCount--);
        } else {
          blessed.radiobutton({
            parent: this.buttonSet,
            top: index,
            left: 0,
            content: ` ${choice}`,
            mouse: true,
            style: {
              ...commonStyles,
              focus: { bold: true },
            },
          });
        }
      });

      const submitButton = blessed.button({
        parent: this.promptForm,
        top: choices.length + 1,
        left: "center",
        shrink: true,
        name: "submit",
        content: "Submit",
        style: {
          ...commonStyles,
          focus: { bg: "magenta" },
          hover: {
            bg: "magenta",
          },
        },
        padding: {
          left: 1,
          right: 1,
        },
        keys: ["enter"],
        mouse: true,
      });

      submitButton.on("press", () => {
        const selected: string[] = [];
        this.buttonSet?.children.forEach((child) => {
          if ((child as any).checked) {
            let content = (child as any).content.trim();
            if (content.startsWith("[x]") || content.startsWith("(*)")) {
              content = content.substring(4);
            }
            selected.push(content.trim());
          }
        });

        this.isPromptOpen = false;
        this.promptForm?.detach();
        this.showLoadingState();
        screen.render();
        resolve(selected);
      });

      blessed.text({
        parent: this.promptForm,
        top: 0,
        left: "center",
        content: message,
      });

      screen.render();
    });
  }
}

const promptManager = new PromptManager();
export { promptManager };
