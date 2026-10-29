/**
 * Localized, offline-first BUNDLED Seva content.
 *
 * A faithful, full-parity mirror of the backend's server-driven content
 * (khalis-users-api → src/seva/seva-content.ts and src/seva-means/content/*),
 * generated for all six app languages. This is shown ONLY to a first-time user
 * who is offline with an empty cache — the last tier of the network → cache →
 * bundled fallback chain. Real backend content always replaces it the moment a
 * fetch succeeds, and is cached per-language thereafter.
 *
 * Keep the translation tables below in sync with the backend's i18n tables.
 */

export const BUNDLED_LANGS = ["en", "hi", "pa", "fr", "it", "es"];
const DEFAULT_LANG = "en";

/** Normalises an app language (e.g. "en-US", "DEFAULT", "pa") to a bundled lang. */
export const normalizeBundledLang = (input) => {
  const raw = String(input || "")
    .trim()
    .toLowerCase();
  if (!raw || raw === "default") return DEFAULT_LANG;
  const primary = raw.split(/[-_]/)[0];
  return BUNDLED_LANGS.includes(primary) ? primary : DEFAULT_LANG;
};

const pick = (dict, key, lang) => dict[key]?.[lang] ?? dict[key]?.[DEFAULT_LANG] ?? key;

// Same constrained-subset escaping the backend uses; the app's parseHtmlBlocks
// decodes these back, so it round-trips. No-op for plain text, correct if a
// translation ever gains a special char.
const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const urlAttr = (u) => String(u).replace(/"/g, "%22");

// URLs — mirror of khalis-users-api seva-means/content/links.ts.
const LINKS = {
  khalisWebsite: "https://khalisfoundation.org/",
  sttmWebsite: "https://www.sikhitothemax.org/",
  githubRepo: "https://github.com/KhalisFoundation/sundar-gutka-react",
  githubIssues: "https://github.com/KhalisFoundation/sundar-gutka-react/issues",
  notionGoodFirstIssues:
    "https://app.notion.com/p/Sundar-Gutka-Good-First-Issues-3a6fd247b78080f4abb9ea85462c1ebc",
  slack: "https://forms.gle/zc7JQiLHGxHKXP599",
  qaTestBuild: "https://forms.gle/bPfiYhKQS8h6z1Vm7",
  // Not a Google Form: one carrying a file-upload question is refused to any
  // signed-out browser, and the iOS in-app browser keeps its own cookie store
  // with no Google session in it, so the report link could never open there.
  qaFeedbackForm: "https://tally.so/r/obPOg1",
  ideasForm: "https://forms.gle/EMUMZZiw8WXiFojCA",
  // Declared in the order the social page lists them. An empty string means
  // "no published account yet" — the renderer drops the row rather than
  // emitting a link that goes nowhere.
  khalisSubstack: "https://khalisfoundation.substack.com/",
  khalisInstagram: "https://www.instagram.com/khalisfound/",
  khalisYoutube: "https://www.youtube.com/@khalisfoundation",
  khalisTiktok: "https://www.tiktok.com/@khalisfoundation/",
  khalisLinkedin: "https://www.linkedin.com/company/khalis-foundation/",
  khalisTwitter: "https://x.com/khalisfound",
  khalisFacebook: "https://www.facebook.com/khalisfoundation/",
};

// ───────────────────────────────────────────────────────────────────────────
// Main Seva page — mirror of seva/seva-content.ts (buildSevaLayout)
// ───────────────────────────────────────────────────────────────────────────
const MAIN = {
  hero_title: {
    en: "Support our mission. Serve millions.",
    hi: "हमारे मिशन का समर्थन करें। लाखों की सेवा करें।",
    pa: "ਸਾਡੇ ਮਿਸ਼ਨ ਦਾ ਸਮਰਥਨ ਕਰੋ। ਲੱਖਾਂ ਦੀ ਸੇਵਾ ਕਰੋ।",
    fr: "Soutenez notre mission. Servez des millions de personnes.",
    it: "Sostieni la nostra missione. Servi milioni di persone.",
    es: "Apoya nuestra misión. Sirve a millones.",
  },
  // The org name — its own key so it can be wrapped in a link (proper noun, so
  // it keeps each language's existing script/form). Mirrors seva-content.ts.
  hero_org: {
    en: "Khalis Foundation",
    hi: "खालिस फाउंडेशन",
    pa: "ਖਾਲਿਸ ਫਾਊਂਡੇਸ਼ਨ",
    fr: "Khalis Foundation",
    it: "Khalis Foundation",
    es: "Khalis Foundation",
  },
  // {kf}, {sg} and {sttm} are replaced with links at build time: {kf} → Khalis
  // Foundation, {sg} → Sundar Gutka, {sttm} → SikhiToTheMax (all proper nouns).
  hero_desc: {
    en: "{kf} is a community of volunteers building tools like {sg} and {sttm} to help millions of Sikhs connect with Gurbani.",
    hi: "{kf} स्वयंसेवकों का एक समुदाय है जो {sg} और {sttm} जैसे उपकरण बनाता है ताकि लाखों सिख गुरबाणी से जुड़ सकें।",
    pa: "{kf} ਵਲੰਟੀਅਰਾਂ ਦਾ ਇੱਕ ਸਮੂਹ ਹੈ ਜੋ {sg} ਅਤੇ {sttm} ਵਰਗੇ ਟੂਲ ਬਣਾਉਂਦਾ ਹੈ ਤਾਂ ਜੋ ਲੱਖਾਂ ਸਿੱਖ ਗੁਰਬਾਣੀ ਨਾਲ ਜੁੜ ਸਕਣ।",
    fr: "La {kf} est une communauté de bénévoles qui crée des outils comme {sg} et {sttm} pour aider des millions de Sikhs à se connecter à la Gurbani.",
    it: "La {kf} è una comunità di volontari che crea strumenti come {sg} e {sttm} per aiutare milioni di Sikh a connettersi con la Gurbani.",
    es: "{kf} es una comunidad de voluntarios que crea herramientas como {sg} y {sttm} para ayudar a millones de sijs a conectar con la Gurbani.",
  },
  card_title: {
    en: "Seva with your support",
    hi: "आपके समर्थन से सेवा",
    pa: "ਤੁਹਾਡੇ ਸਮਰਥਨ ਨਾਲ ਸੇਵਾ",
    fr: "Seva avec votre soutien",
    it: "Seva con il tuo sostegno",
    es: "Seva con tu apoyo",
  },
  card_sub: {
    en: "Your support keeps this mission alive.",
    hi: "आपका समर्थन इस मिशन को जीवित रखता है।",
    pa: "ਤੁਹਾਡਾ ਸਮਰਥਨ ਇਸ ਮਿਸ਼ਨ ਨੂੰ ਜ਼ਿੰਦਾ ਰੱਖਦਾ ਹੈ।",
    fr: "Votre soutien fait vivre cette mission.",
    it: "Il tuo sostegno mantiene viva questa missione.",
    es: "Tu apoyo mantiene viva esta misión.",
  },
  section: {
    en: "Other ways to do Seva",
    hi: "सेवा करने के अन्य तरीके",
    pa: "ਸੇਵਾ ਕਰਨ ਦੇ ਹੋਰ ਤਰੀਕੇ",
    fr: "Autres façons de faire seva",
    it: "Altri modi per fare seva",
    es: "Otras formas de hacer seva",
  },
  social_title: {
    en: "Spread the word",
    hi: "शब्द फैलाएं",
    pa: "ਗੱਲ ਫੈਲਾਓ",
    fr: "Faites passer le mot",
    it: "Spargi la voce",
    es: "Corre la voz",
  },
  social_sub: {
    en: "Share our apps with friends and family",
    hi: "हमारे ऐप्स दोस्तों और परिवार के साथ साझा करें",
    pa: "ਸਾਡੀਆਂ ਐਪਾਂ ਦੋਸਤਾਂ ਅਤੇ ਪਰਿਵਾਰ ਨਾਲ ਸਾਂਝੀਆਂ ਕਰੋ",
    fr: "Partagez nos applications avec vos proches",
    it: "Condividi le nostre app con amici e familiari",
    es: "Comparte nuestras apps con amigos y familia",
  },
  coding_title: {
    en: "Seva for coders",
    hi: "कोडरों के लिए सेवा",
    pa: "ਕੋਡਰਾਂ ਲਈ ਸੇਵਾ",
    fr: "Seva pour les développeurs",
    it: "Seva per i programmatori",
    es: "Seva para programadores",
  },
  coding_sub: {
    en: "Contribute to our open source projects",
    hi: "हमारे ओपन सोर्स प्रोजेक्ट्स में योगदान करें",
    pa: "ਸਾਡੇ ਓਪਨ ਸੋਰਸ ਪ੍ਰੋਜੈਕਟਾਂ ਵਿੱਚ ਯੋਗਦਾਨ ਪਾਓ",
    fr: "Contribuez à nos projets open source",
    it: "Contribuisci ai nostri progetti open source",
    es: "Contribuye a nuestros proyectos de código abierto",
  },
  qa_title: {
    en: "Report an issue",
    hi: "समस्या की रिपोर्ट करें",
    pa: "ਸਮੱਸਿਆ ਦੀ ਰਿਪੋਰਟ ਕਰੋ",
    fr: "Signaler un problème",
    it: "Segnala un problema",
    es: "Informar de un problema",
  },
  qa_sub: {
    en: "Help us improve and test our products",
    hi: "हमारे उत्पादों को बेहतर बनाने और परखने में मदद करें",
    pa: "ਸਾਡੇ ਉਤਪਾਦਾਂ ਨੂੰ ਬਿਹਤਰ ਬਣਾਉਣ ਅਤੇ ਪਰਖਣ ਵਿੱਚ ਮਦਦ ਕਰੋ",
    fr: "Aidez-nous à améliorer et tester nos produits",
    it: "Aiutaci a migliorare e testare i nostri prodotti",
    es: "Ayúdanos a mejorar y probar nuestros productos",
  },
  other_title: {
    en: "Share your ideas",
    hi: "अपने विचार साझा करें",
    pa: "ਆਪਣੇ ਵਿਚਾਰ ਸਾਂਝੇ ਕਰੋ",
    fr: "Partagez vos idées",
    it: "Condividi le tue idee",
    es: "Comparte tus ideas",
  },
  other_sub: {
    en: "Share ideas for another way to do seva.",
    hi: "सेवा करने के किसी और तरीके के लिए विचार साझा करें।",
    pa: "ਸੇਵਾ ਕਰਨ ਦੇ ਕਿਸੇ ਹੋਰ ਤਰੀਕੇ ਲਈ ਵਿਚਾਰ ਸਾਂਝੇ ਕਰੋ।",
    fr: "Proposez vos idées pour une autre façon de faire seva.",
    it: "Condividi idee per un altro modo di fare seva.",
    es: "Comparte ideas para otra forma de hacer seva.",
  },
};

// `href` always starts `seva-means:<page>` so the app can map the row to its
// icon and accent tint. `openUrl` appends `?open=<encoded url>`, telling the app
// to open that URL in the in-app browser instead of navigating to the sub-page.
// Rows without it navigate as before. Encoding also stops any `&` in the URL
// from terminating the href attribute.
const mainMeansItem = (page, titleKey, subKey, lang, openUrl) => {
  const href = openUrl
    ? `seva-means:${page}?open=${encodeURIComponent(openUrl)}`
    : `seva-means:${page}`;
  return `<p class="seva-means"><a href="${href}">${pick(MAIN, titleKey, lang)}</a>${pick(
    MAIN,
    subKey,
    lang
  )}</p>`;
};

/**
 * The full localized Seva page layout — mirror of buildSevaLayout(). Includes the
 * hero, the donate card (with the native donate_widget + tax_note slots) and the
 * "Other ways to do Seva" list, so the offline page is identical in shape to the
 * server-driven one.
 */
export const buildBundledSevaLayout = (langInput) => {
  const lang = normalizeBundledLang(langInput);
  const desc = pick(MAIN, "hero_desc", lang)
    .replace("{kf}", `<a href="${LINKS.khalisWebsite}">${pick(MAIN, "hero_org", lang)}</a>`)
    .replace("{sg}", `<a href="${LINKS.khalisWebsite}">Sundar Gutka</a>`)
    .replace("{sttm}", `<a href="${LINKS.sttmWebsite}">SikhiToTheMax</a>`);

  return `<h1 class="seva-hero-title">${pick(MAIN, "hero_title", lang)}</h1>
<p class="seva-hero-desc">${desc}</p>
<!--CARD:donate-->
<!--SLOT:donate_widget-->
<!--SLOT:tax_note-->
<!--/CARD-->
<h2 class="seva-section">${pick(MAIN, "section", lang)}</h2>
${mainMeansItem("social", "social_title", "social_sub", lang)}
${mainMeansItem("coding", "coding_title", "coding_sub", lang)}
${mainMeansItem("qa", "qa_title", "qa_sub", lang, LINKS.qaFeedbackForm)}
${mainMeansItem("other", "other_title", "other_sub", lang, LINKS.ideasForm)}`;
};

// ───────────────────────────────────────────────────────────────────────────
// Sub-pages — mirror of seva-means/content/{i18n,pages,render}.ts
// ───────────────────────────────────────────────────────────────────────────
const MEANS = {
  title_social: {
    en: "Seva by Spreading the Word",
    hi: "शब्द फैलाकर सेवा",
    pa: "ਸ਼ਬਦ ਫੈਲਾ ਕੇ ਸੇਵਾ",
    fr: "Seva en partageant le message",
    it: "Seva diffondendo il messaggio",
    es: "Seva difundiendo el mensaje",
  },
  title_coding: {
    en: "Seva for Coders",
    hi: "कोडरों के लिए सेवा",
    pa: "ਕੋਡਰਾਂ ਲਈ ਸੇਵਾ",
    fr: "Seva pour les développeurs",
    it: "Seva per i programmatori",
    es: "Seva para programadores",
  },
  title_qa: {
    en: "Seva by Testing Our Work",
    hi: "हमारे काम का परीक्षण करके सेवा",
    pa: "ਸਾਡੇ ਕੰਮ ਦੀ ਜਾਂਚ ਕਰਕੇ ਸੇਵਾ",
    fr: "Seva en testant notre travail",
    it: "Seva testando il nostro lavoro",
    es: "Seva probando nuestro trabajo",
  },
  title_other: {
    en: "Seva by Other Opportunities",
    hi: "अन्य अवसरों से सेवा",
    pa: "ਹੋਰ ਮੌਕਿਆਂ ਰਾਹੀਂ ਸੇਵਾ",
    fr: "Seva par d'autres moyens",
    it: "Seva con altri mezzi",
    es: "Seva por otros medios",
  },
  social_intro: {
    en: "Create a post on social media, tag @KhalisFoundation and @SikhiToTheMax, and we'll feature your post on our page.",
    hi: "सोशल मीडिया पर एक पोस्ट बनाएं, @KhalisFoundation और @SikhiToTheMax को टैग करें, और हम आपकी पोस्ट को अपने पेज पर दिखाएंगे।",
    pa: "ਸੋਸ਼ਲ ਮੀਡੀਆ 'ਤੇ ਇੱਕ ਪੋਸਟ ਬਣਾਓ, @KhalisFoundation ਅਤੇ @SikhiToTheMax ਨੂੰ ਟੈਗ ਕਰੋ, ਅਤੇ ਅਸੀਂ ਤੁਹਾਡੀ ਪੋਸਟ ਨੂੰ ਆਪਣੇ ਪੇਜ 'ਤੇ ਦਿਖਾਵਾਂਗੇ।",
    fr: "Publiez sur les réseaux sociaux, identifiez @KhalisFoundation et @SikhiToTheMax, et nous mettrons votre publication en avant sur notre page.",
    it: "Crea un post sui social media, tagga @KhalisFoundation e @SikhiToTheMax e metteremo in evidenza il tuo post sulla nostra pagina.",
    es: "Crea una publicación en redes sociales, etiqueta a @KhalisFoundation y @SikhiToTheMax, y destacaremos tu publicación en nuestra página.",
  },
  social_follow: {
    en: "Follow our social media accounts",
    hi: "हमारे सोशल मीडिया अकाउंट फॉलो करें",
    pa: "ਸਾਡੇ ਸੋਸ਼ਲ ਮੀਡੀਆ ਖਾਤੇ ਫਾਲੋ ਕਰੋ",
    fr: "Suivez nos comptes sur les réseaux sociaux",
    it: "Segui i nostri account sui social media",
    es: "Sigue nuestras cuentas en redes sociales",
  },
  coding_intro: {
    en: "Love to code? Help build Sundar Gutka. Every contribution reaches Sikhs around the world.",
    hi: "कोडिंग पसंद है? सुंदर गुटका बनाने में मदद करें। हर योगदान दुनिया भर के सिखों तक पहुँचता है।",
    pa: "ਕੋਡਿੰਗ ਪਸੰਦ ਹੈ? ਸੁੰਦਰ ਗੁਟਕਾ ਬਣਾਉਣ ਵਿੱਚ ਮਦਦ ਕਰੋ। ਹਰ ਯੋਗਦਾਨ ਦੁਨੀਆ ਭਰ ਦੇ ਸਿੱਖਾਂ ਤੱਕ ਪਹੁੰਚਦਾ ਹੈ।",
    fr: "Vous aimez coder ? Aidez à développer Sundar Gutka. Chaque contribution touche des Sikhs du monde entier.",
    it: "Ti piace programmare? Aiutaci a costruire Sundar Gutka. Ogni contributo raggiunge i Sikh di tutto il mondo.",
    es: "¿Te gusta programar? Ayuda a construir Sundar Gutka. Cada contribución llega a sijs de todo el mundo.",
  },
  coding_repo: {
    en: "GitHub Repository",
    hi: "GitHub रिपॉज़िटरी",
    pa: "GitHub ਰਿਪੋਜ਼ਟਰੀ",
    fr: "Dépôt GitHub",
    it: "Repository GitHub",
    es: "Repositorio de GitHub",
  },
  coding_repo_sub: {
    en: "Browse the source code and set up the project.",
    hi: "सोर्स कोड देखें और प्रोजेक्ट सेट करें।",
    pa: "ਸੋਰਸ ਕੋਡ ਵੇਖੋ ਅਤੇ ਪ੍ਰੋਜੈਕਟ ਸੈੱਟ ਕਰੋ।",
    fr: "Parcourez le code source et configurez le projet.",
    it: "Esplora il codice sorgente e configura il progetto.",
    es: "Explora el código fuente y configura el proyecto.",
  },
  coding_issues: {
    en: "Open Issues",
    hi: "खुले मुद्दे",
    pa: "ਖੁੱਲ੍ਹੇ ਮੁੱਦੇ",
    fr: "Tickets ouverts",
    it: "Problemi aperti",
    es: "Incidencias abiertas",
  },
  coding_issues_sub: {
    en: "See what needs building or fixing.",
    hi: "देखें कि क्या बनाना या ठीक करना है।",
    pa: "ਵੇਖੋ ਕਿ ਕੀ ਬਣਾਉਣਾ ਜਾਂ ਠੀਕ ਕਰਨਾ ਹੈ।",
    fr: "Découvrez ce qu'il reste à construire ou corriger.",
    it: "Scopri cosa c'è da costruire o correggere.",
    es: "Descubre qué falta por construir o corregir.",
  },
  coding_good_first: {
    en: "Good First Issues",
    hi: "अच्छे शुरुआती मुद्दे",
    pa: "ਵਧੀਆ ਪਹਿਲੇ ਮੁੱਦੇ",
    fr: "Bons premiers tickets",
    it: "Buoni primi problemi",
    es: "Buenas primeras incidencias",
  },
  coding_good_first_sub: {
    en: "Curated tasks that are great to start with.",
    hi: "शुरुआत के लिए बेहतरीन चुने हुए काम।",
    pa: "ਸ਼ੁਰੂਆਤ ਲਈ ਵਧੀਆ ਚੁਣੇ ਹੋਏ ਕੰਮ।",
    fr: "Des tâches sélectionnées, idéales pour débuter.",
    it: "Attività selezionate, ideali per iniziare.",
    es: "Tareas seleccionadas, ideales para empezar.",
  },
  coding_slack: {
    en: "Join our Slack",
    hi: "हमारे Slack से जुड़ें",
    pa: "ਸਾਡੇ Slack ਨਾਲ ਜੁੜੋ",
    fr: "Rejoignez notre Slack",
    it: "Unisciti al nostro Slack",
    es: "Únete a nuestro Slack",
  },
  coding_slack_sub: {
    en: "Request access — fill in the sign-up form and we'll send you an invite.",
    hi: "एक्सेस का अनुरोध करें — साइन-अप फ़ॉर्म भरें और हम आपको आमंत्रण भेजेंगे।",
    pa: "ਪਹੁੰਚ ਲਈ ਬੇਨਤੀ ਕਰੋ — ਸਾਈਨ-ਅੱਪ ਫਾਰਮ ਭਰੋ ਅਤੇ ਅਸੀਂ ਤੁਹਾਨੂੰ ਸੱਦਾ ਭੇਜਾਂਗੇ।",
    fr: "Demandez l'accès — remplissez le formulaire d'inscription et nous vous enverrons une invitation.",
    it: "Richiedi l'accesso — compila il modulo di iscrizione e ti invieremo un invito.",
    es: "Solicita acceso — rellena el formulario de registro y te enviaremos una invitación.",
  },
  qa_intro: {
    en: "Help us ship a flawless app. Test new features and report anything that looks off.",
    hi: "एक बेहतरीन ऐप बनाने में हमारी मदद करें। नई सुविधाओं का परीक्षण करें और जो भी गड़बड़ लगे उसकी रिपोर्ट करें।",
    pa: "ਇੱਕ ਬੇਹਤਰੀਨ ਐਪ ਬਣਾਉਣ ਵਿੱਚ ਸਾਡੀ ਮਦਦ ਕਰੋ। ਨਵੀਆਂ ਸਹੂਲਤਾਂ ਦੀ ਜਾਂਚ ਕਰੋ ਅਤੇ ਜੋ ਵੀ ਗਲਤ ਲੱਗੇ ਉਸ ਦੀ ਰਿਪੋਰਟ ਕਰੋ।",
    fr: "Aidez-nous à livrer une application impeccable. Testez les nouveautés et signalez tout ce qui semble anormal.",
    it: "Aiutaci a rilasciare un'app impeccabile. Prova le nuove funzionalità e segnala qualsiasi anomalia.",
    es: "Ayúdanos a lanzar una app impecable. Prueba las nuevas funciones e informa de cualquier fallo.",
  },
  qa_repo: {
    en: "GitHub Repository",
    hi: "GitHub रिपॉज़िटरी",
    pa: "GitHub ਰਿਪੋਜ਼ਟਰੀ",
    fr: "Dépôt GitHub",
    it: "Repository GitHub",
    es: "Repositorio de GitHub",
  },
  qa_repo_sub: {
    en: "Explore the project and file issues.",
    hi: "प्रोजेक्ट देखें और मुद्दे दर्ज करें।",
    pa: "ਪ੍ਰੋਜੈਕਟ ਵੇਖੋ ਅਤੇ ਮੁੱਦੇ ਦਰਜ ਕਰੋ।",
    fr: "Explorez le projet et signalez des problèmes.",
    it: "Esplora il progetto e segnala problemi.",
    es: "Explora el proyecto y reporta incidencias.",
  },
  qa_test: {
    en: "Become a Tester",
    hi: "टेस्टर बनें",
    pa: "ਟੈਸਟਰ ਬਣੋ",
    fr: "Devenez testeur",
    it: "Diventa un tester",
    es: "Conviértete en tester",
  },
  qa_test_sub: {
    en: "Sign up to test any of our apps before release.",
    hi: "रिलीज़ से पहले हमारे किसी भी ऐप की जाँच के लिए साइन अप करें।",
    pa: "ਰਿਲੀਜ਼ ਤੋਂ ਪਹਿਲਾਂ ਸਾਡੇ ਕਿਸੇ ਵੀ ਐਪ ਦੀ ਜਾਂਚ ਲਈ ਸਾਈਨ ਅੱਪ ਕਰੋ।",
    fr: "Inscrivez-vous pour tester nos applications avant leur sortie.",
    it: "Iscriviti per provare le nostre app prima del rilascio.",
    es: "Regístrate para probar nuestras apps antes de su lanzamiento.",
  },
  qa_form: {
    en: "Report a Sundar Gutka Issue",
    hi: "सुंदर गुटका की समस्या बताएं",
    pa: "ਸੁੰਦਰ ਗੁਟਕਾ ਦੀ ਸਮੱਸਿਆ ਦੱਸੋ",
    fr: "Signaler un problème Sundar Gutka",
    it: "Segnala un problema di Sundar Gutka",
    es: "Reportar un problema de Sundar Gutka",
  },
  qa_form_sub: {
    en: "Tell us about a bug or send feedback on this app.",
    hi: "इस ऐप में किसी बग या सुझाव के बारे में हमें बताएं।",
    pa: "ਇਸ ਐਪ ਵਿੱਚ ਕਿਸੇ ਬੱਗ ਜਾਂ ਸੁਝਾਅ ਬਾਰੇ ਸਾਨੂੰ ਦੱਸੋ।",
    fr: "Signalez un bug ou envoyez vos retours sur cette application.",
    it: "Segnala un bug o inviaci un riscontro su questa app.",
    es: "Cuéntanos un error o envía comentarios sobre esta app.",
  },
  other_intro: {
    en: "Have an idea for another way to do seva? We'd love to hear from you.",
    hi: "सेवा करने के किसी और तरीके का विचार है? हमें आपसे सुनना अच्छा लगेगा।",
    pa: "ਸੇਵਾ ਕਰਨ ਦੇ ਕਿਸੇ ਹੋਰ ਤਰੀਕੇ ਦਾ ਵਿਚਾਰ ਹੈ? ਸਾਨੂੰ ਤੁਹਾਡੇ ਤੋਂ ਸੁਣ ਕੇ ਖੁਸ਼ੀ ਹੋਵੇਗੀ।",
    fr: "Vous avez une idée pour une autre façon de faire seva ? Nous serions ravis de vous entendre.",
    it: "Hai un'idea per un altro modo di fare seva? Ci farebbe piacere sentirti.",
    es: "¿Tienes una idea para otra forma de hacer seva? Nos encantaría saber de ti.",
  },
  other_ideas: {
    en: "Share your ideas",
    hi: "अपने विचार साझा करें",
    pa: "ਆਪਣੇ ਵਿਚਾਰ ਸਾਂਝੇ ਕਰੋ",
    fr: "Partagez vos idées",
    it: "Condividi le tue idee",
    es: "Comparte tus ideas",
  },
  other_ideas_sub: {
    en: "Send us your suggestions through our form.",
    hi: "हमारे फ़ॉर्म से अपने सुझाव भेजें।",
    pa: "ਸਾਡੇ ਫਾਰਮ ਰਾਹੀਂ ਆਪਣੇ ਸੁਝਾਅ ਭੇਜੋ।",
    fr: "Envoyez-nous vos suggestions via notre formulaire.",
    it: "Inviaci i tuoi suggerimenti tramite il nostro modulo.",
    es: "Envíanos tus sugerencias a través de nuestro formulario.",
  },
  footer: {
    en: "Built by volunteers at Khalis Foundation.",
    hi: "खालिस फाउंडेशन के स्वयंसेवकों द्वारा बनाया गया।",
    pa: "ਖਾਲਿਸ ਫਾਊਂਡੇਸ਼ਨ ਦੇ ਵਲੰਟੀਅਰਾਂ ਦੁਆਰਾ ਬਣਾਇਆ ਗਿਆ।",
    fr: "Créé par les bénévoles de la Khalis Foundation.",
    it: "Creato dai volontari della Khalis Foundation.",
    es: "Creado por los voluntarios de la Khalis Foundation.",
  },
};

// Brand/handle labels — identical across languages (proper nouns).
const LITERALS = {
  lit_khalis_substack: "Khalis Foundation · Substack",
  lit_khalis_instagram: "Khalis Foundation · Instagram",
  lit_khalis_slack: "Khalis Foundation · Slack",
  lit_khalis_youtube: "Khalis Foundation · YouTube",
  lit_khalis_tiktok: "Khalis Foundation · TikTok",
  lit_khalis_linkedin: "Khalis Foundation · LinkedIn",
  lit_khalis_twitter: "Khalis Foundation · X",
  lit_khalis_facebook: "Khalis Foundation · Facebook",
};

const meansText = (key, lang) =>
  key in LITERALS ? LITERALS[key] : pick(MEANS, key, lang);

// Structured page models — mirror of seva-means/content/pages.ts.
const PAGES = {
  "seva-by-social-media": {
    titleKey: "title_social",
    introKey: "social_intro",
    sections: [
      {
        headingKey: "social_follow",
        // Rows whose URL is still empty in LINKS are dropped by the renderer.
        links: [
          { titleKey: "lit_khalis_substack", url: LINKS.khalisSubstack },
          { titleKey: "lit_khalis_instagram", url: LINKS.khalisInstagram },
          { titleKey: "lit_khalis_slack", url: LINKS.slack },
          { titleKey: "lit_khalis_youtube", url: LINKS.khalisYoutube },
          { titleKey: "lit_khalis_tiktok", url: LINKS.khalisTiktok },
          { titleKey: "lit_khalis_linkedin", url: LINKS.khalisLinkedin },
          { titleKey: "lit_khalis_twitter", url: LINKS.khalisTwitter },
          { titleKey: "lit_khalis_facebook", url: LINKS.khalisFacebook },
        ],
      },
    ],
  },
  "seva-by-coding": {
    titleKey: "title_coding",
    introKey: "coding_intro",
    sections: [
      {
        links: [
          { titleKey: "coding_repo", subKey: "coding_repo_sub", url: LINKS.githubRepo },
          { titleKey: "coding_issues", subKey: "coding_issues_sub", url: LINKS.githubIssues },
          {
            titleKey: "coding_good_first",
            subKey: "coding_good_first_sub",
            url: LINKS.notionGoodFirstIssues,
          },
          { titleKey: "coding_slack", subKey: "coding_slack_sub", url: LINKS.slack },
        ],
      },
    ],
  },
  "seva-by-qa": {
    titleKey: "title_qa",
    introKey: "qa_intro",
    sections: [
      {
        links: [
          { titleKey: "qa_repo", subKey: "qa_repo_sub", url: LINKS.githubRepo },
          { titleKey: "qa_test", subKey: "qa_test_sub", url: LINKS.qaTestBuild },
          { titleKey: "qa_form", subKey: "qa_form_sub", url: LINKS.qaFeedbackForm },
        ],
      },
    ],
  },
  "seva-by-other": {
    titleKey: "title_other",
    introKey: "other_intro",
    sections: [
      { links: [{ titleKey: "other_ideas", subKey: "other_ideas_sub", url: LINKS.ideasForm }] },
    ],
  },
};

const renderLink = (link, lang) => {
  const label = esc(meansText(link.titleKey, lang));
  const sub = link.subKey ? ` — ${esc(meansText(link.subKey, lang))}` : "";
  return `<p class="seva-link"><a href="${urlAttr(link.url)}">${label}</a>${sub}</p>`;
};

const renderSection = (section, lang) => {
  const parts = [];
  if (section.hero) {
    if (section.headingKey) {
      parts.push(`<h2 class="seva-hero-title">${esc(meansText(section.headingKey, lang))}</h2>`);
    }
    if (section.bodyKey) {
      parts.push(`<p class="seva-hero-sub">${esc(meansText(section.bodyKey, lang))}</p>`);
    }
    return parts.join("\n");
  }
  if (section.headingKey) parts.push(`<h2>${esc(meansText(section.headingKey, lang))}</h2>`);
  if (section.bodyKey) parts.push(`<p>${esc(meansText(section.bodyKey, lang))}</p>`);
  // An empty URL means the account isn't published yet — drop the row rather
  // than emit a link that goes nowhere.
  (section.links || [])
    .filter((link) => link.url && link.url.trim())
    .forEach((link) => parts.push(renderLink(link, lang)));
  return parts.join("\n");
};

/**
 * Returns the localized bundled { title, content } for a Seva-means page — a
 * faithful mirror of the backend's renderContent(). `page` is the backend path
 * key (e.g. "seva-by-social-media"). Unknown page → null.
 */
export const buildBundledMeansPage = (page, langInput) => {
  const model = PAGES[page];
  if (!model) return null;
  const lang = normalizeBundledLang(langInput);
  const parts = [];
  if (model.introKey) {
    parts.push(`<p class="seva-intro">${esc(meansText(model.introKey, lang))}</p>`);
  }
  model.sections.forEach((section) => parts.push(renderSection(section, lang)));
  parts.push(`<p class="seva-footer">${esc(meansText("footer", lang))}</p>`);
  return { title: meansText(model.titleKey, lang), content: parts.join("\n") };
};
