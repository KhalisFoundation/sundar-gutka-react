import STRINGS from "../../../../common/localization";

export const defaultReminders = (baniList) => {
  return [
    {
      key: 0,
      gurmukhi: baniList[0].gurmukhi,
      translit: baniList[0].translit,
      enabled: true,
      title: `${STRINGS.time_for} ${baniList[0].translit}`,
      time: "3:00 AM",
    },
    {
      key: 1,
      gurmukhi: baniList[1].gurmukhi,
      translit: baniList[1].translit,
      enabled: true,
      title: `${STRINGS.time_for} ${baniList[1].translit}`,
      time: "3:30 AM",
    },
    {
      key: 19,
      gurmukhi: baniList[19].gurmukhi,
      translit: baniList[19].translit,
      enabled: true,
      title: `${STRINGS.time_for} ${baniList[19].translit}`,
      time: "6:00 PM",
    },
    {
      key: 21,
      gurmukhi: baniList[21].gurmukhi,
      translit: baniList[21].translit,
      enabled: true,
      title: `${STRINGS.time_for} ${baniList[21].translit}`,
      time: "10:00 PM",
    },
  ];
};
