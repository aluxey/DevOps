import { expect, test } from "vitest";
import { add } from "./index";

test("add 2 + 2", () => {
  expect(add(2, 2)).toBe(4);
});
