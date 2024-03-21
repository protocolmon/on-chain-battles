import { initializeApp } from "firebase-admin/app";

initializeApp();

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// import { airdropGas } from "./scheduled/airdropGas";
import { discordMatchQueue } from "./scheduled/discordMatchQueue";

export { discordMatchQueue };
