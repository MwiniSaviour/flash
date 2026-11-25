import { describe, expect, it } from "vitest";

import { assertSellerOwns } from "./ownership";

describe("assertSellerOwns", () => {
  it("allows the owner", () => {
    expect(() => assertSellerOwns("user_1", "user_1", "business_owner")).not.toThrow();
  });

  it("allows an admin on any product", () => {
    expect(() => assertSellerOwns("user_1", "user_2", "admin")).not.toThrow();
  });

  it("rejects a different seller and an unowned product", () => {
    expect(() => assertSellerOwns("user_1", "user_2", "business_owner")).toThrow("Not your product");
    expect(() => assertSellerOwns(null, "user_1", "business_owner")).toThrow("Not your product");
  });

  it("rejects a customer even on their own id", () => {
    expect(() => assertSellerOwns("user_1", "user_1", "customer")).toThrow("Not your product");
  });
});
