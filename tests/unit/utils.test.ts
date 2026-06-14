import { describe, it, expect } from "vitest";
import {
  formatMeetingDate,
  getDurationLabel,
  getStatusColor,
  getPriorityColor,
  getInitials,
  truncate,
} from "@/lib/utils";

describe("formatMeetingDate", () => {
  it("formats a valid ISO date string", () => {
    // Use a past date so it never hits today/tomorrow logic
    const result = formatMeetingDate("2020-01-15T10:30:00.000Z");
    expect(result).toBeTypeOf("string");
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain("2020");
  });

  it("returns empty string for null", () => {
    expect(formatMeetingDate(null as unknown as string)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(formatMeetingDate(undefined as unknown as string)).toBe("");
  });

  it("returns empty string for invalid date string", () => {
    expect(formatMeetingDate("not-a-date")).toBe("");
  });
});

describe("getDurationLabel", () => {
  it("returns minutes for sub-hour durations", () => {
    expect(getDurationLabel(30)).toBe("30 min");
    expect(getDurationLabel(45)).toBe("45 min");
    expect(getDurationLabel(15)).toBe("15 min");
  });

  it("returns whole hours", () => {
    expect(getDurationLabel(60)).toBe("1 hr");
    expect(getDurationLabel(120)).toBe("2 hr");
  });

  it("returns decimal hours for non-round durations", () => {
    expect(getDurationLabel(90)).toBe("1.5 hr");
    expect(getDurationLabel(150)).toBe("2.5 hr");
  });

  it("returns — for null", () => {
    expect(getDurationLabel(null as unknown as number)).toBe("—");
  });

  it("returns — for undefined", () => {
    expect(getDurationLabel(undefined as unknown as number)).toBe("—");
  });
});

describe("getStatusColor", () => {
  it("returns blue classes for scheduled", () => {
    expect(getStatusColor("scheduled")).toContain("blue");
  });

  it("returns green classes for live", () => {
    // live maps to green-600 in utils.ts
    expect(getStatusColor("live")).toContain("green");
  });

  it("returns gray classes for completed", () => {
    expect(getStatusColor("completed")).toContain("gray");
  });

  it("returns red classes for cancelled", () => {
    expect(getStatusColor("cancelled")).toContain("red");
  });

  it("returns a non-empty string for unknown status", () => {
    expect(getStatusColor("unknown")).toBeTypeOf("string");
    expect(getStatusColor("unknown").length).toBeGreaterThan(0);
  });
});

describe("getPriorityColor", () => {
  it("returns red for high priority", () => {
    expect(getPriorityColor("high")).toContain("red");
  });

  it("returns orange for medium priority", () => {
    expect(getPriorityColor("medium")).toContain("orange");
  });

  it("returns green for low priority", () => {
    expect(getPriorityColor("low")).toContain("green");
  });

  it("handles null gracefully", () => {
    expect(getPriorityColor(null)).toBeTypeOf("string");
  });
});

describe("getInitials", () => {
  it("extracts initials from a full name", () => {
    expect(getInitials("Alice Chen")).toBe("AC");
    expect(getInitials("Bob Rodriguez")).toBe("BR");
  });

  it("handles a single-word name", () => {
    expect(getInitials("Alice")).toBe("A");
  });

  it("caps at 2 characters even for long names", () => {
    expect(getInitials("Alice Bob Charlie").length).toBe(2);
  });

  it("returns ? for null", () => {
    expect(getInitials(null)).toBe("?");
  });

  it("returns ? for empty string", () => {
    expect(getInitials("")).toBe("?");
  });
});

describe("truncate", () => {
  it("truncates long strings with ellipsis character", () => {
    const result = truncate("Hello World this is a long string", 10);
    // utils.ts uses the single … character (U+2026), not three dots
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(11); // 10 chars + 1 ellipsis
  });

  it("does not truncate strings shorter than the limit", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("does not truncate strings exactly at the limit", () => {
    expect(truncate("Hello World", 11)).toBe("Hello World");
  });

  it("handles empty strings", () => {
    expect(truncate("", 10)).toBe("");
  });

  it("uses 80 as default limit", () => {
    const long = "a".repeat(90);
    const result = truncate(long);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBe(81); // 80 + ellipsis
  });
});
