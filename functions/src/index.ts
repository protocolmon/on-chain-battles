import { initializeApp } from "firebase-admin/app";

initializeApp();

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

import { discordMatchQueue } from "./scheduled/discordMatchQueue";

export { discordMatchQueue };
