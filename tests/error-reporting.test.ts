import { describe, test, expect } from "vitest";
import { ERROR_MESSAGE_TYPE, isErrorReport, serializeError } from "../src/error-reporting";

describe("serializeError", () => {
  test("serializes an Error with name, message and stack", () => {
    const err = new TypeError("boom");
    const report = serializeError("content", err, "changeSidebarColor");
    expect(report.type).toBe(ERROR_MESSAGE_TYPE);
    expect(report.source).toBe("content");
    expect(report.name).toBe("TypeError");
    expect(report.message).toBe("boom");
    expect(report.stack).toContain("boom");
    expect(report.operation).toBe("changeSidebarColor");
  });

  test("serializes a non-Error value", () => {
    const report = serializeError("option", { code: 1 });
    expect(report.name).toBe("NonError");
    expect(report.message).toBe('{"code":1}');
    expect(report.stack).toBeUndefined();
  });

  test("serializes a string", () => {
    expect(serializeError("background", "oops").message).toBe("oops");
  });
});

describe("isErrorReport", () => {
  test("accepts a serialized report", () => {
    expect(isErrorReport(serializeError("content", new Error("x")))).toBe(true);
  });

  test("rejects the empty re-apply message and other values", () => {
    expect(isErrorReport({})).toBe(false);
    expect(isErrorReport(null)).toBe(false);
    expect(isErrorReport({ type: "other" })).toBe(false);
  });
});
