# سجل التقدم والتعديلات (Progress & Change Log)

> **📌 ملاحظة للوكيل:** يتم تحديث هذا السجل في جذر المشروع وفي الكاش (Artifact Directory) بعد كل تعديل لمتابعة حالة المشروع أولاً بأول.

---

## [2026-10-16] - التشغيل المحلي، حل تعارض التلميحات، إصلاح تلف الـ CV وإدارة إصداراته، وتفعيل تعدد اللغات
- **الفرع (Branch):** `development`
- **ما تم إنجازه:**
  1. **تشغيل التطبيق على الاستضافة المحلية وترحيل وبذر قاعدة البيانات:**
     - تثبيت حزم Composer (`composer install`)، إعداد ملف `.env`، تشغيل محرك MySQL 8.4 المحلي وإنشاء قاعدة البيانات `mawthiq_contributers`.
     - تنفيذ الترحيل الكامل وبذر البيانات الأولية (`php artisan migrate:fresh --seed`) شاملة توليد ملفات سيرة ذاتية PDF حقيقية وصالحة في `storage/app/public/resumes/` للمتقدمين التجريبيين، وربط التخزين (`php artisan storage:link`).
     - تشغيل خادم التطبيق المحلي على `http://127.0.0.1:8000`.
  2. **إزالة تعارض التلميح المخصص مع خاصية `title` الافتراضية في HTML:**
     - تحديث القرار المعماري **[ADR-001]** في [DECISIONS.md](file:///c:/laragon/www/mawthiq-contributers/DECISIONS.md) لمنع استخدام `title` الافتراضية عند وجود تلميح مخصص والاكتفاء بـ `aria-label`.
     - إزالة `title={tooltip}` من وسمي `<button>` و `<a>` في مكون [IconButton.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/components/IconButton.jsx) وزر اللغة في [AppLayout.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/layouts/AppLayout.jsx) للإبقاء على التلميح المصمم فقط.
  3. **إصلاح جذري لمشكلة تلف وعطب ملفات السيرة الذاتية (CV) عند الفتح أو التنزيل:**
     - **السبب الجذري:** عند غياب الرابط الرمزي `public/storage` أو عدم قراءته، كان طلب `/storage/resumes/cv_...pdf` يقع في مسار الـ Catch-All الخاص بـ SPA (`Route::get('/{any?}', fn() => view('app'))`) فيُرجع كود HTML بحجم `~10 KB` ويُحفظ بامتداد `.pdf` فيفشل قارئ الـ PDF في فتحه.
     - **الحل:** إضافة مسار صريح `/storage/{path}` في [routes/web.php](file:///c:/laragon/www/mawthiq-contributers/routes/web.php) يسبق مسار SPA، يقوم بتنظيف الـ Output Buffer (`ob_end_clean()`) وتقديم الملف الثنائي مباشرة من `Storage::disk('public')` مع ترويسات `Content-Type` و `Content-Disposition` الصحيحة (سواء للمعاينة المباشرة في المتصفح أو للتنزيل عند تمرير `?download=1`).
  4. **نظام متكامل للتحكم في مرفقات المتقدم وإصدارات الـ CV:**
     - إنشاء ترحيل [2026_10_16_120000_add_attachments_to_applicants_table.php](file:///c:/laragon/www/mawthiq-contributers/database/migrations/2026_10_16_120000_add_attachments_to_applicants_table.php) لإضافة حقل `attachments` (JSON) في جدول `applicants`.
     - تحديث [ApplicantController.php](file:///c:/laragon/www/mawthiq-contributers/app/Http/Controllers/Api/ApplicantController.php) و [routes/api.php](file:///c:/laragon/www/mawthiq-contributers/routes/api.php) لدعم:
       - **رفع إصدار جديد (`mode = new_version`):** يضيف إصداراً مرقماً (`v1, v2, ...`) مع الاحتفاظ بالسجل السابق وتعيين الأحدث كإصدار معتمد.
       - **استبدال ملف (`mode = replace`):** يستبدل الملف الحالي أو أي إصدار محدد ويحذف الملف القديم من القرص.
       - **تعيين كإصدار معتمد (`PATCH /api/applicants/{id}/resume/{attachmentId}/activate`):** لاعتماد أي إصدار من السجل كملف نشط للمتقدم.
       - **حذف أي سجل مرفق (`DELETE /api/applicants/{id}/resume/{attachmentId?}`):** يحذف السجل وملفه الفعلي من القرص ويرقّي أحدث إصدار متبقٍ تلقائياً.
     - تحديث تبويب السيرة الذاتية في [ApplicantDetailPage.jsx](file:///c:/laragon/www/mawthiq-contributers/resources/js/Pages/ApplicantDetailPage.jsx) لعرض بطاقة الإصدار المعتمد، نموذج الرفع/الاستبدال، وجدول سجل الإصدارات الكامل مع أزرار أيقونية (معاينة، تنزيل، تعيين كمعتمد، استبدال، حذف).
  5. **توثيق وتفعيل مفاتيح الترجمة لتعدد اللغات (العربية والإنجليزية):**
     - توثيق القرار المعماري **[ADR-004]** في [DECISIONS.md](file:///c:/laragon/www/mawthiq-contributers/DECISIONS.md).
     - توسيع قاموس الترجمة [translations.js](file:///c:/laragon/www/mawthiq-contributers/resources/js/translations/translations.js) وتفعيل مفاتيح الترجمة `t('...')` في جميع الصفحات والمكونات.
  6. **بناء الإنتاج، رفع التعديلات إلى GitHub (`git push`)، وتحديث حزمة النشر (`mawthiq_update_deploy_a2hosting.zip`):**
     - تنفيذ `npm run build` لتوليد أحدث ملفات `public/build/`.
     - عمل Commit ورفع التعديلات إلى الفرع `origin/development` على GitHub.
     - إعادة حزم الملفات في [mawthiq_update_deploy_a2hosting.zip](file:///c:/laragon/www/mawthiq-contributers/mawthiq_update_deploy_a2hosting.zip) مع صلاحيات Unix القياسية لاستضافة A2 Hosting (`0755` للمجلدات و `0644` للملفات و `0755` لـ `artisan`)، واستبعاد `vendor/` و `node_modules/` وملفات الـ PDF التجريبية المحلية.

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
