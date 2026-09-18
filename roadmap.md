# خارطة العمل: نظام البحث الموحّد (الأفضل عالمياً)

## المهام
- [x] 1. بوابة نية البحث — `src/lib/research-intent.ts` (صريح/سوق/واقع خارجي/زمني) مربوطة في `ai.functions.ts`
- [x] 2. مصادر بحث مخصصة لكل موظف — `src/lib/employee-research.server.ts` (adam, sam, dana, eva, sonny, nour)
- [x] 3. بحث سِراج السوشيال يعمل داخل المحادثة لا في المهارات فقط
- [x] 4. قاعدة «معرفة عامة لا بحث لحظي» — `noResearchHonestyBlock`
- [x] 5. طبقة أمان البحث — `src/lib/research-safety.server.ts`، وكل جلب في `seo-research.server.ts` يمر عبرها

## التكاملات (تنفيذ حقيقي لكل موظف)
- [x] قرار النشر: **نور تنشر المقالات بنفسها** على ووردبريس/المدونة — مثبّت في `scope-boundaries.ts` وبطاقة `PublishToWordPress`
- [x] الموظف يجهّز إجراءً حقيقياً على تكامله المربوط ويعرضه للاعتماد بضغطة — `actionsBlock` في `ai.functions.ts` + `ActionCard.tsx`
- [x] القبول مقيّد: الإجراء لا يُعرض إلا إن كان ضمن إجراءات هذا الموظف ومنصته مربوطة فعلاً
- [x] ضبط حساسية التحويل بين الموظفين (`handoff.ts`) + كلمات الأرقام والإعلانات لآدم

## طبقة البحث العالمية (منجزة)
- [x] 6. احترام robots.txt لكل جلب — `src/lib/robots.server.ts`
- [x] 7. اتحاد المصادر المفتوحة المجانية — `src/lib/open-data.server.ts` (OpenAlex, Crossref, arXiv, Wikidata, DuckDuckGo, Hacker News, GitHub, Stack Exchange, World Bank, Google Trends/News, OpenStreetMap, Wayback, أسعار الصرف)
- [x] 8. ترجيح الأدلة — `src/lib/research-rank.ts` (سلطة × تغطية الموضوع + حداثة + تأكيد من مصدرين + حذف المكرر)
- [x] 9. جسر اللغة عربي→إنجليزي — `src/lib/query-translate.ts` (وامتناع عن سؤال مصدر إنجليزي بلا مقابل)
- [x] 10. فصل «الأدلة» عن «الخلفية العامة» ومنع النتائج خارج الموضوع
