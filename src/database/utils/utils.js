import constant from "../../common/constant";

export const getTranslitText = (translit, language) => {
  const json = JSON.parse(translit);
  switch (language) {
    case constant.ENGLISH:
      return json.en;
    case constant.HINDI:
      return json.hi;
    case constant.SHAHMUKHI:
      return json.ur;
    case constant.IPA:
      return json.ipa;
    default:
      return json.en;
  }
};
