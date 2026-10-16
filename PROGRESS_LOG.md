# سجل التقدم والتعديلات (Progress & Change Log)

> **📌 ملاحظة للوكيل:** يتم تحديث هذا السجل في جذر المشروع وفي الكاش (Artifact Directory) بعد كل تعديل لمتابعة حالة المشروع أولاً بأول.

---

## [2026-10-16] - حزم التحديث للاستضافة (A2 Hosting) والرفع على GitHub
- **الفرع (Branch):** `development`
- **ما تم إنجازه:**
  1. **توثيق القرار المعماري [ADR-003]:** اعتماد معايير البناء والحزم الخاصة باستضافة Linux / A2 Hosting في [DECISIONS.md](file:///c:/laragon/www/mawthiq-contributers/DECISIONS.md) (البناء المسبق `npm run build`، استبعاد `vendor/` طالما لم تتغير حزم Composer، وضبط صلاحيات Unix القياسية `0755` للمجلدات و `0644` للملفات).
  2. **توافق حالة الأحرف لبيئة Linux:** تصحيح مسارات الاستيراد في [resources/js/app.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/app.jsx) من `./pages/` إلى `./Pages/` لضمان التوافق التام مع أنظمة ملفات Linux الحساسة لحالة الأحرف (Case-Sensitive) على A2 Hosting.
  3. **بناء أصول الإنتاج (Production Build):** تشغيل `npm run build` وتوليد أحدث حزمة في `public/build/`.
  4. **إنشاء حزمة النشر السريع (`mawthiq_update_deploy_a2hosting.zip`):**
     - الحجم: `~376 KB` فقط (شاملة `public/build/` وكافة ملفات المشروع مع استبعاد `vendor/` و `node_modules/` و `.git/` لعدم وجود تعديل على حزم Composer).
     - الصلاحيات المدمجة داخل الأرشيف: `0755` (`drwxr-xr-x`) لكافة المجلدات (46 مجلداً) شاملة `storage` و `bootstrap/cache`، و `0644` (`-rw-r--r--`) للملفات (و `0755` لملف `artisan`).
  5. **الرفع إلى المستودع البعيد (GitHub Push):** عمل Commit ورفع الفرع `development` إلى `origin/development`.

---

## [2026-10-16] - التأسيس المعماري وتوحيد أشرطة العناوين والأزرار الأيقونية
- **الفرع (Branch):** `development`
- **ما تم إنجازه:**
  1. **إنشاء فرع التطوير:** تم إنشاء الفرع `development` والانتقال إليه (`git checkout -b development`).
  2. **توثيق القرارات المعمارية (`DECISIONS.md`):**
     - إنشاء ملف [DECISIONS.md](file:///c:/laragon/www/mawthiq-contributers/DECISIONS.md) وحفظ نسخة مطابقة في الكاش، مع ربطه بقواعد إلزامية في [AGENTS.md](file:///c:/laragon/www/mawthiq-contributers/AGENTS.md) و [CLAUDE.md](file:///c:/laragon/www/mawthiq-contributers/CLAUDE.md).
     - توثيق القرار **[ADR-001]**: الاعتماد على الأزرار الأيقونية المزودة بتلميحات فورية عند مرور المؤشر (`Hover Tooltips`).
     - توثيق القرار **[ADR-002]**: توحيد صندوق شريط عنوان الصفحة (`PageHeader`) لجميع الواجهات (القسم الأيمن: الأيقونة + عنوان العرض + سطر التفاصيل؛ القسم الأيسر: أزرار الإجراءات السريعة الأيقونية).
  3. **بناء المكونات القياسية المشتركة:**
     - إنشاء مكون [`IconButton`](file:///c:/laragon/www/mawthiq-contributers/resources/js/components/IconButton.jsx) لدعم الأزرار الأيقونية المربعة بأنماطها (`primary`, `secondary`, `active`, `success`, `warning`, `danger`, `ghost`) مع تلميح عائم فوري عند التمرير (`Tooltip`).
     - إنشاء مكون [`PageHeader`](file:///c:/laragon/www/mawthiq-contributers/resources/js/components/PageHeader.jsx) المحاكي للتصميم المرجعي المعتمد.
  4. **تعميم شريط العنوان والأزرار الأيقونية على كافة واجهات النظام:**
     - [DashboardPage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/DashboardPage.jsx)
     - [ApplicantsPage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/ApplicantsPage.jsx)
     - [ApplicantDetailPage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/ApplicantDetailPage.jsx)
     - [InterviewsPage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/InterviewsPage.jsx)
     - [ReportsPage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/ReportsPage.jsx)
     - [EmailsPage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/EmailsPage.jsx)
     - [UsersAndPermissionsPage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/UsersAndPermissionsPage.jsx)
     - [SettingsPage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/SettingsPage.jsx)
     - [ProfilePage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/ProfilePage.jsx)
