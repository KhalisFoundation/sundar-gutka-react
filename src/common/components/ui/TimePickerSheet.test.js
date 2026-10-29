import { clampTyped, parse } from "./TimePickerSheet";


// The picker round-trips through a "h:mm A" string, because that is the format
// the reminder store and `parseTimeString` in notifications.js both expect.
// Getting this wrong schedules a reminder at the wrong hour, silently — so the
// parse half is pinned here.

describe("time parsing", () => {
  it.each([
    ["3:00 AM", { hour: "3", minute: "00", meridiem: "AM" }],
    ["3:30 AM", { hour: "3", minute: "30", meridiem: "AM" }],
    ["6:00 PM", { hour: "6", minute: "00", meridiem: "PM" }],
    ["10:00 PM", { hour: "10", minute: "00", meridiem: "PM" }],
    ["12:05 AM", { hour: "12", minute: "05", meridiem: "AM" }],
    ["11:59 PM", { hour: "11", minute: "59", meridiem: "PM" }],
  ])("parses %s", (input, expected) => {
    expect(parse(input)).toEqual(expected);
  });

  it("tolerates lowercase and stray whitespace", () => {
    expect(parse("  7:15 pm ")).toEqual({ hour: "7", minute: "15", meridiem: "PM" });
  });

  it("falls back to a valid time rather than throwing on junk", () => {
    // A malformed stored value must not crash the sheet open.
    [undefined, null, "", "not a time", "25:99"].forEach((bad) => {
      expect(parse(bad)).toEqual({ hour: "12", minute: "00", meridiem: "AM" });
    });
  });

  it("round-trips every value the picker can produce", () => {
    // The columns emit `${hour}:${minute} ${meridiem}`; parsing that must give
    // back exactly what was selected, or editing a reminder twice would drift.
    ["1", "9", "12"].forEach((hour) => {
      ["00", "07", "45"].forEach((minute) => {
        ["AM", "PM"].forEach((meridiem) => {
          expect(parse(`${hour}:${minute} ${meridiem}`)).toEqual({ hour, minute, meridiem });
        });
      });
    });
  });
});

// Typed entry. The field is the other half of the picker now, so bad input has
// to be contained here rather than reaching the reminder store.
describe("typed entry is clamped", () => {
  it.each([
    ["7", "7"],
    ["07", "7"],
    ["12", "12"],
    ["13", "12"],
    ["99", "12"],
    ["0", "1"],
  ])("hour %s becomes %s", (input, expected) => {
    expect(clampTyped(input, "hour")).toBe(expected);
  });

  it.each([
    ["0", "00"],
    ["5", "05"],
    ["59", "59"],
    ["60", "59"],
    ["99", "59"],
  ])("minute %s becomes %s", (input, expected) => {
    expect(clampTyped(input, "minute")).toBe(expected);
  });

  it("strips anything that is not a digit", () => {
    expect(clampTyped("1a2", "minute")).toBe("12");
    expect(clampTyped("-5", "minute")).toBe("05");
  });

  it("returns empty for an empty field so the caller can keep the old value", () => {
    // Committing "" would otherwise schedule a reminder at NaN o'clock.
    expect(clampTyped("", "hour")).toBe("");
    expect(clampTyped("abc", "minute")).toBe("");
  });

  it("never exceeds two digits, however many are typed", () => {
    expect(clampTyped("1234", "minute")).toBe("12");
  });
});
