import { customAlphabet } from "nanoid";

const generate = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8
);

export function createShortId() {
  return generate();
}
