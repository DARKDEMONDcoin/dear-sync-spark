/**
 * بوابة نية البحث — مصدر واحد يقرر: هل هذه الرسالة تستحق بحثاً حياً؟
 *
 * قبل هذا الملف كان البحث ينطلق بكلمات زمنية فقط («آخر، اليوم، سعر، خبر»)،
 * فجملة مثل «ابحث لي عن أفضل منافس في السوق» كانت تُجاب من معرفة النموذج المخزّنة
 * عند خمسة موظفين من ستة. هنا نلتقط نية البحث الصريحة مهما كان الموظف.
 */

/** أفعال طلب البحث الصريحة — عربية ولهجات ودارجة وإنجليزية. */
const EXPLICIT =
  /(ابحث|أبحث|ابحثل|إبحث|دوّر|دور\s?لي|شوف\s?لي|شوفلي|هات\s?لي|جيب\s?لي|اتفرج\s?على|راجع\s?السوق|اطلع\s?على|search|look\s?up|find\s?me|google\s?it|research)/i;

/** طلب مقارنة أو معايير أو حالة سوق — بحث فعلي حتى بلا كلمة «ابحث». */
const MARKET =
  /(قارن|مقارنة|قارنّ|مقابل|vs\b|versus|معايير\s*السوق|متوسط\s*السوق|المعدل\s*الطبيعي|benchmark|benchmarks|أسعار\s*السوق|متوسط\s*الأسعار|إيه\s*المتاح|ايه\s*المتاح|ما\s*المتاح|الخيارات\s*المتاحة|أفضل\s*الممارسات|افضل\s*الممارسات|best\s*practices|دراسة|دراسات|إحصائيات|احصائيات|statistics|أرقام\s*السوق|حصة\s*السوق|market\s*share)/i;

/** منافسون وترند — طلب واقع خارجي لا معرفة مخزّنة. */
const EXTERNAL =
  /(منافس|المنافسين|منافسينا|competitor|competitors|ترند|التريند|trend|trending|رائج|الرائج|جديد\s*في\s*السوق|الأحدث|احدث|أحدث|آخر\s*ما|جِدة|الجديد\s*في)/i;

/** كلمات زمنية: «آخر/اليوم/الآن» — إشارة قوية أن المخزون المعرفي لا يكفي. */
const RECENCY =
  /(آخر|اخر|أحدث|احدث|اليوم|النهاردة|الآن|دلوقتي|هذا\s*الأسبوع|هذا\s*الشهر|٢٠٢[5-9]|202[5-9]|الحالي|الحالية|latest|today|current|right\s*now)/i;

export type ResearchIntent = {
  /** هل نشغّل بحثاً حياً لهذه الرسالة؟ */
  wanted: boolean;
  /** المستخدم طلب البحث بنفسه بكلمة صريحة — نبحث حتى لو الرسالة قصيرة. */
  explicit: boolean;
  /** سبب التشغيل، للتشخيص ولاختيار المصادر. */
  reason: "explicit" | "market" | "external" | "recency" | "none";
  /** الموضوع المنقّى الذي نبحث عنه فعلاً. */
  topic: string;
};

/** ينظّف الرسالة إلى استعلام بحث قصير: بلا نداء الموظف ولا أفعال الطلب. */
export function researchTopic(message: string): string {
  return message
    .replace(/^\s*(يا\s+)?(سِراج|سراج|نور|آدم|ادم|دانة|دانه|سام|سالم|إيفا|ايفا|أمل|امل)[،,:\s]*/i, "")
    .replace(
      /\b(من\s*فضلك|لو\s*سمحت|please|ابحث\s*لي|ابحثلي|ابحث|أبحث|دوّر\s*لي|دور\s*لي|شوف\s*لي|شوفلي|هات\s*لي|جيب\s*لي|عايز|عاوز|أريد|اريد|محتاج|ممكن|search\s*for|look\s*up|find\s*me)\b/gi,
      " ",
    )
    .replace(/^\s*(عن|على|في|حول|about|for)\s+/i, "")
    .replace(/[?؟!.]+\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
}

/**
 * القرار. نتجنّب البحث في الدردشة القصيرة والأسئلة عن المنصة نفسها،
 * ونبحث متى طلب المستخدم صراحةً أو متى كان الجواب الصحيح يعتمد على واقع خارجي.
 */
export function researchIntent(message: string): ResearchIntent {
  const text = (message ?? "").trim();
  const topic = researchTopic(text);
  const none: ResearchIntent = { wanted: false, explicit: false, reason: "none", topic };

  if (text.length < 8) return none;
  // أسئلة عن المنصة نفسها أو عن الموظف: لا شأن لها بالسوق الخارجي.
  if (/^(مين\s*انت|من\s*أنت|انت\s*مين|ايه\s*اللي\s*تعرف|بتعمل\s*إيه|شو\s*بتعمل)/i.test(text)) {
    return none;
  }

  if (EXPLICIT.test(text)) return { wanted: true, explicit: true, reason: "explicit", topic };
  if (MARKET.test(text)) return { wanted: true, explicit: false, reason: "market", topic };
  if (EXTERNAL.test(text)) return { wanted: true, explicit: false, reason: "external", topic };
  // الكلمات الزمنية وحدها تكفي فقط في رسالة ذات محتوى، لا في «عامل إيه النهاردة؟».
  if (RECENCY.test(text) && text.length > 24) {
    return { wanted: true, explicit: false, reason: "recency", topic };
  }
  return none;
}
