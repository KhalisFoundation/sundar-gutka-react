import STRINGS from "../common/localization";

/**
 * Seva configuration service.
 *
 * Currently returns hardcoded filler data.
 * TODO: Replace getSevaConfig() body with a real STTM API call when the
 *       endpoint is available. All consumers are already coded against this
 *       interface so no other changes will be needed.
 */

/** @typedef {'one_time' | 'recurring' | 'unknown'} DonorType */
/** @typedef {'stripe' | 'qgiv' | 'unknown'} DonorSource */
/** @typedef {'qgiv_prefill_open' | 'stripe' | 'qgiv_embedded'} PaymentMode */

/**
 * @typedef {Object} SevaConfig
 * @property {string}      configVersion
 * @property {string}      country          - ISO 3166-1 alpha-2, e.g. "US"
 * @property {Object}      content
 * @property {string}      content.headline
 * @property {string}      content.description
 * @property {Object}      defaults
 * @property {number[]}    defaults.amounts
 * @property {number}      defaults.selectedAmount
 * @property {PaymentMode} payment_mode
 * @property {boolean}     showSevaDot
 */

/** Filler defaults used until the STTM API is integrated. */
const FILLER_CONFIG = {
  configVersion: "mock-v1",
  country: "US",
  content: {
    headline: "ਸੁੰਦਰ ਗੁਟਕਾ",
    description:
      "Is built by volunteers at Khalis Foundation, a non-profit organization " +
      "that builds software like Sundar Gutka and SikhiToTheMax. Khalis helps " +
      "millions of Sikhs around the world connect with Gurbani. You can be part " +
      "of this seva as well; serve millions with a single donation.",
    descriptionLinks: [
      { text: "Khalis Foundation", url: "https://khalisfoundation.org/" },
      { text: "SikhiToTheMax", url: "https://sikhitothemax.org/" },
    ],
    taxMessage: "Your donation is tax-deductible. You will receive a receipt via email.",
    nonUsTaxMessage: "Thank you for your generous support of Khalis Foundation.",
    footerText: "Know coding? You can also do seva through open source contributions.",
    donatedHeadline: "ਵਾਹਿਗੁਰੂ ਜੀ ਕਾ ਖਾਲਸਾ",
    donatedDescription:
      "Thank you for your generous support. Your seva helps Sikhs around the world connect with Gurbani.",
    recurringRetentionDescription:
      "Your monthly seva is making a difference. Thank you for your continued support.",
    convertToRecurringCTA: "Upgrade to Monthly Giving",
  },
  defaults: {
    amounts: [10, 50, 100],
    selectedAmount: 10,
  },
  payment_mode: "qgiv_prefill_open",
  showSevaDot: true,
};

/**
 * Returns the Seva configuration.
 * Async signature is intentional so the real API call can be dropped in later.
 *
 * @returns {Promise<SevaConfig>}
 */
export const getSevaConfig = async () => {
  // TODO: replace with fetch from STTM API + AsyncStorage cache
  return {
    ...FILLER_CONFIG,
    content: {
      ...FILLER_CONFIG.content,
      description: STRINGS.SEVA_DESCRIPTION,
      footerText: STRINGS.SEVA_FOOTER_TEXT,
    },
  };
};

/**
 * Builds a Qgiv prefill URL using Qgiv's path-segment format.
 *
 * Qgiv URL shortcuts stack as path segments:
 *   /amount/[value]          – selects a preset suggested amount on the form
 *   /amount/other/[value]    – pre-fills the "other amount" field
 *   /frequency/[letter]      – m=monthly, a=annually, w=weekly, q=quarterly, s=semiannually
 *
 * @param {Object} params
 * @param {number} params.amount
 * @param {'one_time'|'recurring'} params.donationType
 * @param {'Monthly'|'Annually'} [params.frequency]
 * @returns {string}
 */
export const buildQgivUrl = ({ amount, donationType, frequency }) => {
  // TODO: replace with the real Qgiv form key
  let url = "https://secure.qgiv.com/for/khalisfoundation";

  // Amount segment - always pre-fill the "other" field to guarantee pre-filling on the Qgiv form
  if (amount) {
    const formatted = Number(amount).toFixed(2);
    url += `/amount/other/${formatted}`;
  }

  // Frequency segment - only append for recurring; omitting it defaults to One Time on Qgiv forms
  if (donationType === "recurring") {
    const freqLetter = frequency === "Annually" ? "a" : "m"; // default monthly
    url += `/frequency/${freqLetter}`;
  }

  return url;
};
