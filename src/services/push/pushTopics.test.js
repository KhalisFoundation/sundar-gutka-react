/* eslint-env jest */
import { TOPIC_ALL, topicsFor, topicsToLeave } from "./pushTopics";

describe("topicsFor", () => {
  it("puts every device on `all`, its platform and its language", () => {
    expect(topicsFor({ platform: "android", lang: "pa" })).toEqual([
      TOPIC_ALL,
      "platform-android",
      "lang-pa",
    ]);
  });

  it("normalises the language to a topic-safe lowercase tag", () => {
    expect(topicsFor({ platform: "ios", lang: "en-US" })).toEqual([
      TOPIC_ALL,
      "platform-ios",
      "lang-en-us",
    ]);
  });

  it("omits a level it does not know", () => {
    expect(topicsFor({ platform: "ios", lang: "" })).toEqual([TOPIC_ALL, "platform-ios"]);
  });
});

describe("topicsToLeave", () => {
  it("names only the topics no longer wanted, so a language switch leaves the old one", () => {
    const before = topicsFor({ platform: "ios", lang: "pa" });
    const after = topicsFor({ platform: "ios", lang: "hi" });

    expect(topicsToLeave(before, after)).toEqual(["lang-pa"]);
  });
});
