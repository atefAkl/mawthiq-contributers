<!DOCTYPE html>
<html lang="ar" dir="rtl">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>موثِق - أجندة لقاء التعارف ({{ $applicantName }})</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;800;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

        <style>
            :root {
                --primary: #0f172a;
                /* Slate 900 */
                --secondary: #d97706;
                /* Amber 600 */
                --accent: #f8fafc;
                /* Slate 50 */
            }

            body {
                font-family: 'Cairo', sans-serif;
                background-color: #e2e8f0;
                color: #1e293b;
                margin: 0;
                padding: 20px 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            /* Page styling for screen preview to look like A4 paper */
            .page {
                width: 210mm;
                height: 297mm;
                padding: 12mm 15mm;
                margin: 0 auto 20mm auto;
                background: white;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
                position: relative;
                box-sizing: border-box;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }

            /* Essential Print Styles */
            @media print {
                @page {
                    size: A4;
                    margin: 0;
                }

                body {
                    background-color: white;
                    margin: 0;
                    padding: 0;
                }

                .page {
                    margin: 0;
                    border: none;
                    width: 210mm;
                    height: 297mm;
                    box-shadow: none;
                    page-break-after: always;
                    page-break-inside: avoid;
                }

                .page:last-child {
                    page-break-after: auto;
                }

                .no-print {
                    display: none !important;
                }
            }

            /* Background Shapes */
            .shape-top-right {
                position: absolute;
                top: -50px;
                right: -50px;
                width: 250px;
                height: 250px;
                background: var(--primary);
                border-radius: 50%;
                opacity: 0.03;
                z-index: 0;
            }

            .shape-bottom-left {
                position: absolute;
                bottom: -100px;
                left: -100px;
                width: 350px;
                height: 350px;
                background: var(--secondary);
                border-radius: 50%;
                opacity: 0.05;
                z-index: 0;
            }

            .content-wrapper {
                position: relative;
                z-index: 10;
                flex-grow: 1;
                display: flex;
                flex-direction: column;
            }

            /* Table Styles */
            .agenda-table th {
                background-color: var(--primary);
                color: white;
                font-weight: 700;
            }

            .agenda-table tr:nth-child(even) {
                background-color: #f8fafc;
            }

            .agenda-table tr:hover {
                background-color: #f1f5f9;
            }

            /* Custom input styles for the form */
            .form-input {
                width: 100%;
                padding: 0.4rem 0.5rem;
                border: 1px solid #cbd5e1;
                border-radius: 0.5rem;
                font-family: 'Cairo', sans-serif;
                font-size: 0.875rem;
                transition: border-color 0.2s;
            }

            .form-input:focus {
                outline: none;
                border-color: var(--secondary);
                box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
            }
        </style>
    </head>

    <body>

        <!-- لوحة التحكم والإدخال (لا تظهر في الطباعة) -->
        <div class="no-print max-w-[210mm] mx-auto mb-8 bg-white p-5 rounded-xl shadow-lg border border-slate-200">
            <div class="flex items-center justify-between mb-4 border-b pb-2">
                <h3 class="text-lg font-bold text-slate-800"><i class="fas fa-edit text-amber-500 ml-2"></i> إعداد بيانات اللقاء</h3>
                <div class="flex items-center gap-2">
                    <button onclick="window.close()" class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-sm transition">
                        إغلاق
                    </button>
                    <button onclick="window.print()" class="bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-4 rounded-lg shadow transition duration-300 flex items-center gap-2 text-sm">
                        <i class="fas fa-print"></i> طباعة / PDF
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">اسم المحاور</label>
                    <input type="text" id="interviewerInput" oninput="updateFields()" class="form-input" value="{{ $interviewerName }}" placeholder="أدخل اسم المحاور...">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">اسم المتقدم</label>
                    <input type="text" id="applicantInput" oninput="updateFields()" class="form-input" value="{{ $applicantName }}" placeholder="أدخل اسم المتقدم...">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">التخصص / المجال</label>
                    <input type="text" id="specialtyInput" oninput="updateFields()" class="form-input" value="{{ $specialty }}" placeholder="أدخل التخصص...">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">تاريخ ووقت اللقاء</label>
                    <input type="datetime-local" id="datetimeInput" oninput="updateFields()" value="{{ $datetimeLocal }}" class="form-input text-left" dir="ltr">
                </div>
                <div class="md:col-span-2 lg:col-span-4">
                    <label class="block text-xs font-bold text-slate-600 mb-1">رابط المقابلة (Google Meet)</label>
                    <input type="url" id="linkInput" oninput="updateFields()" class="form-input text-left" dir="ltr" value="{{ $meetingLink }}" placeholder="https://meet.google.com/...">
                </div>
            </div>
        </div>

        <!-- الصفحة الأولى: الغلاف -->
        <div class="page" id="page-1">
            <div class="shape-top-right"></div>
            <div class="shape-bottom-left"></div>

            <div class="content-wrapper justify-between h-full py-2">

                <!-- Header Section -->
                <div class="text-center mt-2">
                    <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-900 text-white mb-3 shadow-xl">
                        <i class="fas fa-bridge text-3xl text-amber-500"></i>
                    </div>
                    <h1 class="text-5xl font-black text-slate-900 tracking-tight mb-1">موثِق</h1>
                    <h2 class="text-xl font-bold text-slate-600 mb-5">جسر الخبرة</h2>

                    <div class="bg-slate-50 border-r-4 border-amber-500 p-4 rounded-l-xl shadow-sm inline-block">
                        <h3 class="text-2xl font-bold text-slate-800 mb-1">أجندة لقاء التعارف</h3>
                        <p class="text-base text-slate-500 font-semibold">حوار متبادل نحو مستقبل مشترك</p>
                    </div>
                </div>

                <!-- Meeting Data Section -->
                <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-5 my-4 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-1.5 h-full bg-slate-900"></div>
                    <h3 class="text-lg font-bold text-slate-900 mb-4 border-b pb-2"><i class="fas fa-file-signature text-amber-500 ml-2"></i> بيانات اللقاء</h3>

                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg text-sm">
                            <div>
                                <span class="font-bold text-slate-400 block mb-1">اسم الكيان:</span>
                                <span class="font-bold text-slate-800 text-base">موثِق – مجتمع المطورين</span>
                            </div>
                            <div>
                                <span class="font-bold text-slate-400 block mb-1">عنوان اللقاء:</span>
                                <span class="font-bold text-slate-800 text-base">لقاء التعارف وتقييم التوافق</span>
                            </div>
                        </div>

                        <!-- Dynamic Fields -->
                        <div class="flex items-end text-sm">
                            <span class="font-bold text-slate-700 w-32">اسم المحاور:</span>
                            <span id="interviewerDisplay" class="flex-grow text-slate-900 font-bold border-b-2 border-dashed border-slate-300 pb-1">........................................</span>
                        </div>

                        <div class="flex items-end text-sm">
                            <span class="font-bold text-slate-700 w-32">اسم المتقدم:</span>
                            <span id="applicantDisplay" class="flex-grow text-slate-900 font-bold border-b-2 border-dashed border-slate-300 pb-1">........................................</span>
                        </div>

                        <div class="flex items-end text-sm">
                            <span class="font-bold text-slate-700 w-32">التخصص/المجال:</span>
                            <span id="specialtyDisplay" class="flex-grow text-slate-900 font-bold border-b-2 border-dashed border-slate-300 pb-1">........................................</span>
                        </div>

                        <div class="flex flex-col md:flex-row md:items-end gap-4 pt-1">
                            <div class="flex items-end text-sm flex-grow">
                                <span class="font-bold text-slate-700 whitespace-nowrap">الوقت والتاريخ:</span>
                                <span id="datetimeDisplay" class="flex-grow text-center text-slate-900 font-bold font-mono border-b-2 border-dashed border-slate-300 pb-1 mx-2" dir="ltr">..../../.. -
                                    ..:..</span>
                            </div>
                            <div class="flex items-end text-sm whitespace-nowrap">
                                <span class="font-bold text-slate-700">مدة اللقاء:</span>
                                <!-- Updated duration format as requested -->
                                <span class="font-bold text-amber-600 mr-2">من 15 إلى 25 دقيقة</span>
                            </div>
                        </div>

                        <div class="bg-blue-50 border border-blue-100 p-3 rounded-lg flex flex-col gap-2 mt-2">
                            <div class="flex items-center gap-2 text-sm">
                                <i class="fab fa-google text-blue-600 text-lg"></i>
                                <span class="font-bold text-slate-700">وسيلة الاتصال:</span>
                                <span class="font-bold text-slate-900">جوجل مييت</span>
                            </div>
                            <div class="flex items-center gap-2 text-sm">
                                <i class="fas fa-link text-slate-400"></i>
                                <span class="font-bold text-slate-700">رابط المقابلة:</span>
                                <a id="linkDisplay" href="https://meet.google.com/gyf-eyds-cgc" class="text-blue-600 font-mono text-xs font-bold underline truncate max-w-[250px] md:max-w-full"
                                    dir="ltr">https://meet.google.com/gyf-eyds-cgc</a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Meeting Goal Section -->
                <div class="bg-slate-900 text-white p-5 rounded-xl relative shadow-md">
                    <i class="fas fa-bullseye absolute top-5 left-5 text-3xl opacity-20 text-amber-500"></i>
                    <h3 class="text-lg font-bold text-amber-400 mb-2">هدف اللقاء</h3>
                    <p class="text-sm leading-relaxed text-slate-200">
                        التعارف المتبادل بين <span class="font-bold text-white">موثِق</span> والمتقدم، والتعريف بهوية الكيان ورؤيته في بناء بيئة حاضنة للمطورين، والتعرف على خبرات المتقدم وقدراته
                        وتطلعاته، وصولًا إلى تقييم مدى <span class="font-bold text-amber-400">التوافق</span> للنمو معاً.
                    </p>
                </div>

                <!-- Footer Slogan -->
                <div class="text-center mt-auto pt-2">
                    <p class="text-sm font-bold text-slate-800">
                        موثِق | <span class="text-amber-600">لا نكتفي بتطبيقات صغيرة، بل نبني كيانًا أكبر.</span>
                    </p>
                </div>

            </div>
        </div>

        <!-- الصفحة الثانية: جدول مواعيد اللقاء -->
        <div class="page" id="page-2">
            <div class="shape-top-right"></div>

            <div class="content-wrapper flex flex-col h-full">

                <div class="flex justify-between items-center mb-5 border-b-2 border-slate-100 pb-2">
                    <div>
                        <h2 class="text-xl font-bold text-slate-900">جدول مواعيد اللقاء</h2>
                        <p class="text-amber-600 mt-1 font-bold text-xs">الأجندة الزمنية (المدة الإجمالية: 15 دقيقة و30 ثانية)</p>
                    </div>
                    <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg shadow-sm">
                        <i class="fas fa-clock"></i>
                    </div>
                </div>

                <!-- Schedule Table -->
                <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm mb-5">
                    <table class="w-full text-right agenda-table border-collapse text-sm">
                        <thead>
                            <tr>
                                <th class="p-2.5 w-36 border-b-2 border-slate-700">التوقيت</th>
                                <th class="p-2.5 w-24 border-b-2 border-slate-700">المدة</th>
                                <th class="p-2.5 w-40 border-b-2 border-slate-700">المحور</th>
                                <th class="p-2.5 border-b-2 border-slate-700">الهدف</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-700">
                            <tr class="border-b border-slate-200">
                                <td class="p-2.5 font-mono font-bold text-slate-900 text-xs" dir="ltr">00:00 - 01:00</td>
                                <td class="p-2.5 font-bold text-amber-600 text-xs">دقيقة واحدة</td>
                                <td class="p-2.5 font-bold text-slate-900 text-xs"><i class="fas fa-handshake text-slate-400 ml-1"></i> الترحيب والتعارف</td>
                                <td class="p-2.5 text-xs">تقديم المشاركين وتوضيح هدف اللقاء</td>
                            </tr>
                            <tr class="border-b border-slate-200">
                                <td class="p-2.5 font-mono font-bold text-slate-900 text-xs" dir="ltr">01:00 - 04:00</td>
                                <td class="p-2.5 font-bold text-amber-600 text-xs">3 دقائق</td>
                                <td class="p-2.5 font-bold text-slate-900 text-xs"><i class="fas fa-users text-slate-400 ml-1"></i> موثِق: من نحن؟</td>
                                <td class="p-2.5 text-xs">التعريف بالشركة وهويتها ورؤيتها</td>
                            </tr>
                            <tr class="border-b border-slate-200">
                                <td class="p-2.5 font-mono font-bold text-slate-900 text-xs" dir="ltr">04:00 - 11:00</td>
                                <td class="p-2.5 font-bold text-amber-600 text-xs">7 دقائق</td>
                                <td class="p-2.5 font-bold text-slate-900 text-xs"><i class="fas fa-laptop-code text-slate-400 ml-1"></i> المتقدم: من أنت؟</td>
                                <td class="p-2.5 text-xs">التعرف على الخبرات والقدرات والدوافع</td>
                            </tr>
                            <tr class="border-b border-slate-200">
                                <td class="p-2.5 font-mono font-bold text-slate-900 text-xs" dir="ltr">11:00 - 14:00</td>
                                <td class="p-2.5 font-bold text-amber-600 text-xs">3 دقائق</td>
                                <td class="p-2.5 font-bold text-slate-900 text-xs"><i class="fas fa-comments text-slate-400 ml-1"></i> المناقشة المفتوحة</td>
                                <td class="p-2.5 text-xs">استكمال النقاط والأسئلة المتبادلة</td>
                            </tr>
                            <tr>
                                <td class="p-2.5 font-mono font-bold text-slate-900 text-xs" dir="ltr">14:00 - 15:30</td>
                                <td class="p-2.5 font-bold text-amber-600 text-xs">دقيقة و30 ثانية</td>
                                <td class="p-2.5 font-bold text-slate-900 text-xs"><i class="fas fa-check-circle text-slate-400 ml-1"></i> القرار والخطوة التالية</td>
                                <!-- Updated text as requested -->
                                <td class="p-2.5 text-xs">إبلاغ المتقدم بالنتيجة وتوضيح الخطوة التالية</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Organizational Notes -->
                <div class="bg-amber-50 rounded-xl p-4 border border-amber-100 flex-grow">
                    <h3 class="text-base font-bold text-amber-800 mb-2 flex items-center">
                        <i class="fas fa-clipboard-list ml-2 text-lg"></i>
                        ملاحظات تنظيمية
                    </h3>
                    <ul class="space-y-2 text-slate-700 text-xs font-semibold">
                        <li class="flex items-start">
                            <i class="fas fa-caret-left text-amber-500 mt-1 ml-2"></i>
                            <span>الالتزام بالوقت المحدد لكل محور باحترافية.</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-caret-left text-amber-500 mt-1 ml-2"></i>
                            <span>إعطاء المتقدم مساحة كافية للتعبير عن خبراته وقدراته.</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-caret-left text-amber-500 mt-1 ml-2"></i>
                            <span>التركيز على المعلومات المرتبطة بمدى التوافق مع <strong>موثِق</strong>.</span>
                        </li>
                        <li class="flex items-start">
                            <i class="fas fa-caret-left text-amber-500 mt-1 ml-2"></i>
                            <span>تسجيل الملاحظات والقرار بعد المقابلة.</span>
                        </li>
                    </ul>

                    <div class="mt-4 p-2.5 bg-white rounded-lg border border-slate-200 inline-block shadow-sm w-full">
                        <span class="font-bold text-slate-800 text-xs block mb-2">النتائج المحتملة للقرار:</span>
                        <div class="flex justify-around mt-1 font-bold text-xs">
                            <span class="text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-md"><i class="fas fa-check mr-1"></i> قبول</span>
                            <span class="text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-md"><i class="fas fa-times mr-1"></i> رفض</span>
                            <span class="text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1 rounded-md"><i class="fas fa-clock mr-1"></i> تأجيل</span>
                        </div>
                    </div>
                </div>

                <!-- Page Footer -->
                <div class="mt-auto pt-2 flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100">
                    <span>موثِق - أجندة اللقاء</span>
                    <span>2</span>
                </div>
            </div>
        </div>

        <!-- الصفحة الثالثة: موثِق — من نحن؟ -->
        <div class="page" id="page-3">
            <div class="shape-bottom-left" style="opacity: 0.03;"></div>

            <div class="content-wrapper flex flex-col h-full">

                <div class="flex items-center mb-3 border-b-2 border-slate-100 pb-2">
                    <div class="w-1.5 h-6 bg-amber-500 ml-2 rounded-full"></div>
                    <h2 class="text-xl font-bold text-slate-900">موثِق — من نحن؟</h2>
                </div>

                <div class="flex-grow flex flex-col gap-3">
                    <!-- Section 1: التعريف -->
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <h3 class="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                            <span class="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">1</span>
                            التعريف بموثِق
                        </h3>
                        <p class="text-slate-600 leading-relaxed text-justify text-xs mb-1">
                            <strong class="text-slate-900">موثِق – جسر الخبرة</strong> كيان طموح يعمل على بناء بيئة تجمع بين الخبرة والعمل التطبيقي.
                        </p>
                        <p class="text-slate-600 leading-relaxed text-justify text-xs">
                            نؤمن بأن بناء شركة تقنية ناجحة لا يعتمد على المهارات البرمجية وحدها، بل يحتاج إلى <strong class="text-amber-600">تكامل الخبرات الإدارية والتجارية والتشغيلية
                                والتقنية</strong>، والعمل المشترك نحو أهداف واضحة لإنتاج قيمة حقيقية.
                        </p>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <!-- Section 2: الرؤية -->
                        <div class="p-3 rounded-xl border border-amber-200 bg-amber-50 shadow-sm relative overflow-hidden">
                            <i class="fas fa-eye absolute top-2 left-2 text-2xl text-amber-100"></i>
                            <h3 class="text-sm font-bold text-amber-900 mb-1.5 flex items-center gap-2">
                                <span class="bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">2</span>
                                رؤيتنا
                            </h3>
                            <p class="text-amber-800 font-bold leading-relaxed text-justify text-xs mt-1">
                                "خلق مجتمع يكون بيئة حاضنة تساعد على النمو، وبناء كيان تقني متكامل قادر على تطوير منتجات برمجية ذات قيمة حقيقية وتحقيق نمو مستدام."
                            </p>
                        </div>

                        <!-- Section 3: الرسالة وطبيعة المنتجات -->
                        <div class="p-3 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                            <i class="fas fa-rocket absolute top-2 left-2 text-2xl text-slate-100"></i>
                            <h3 class="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                                <span class="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">3</span>
                                رسالتنا وطبيعة عملنا
                            </h3>
                            <p class="text-slate-600 leading-relaxed text-justify text-[11px]">
                                ابتكار أدوات تطوير (DevTools) ومنصات متكاملة لإدارة عمل المطورين، مع ربط الخبرة التقنية بالتطبيق، وتحويل المعرفة إلى نتائج من خلال تكوين فرق عمل فعالة ومستدامة.
                            </p>
                        </div>
                    </div>

                    <!-- Section 4: مجالات التركيز والتحديات المؤسسية -->
                    <div class="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <h3 class="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <span class="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">4</span>
                            مجالات اهتمامنا والتحديات التي نعمل عليها
                        </h3>
                        <div class="grid grid-cols-2 gap-x-3 gap-y-1.5">
                            <ul class="space-y-1.5 text-slate-600 pr-1 text-xs">
                                <li class="flex items-start gap-1.5"><i class="fas fa-tools text-amber-500 mt-0.5 text-[8px]"></i> ابتكار وتطوير المنتجات والحلول البرمجية.</li>
                                <li class="flex items-start gap-1.5"><i class="fas fa-search text-amber-500 mt-0.5 text-[8px]"></i> اكتشاف الفرص التجارية وتحليل احتياجات السوق.</li>
                                <li class="flex items-start gap-1.5"><i class="fas fa-sitemap text-amber-500 mt-0.5 text-[8px]"></i> بناء عمليات إدارية وتشغيلية قابلة للتطوير.</li>
                            </ul>
                            <ul class="space-y-1.5 text-slate-600 pr-1 text-xs">
                                <li class="flex items-start gap-1.5"><i class="fas fa-handshake text-amber-500 mt-0.5 text-[8px]"></i> تطوير الأعمال وبناء العلاقات التجارية.</li>
                                <li class="flex items-start gap-1.5"><i class="fas fa-tasks text-amber-500 mt-0.5 text-[8px]"></i> تحديد الأولويات في ظل محدودية الموارد.</li>
                                <li class="flex items-start gap-1.5"><i class="fas fa-seedling text-amber-500 mt-0.5 text-[8px]"></i> إنشاء بيئة عمل تعزز التعلم والمبادرة.</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Section 5: المبادئ -->
                    <div class="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <h3 class="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <span class="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">5</span>
                            المبادئ التي تحكم عملنا
                        </h3>
                        <div class="grid grid-cols-2 gap-x-2 gap-y-2 text-[11px]">
                            <div class="flex items-start gap-1.5">
                                <i class="fas fa-circle text-amber-500 mt-1 text-[5px]"></i>
                                <span class="text-slate-600"><strong class="text-slate-800">الجودة قبل السرعة:</strong> بناء حلول قابلة للاعتماد والصيانة.</span>
                            </div>
                            <div class="flex items-start gap-1.5">
                                <i class="fas fa-circle text-amber-500 mt-1 text-[5px]"></i>
                                <span class="text-slate-600"><strong class="text-slate-800">الالتزام:</strong> تحمل المسؤولية والوفاء بالتعهدات.</span>
                            </div>
                            <div class="flex items-start gap-1.5">
                                <i class="fas fa-circle text-amber-500 mt-1 text-[5px]"></i>
                                <span class="text-slate-600"><strong class="text-slate-800">التعلم المستمر:</strong> تطوير المهارات وتحسين النتائج.</span>
                            </div>
                            <div class="flex items-start gap-1.5">
                                <i class="fas fa-circle text-amber-500 mt-1 text-[5px]"></i>
                                <span class="text-slate-600"><strong class="text-slate-800">الشفافية:</strong> الوضوح في التواصل والقرارات والتحديات.</span>
                            </div>
                            <div class="flex items-start gap-1.5 col-span-2">
                                <i class="fas fa-circle text-amber-500 mt-1 text-[5px]"></i>
                                <span class="text-slate-600"><strong class="text-slate-800">احترام الفريق:</strong> تقدير اختلاف الخبرات والتعاون لتحقيق الأهداف المشتركة.</span>
                            </div>
                        </div>
                    </div>

                    <!-- Section 6: الطموح -->
                    <div class="mt-auto bg-slate-900 text-white p-3 rounded-xl border border-slate-800 relative">
                        <i class="fas fa-mountain absolute top-2 left-3 text-2xl opacity-10"></i>
                        <h3 class="text-sm font-bold text-amber-400 mb-1 flex items-center gap-2">
                            <span class="bg-amber-500 text-slate-900 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">6</span>
                            طموحنا
                        </h3>
                        <p class="text-slate-300 leading-relaxed text-justify text-xs">
                            لا نريد أن يكون نجاحنا مرتبطًا بمشروع واحد أو بمجموعة محدودة من الأفراد؛ نطمح إلى بناء كيان يستطيع الاستمرار، وتطوير منتجات متعددة، وتوسيع قدراته مع مرور الوقت لضمان
                            استدامة الأعمال وتأثيرها.
                        </p>
                    </div>
                </div>

                <!-- Page Footer -->
                <div class="mt-2 pt-1.5 flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100">
                    <span>موثِق - جسر الخبرة</span>
                    <span>3</span>
                </div>
            </div>
        </div>

        <!-- الصفحة الرابعة: طبيعة الكيان وما نبحث عنه -->
        <div class="page" id="page-4">
            <div class="shape-top-right" style="background: var(--secondary);"></div>

            <div class="content-wrapper flex flex-col h-full">

                <div class="flex items-center mb-3 border-b-2 border-slate-100 pb-2">
                    <div class="w-1.5 h-6 bg-amber-500 ml-2 rounded-full"></div>
                    <h2 class="text-xl font-bold text-slate-900">طبيعة الكيان وما نبحث عنه</h2>
                </div>

                <div class="flex-grow flex flex-col gap-3">

                    <!-- Section 7: بناء الكيان -->
                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <h3 class="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                            <span class="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">7</span>
                            كيف ننظر إلى بناء الشركة؟
                        </h3>
                        <p class="text-slate-600 leading-relaxed text-justify text-xs mb-1">
                            ننظر إلى موثِق باعتبارها كيانًا يُبنى على تكامل الأدوار وتراكم القيمة، وليس مجرد مجموعة أفراد يعمل كل منهم بمعزل عن الآخرين.
                        </p>
                        <p class="text-slate-600 leading-relaxed text-justify text-xs">
                            إن نجاح الكيان يتطلب وضوح الأهداف، وتكامل المسؤوليات، والقدرة على <strong>تحويل الأفكار إلى خطط، والخطط إلى نتائج قابلة للقياس</strong>. كما يتطلب وجود أشخاص يفهمون العلاقة
                            بين احتياجات السوق، وقيمة المنتج، وجودة التنفيذ، واستدامة الأعمال.
                        </p>
                    </div>

                    <!-- Section 8: الإضافة الجديدة (الشراكة الإدارية) -->
                    <div class="bg-white p-3.5 rounded-xl border-2 border-amber-400 shadow-sm relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
                        <h3 class="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span class="bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">8</span>
                            لماذا نحتاج إلى شركاء إداريين؟
                        </h3>
                        <p class="text-slate-700 leading-relaxed text-justify text-xs mb-1.5 font-semibold">
                            نؤمن أن بناء شركة تقنية ناجحة لا يبدأ من المنتج وحده، بل من القدرة على اكتشاف الفرص، وفهم السوق، وتحديد الأولويات، وبناء العمليات، وتطوير العلاقات التجارية، وإدارة الموارد.
                        </p>
                        <p class="text-slate-700 leading-relaxed text-justify text-xs mb-1.5 font-semibold">
                            لذلك، نطمح إلى جمع كفاءات إدارية وتجارية قادرة على المشاركة في بناء الكيان وتطوير قدراته، وتحويل الأفكار إلى فرص قابلة للتنفيذ، والمساهمة في تأسيس شركة تستطيع إنتاج قيمة
                            حقيقية وتحقيق نمو مستدام.
                        </p>
                        <p class="text-amber-800 leading-relaxed text-justify text-xs font-bold bg-amber-50 p-2 rounded">
                            نبحث عن أشخاص لا يكتفون بإدارة المهام، بل يمتلكون الرغبة والقدرة على المشاركة في بناء الشركة نفسها.
                        </p>
                    </div>

                    <!-- Section 9: الكفاءات -->
                    <div>
                        <h3 class="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                            <span class="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">9</span>
                            الكفاءات التي نطمح إلى جمعها
                        </h3>
                        <p class="text-slate-600 mb-2 text-justify text-[11px]">نسعى إلى استكمال كفاءات تغطي المجالات الإدارية والتجارية والتشغيلية والتقنية، ومن أبرزها:</p>

                        <div class="grid grid-cols-2 gap-x-3 gap-y-2 mb-2">
                            <div class="flex items-start gap-2 bg-white border border-slate-200 p-2 rounded shadow-sm">
                                <i class="fas fa-cogs text-amber-500 mt-0.5 text-xs"></i>
                                <div>
                                    <span class="block font-bold text-slate-800 text-[11px]">الإدارة والتشغيل</span>
                                    <span class="text-[10px] text-slate-500 leading-tight block">تنظيم العمل، وبناء الإجراءات، ومتابعة التنفيذ.</span>
                                </div>
                            </div>
                            <div class="flex items-start gap-2 bg-white border border-slate-200 p-2 rounded shadow-sm">
                                <i class="fas fa-chart-line text-amber-500 mt-0.5 text-xs"></i>
                                <div>
                                    <span class="block font-bold text-slate-800 text-[11px]">تطوير الأعمال</span>
                                    <span class="text-[10px] text-slate-500 leading-tight block">اكتشاف الفرص، وتحليل السوق، وبناء العلاقات.</span>
                                </div>
                            </div>
                            <div class="flex items-start gap-2 bg-white border border-slate-200 p-2 rounded shadow-sm">
                                <i class="fas fa-box-open text-amber-500 mt-0.5 text-xs"></i>
                                <div>
                                    <span class="block font-bold text-slate-800 text-[11px]">إدارة المنتجات وتحليل الأعمال</span>
                                    <span class="text-[10px] text-slate-500 leading-tight block">فهم احتياجات العملاء وتحويلها إلى حلول.</span>
                                </div>
                            </div>
                            <div class="flex items-start gap-2 bg-white border border-slate-200 p-2 rounded shadow-sm">
                                <i class="fas fa-bullseye text-amber-500 mt-0.5 text-xs"></i>
                                <div>
                                    <span class="block font-bold text-slate-800 text-[11px]">المبيعات والتسويق</span>
                                    <span class="text-[10px] text-slate-500 leading-tight block">الوصول إلى العملاء وتطوير فرص النمو.</span>
                                </div>
                            </div>
                            <div class="flex items-start gap-2 bg-white border border-slate-200 p-2 rounded shadow-sm">
                                <i class="fas fa-file-invoice-dollar text-amber-500 mt-0.5 text-xs"></i>
                                <div>
                                    <span class="block font-bold text-slate-800 text-[11px]">التخطيط المالي والحوكمة</span>
                                    <span class="text-[10px] text-slate-500 leading-tight block">دعم الاستدامة المالية وتنظيم القرارات.</span>
                                </div>
                            </div>
                            <div class="flex items-start gap-2 bg-white border border-slate-200 p-2 rounded shadow-sm">
                                <i class="fas fa-code text-amber-500 mt-0.5 text-xs"></i>
                                <div>
                                    <span class="block font-bold text-slate-800 text-[11px]">التخصصات التقنية</span>
                                    <span class="text-[10px] text-slate-500 leading-tight block">تصميم الأنظمة، وتطوير البرمجيات، وضمان الجودة.</span>
                                </div>
                            </div>
                        </div>
                        <p class="text-slate-500 text-justify text-[10px] italic">
                            * ولا يُشترط أن يجمع شخص واحد جميع هذه القدرات؛ بل نؤمن بأهمية تكامل التخصصات وتوزيع المسؤوليات.
                        </p>
                    </div>

                    <!-- Section 10: التقدير والختام -->
                    <div class="mt-auto">
                        <h3 class="text-sm font-bold text-slate-800 mb-1.5 flex items-center gap-2">
                            <span class="bg-slate-900 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">10</span>
                            ما الذي نقدّره في الأشخاص؟
                        </h3>
                        <p class="text-slate-600 leading-relaxed text-justify text-[11px] mb-2">
                            نقدّر الأشخاص الذين يمتلكون المبادرة، ويفهمون مسؤولياتهم، ويستطيعون العمل باستقلالية وتعاون، ويبحثون عن حلول للمشكلات بدلًا من الاكتفاء بوصفها. كما نثمّن القدرة على التفكير
                            المنظم، والتواصل الواضح، وتقبّل الملاحظات، وربط العمل اليومي بالأهداف الأكبر للكيان.
                        </p>

                        <div class="bg-slate-900 text-white p-3 rounded-xl text-center border-b-4 border-amber-500 shadow-md">
                            <p class="text-xs text-slate-300 mb-1">
                                نؤمن أن بناء كيان ناجح يبدأ بتوافق الأشخاص حول الرؤية والمبادئ.
                            </p>
                            <h2 class="text-lg font-black text-white">موثِق – جسر الخبرة</h2>
                            <p class="text-[11px] text-amber-400 font-bold">
                                نبني كيانًا أكبر من مجموع أفراده، ونصنع قيمة تتجاوز حدود المهمة الواحدة.
                            </p>
                        </div>
                    </div>

                </div>

                <!-- Page Footer -->
                <div class="mt-2 pt-1.5 flex justify-between items-center text-[10px] text-slate-400 font-bold border-t border-slate-100">
                    <span>موثِق - نبذة ومجالات الاهتمام</span>
                    <span>4</span>
                </div>
            </div>
        </div>

        <script>
            // تحديث الحقول في الغلاف عند الكتابة في نموذج الإدخال
            function updateFields() {
                const defaultText = "........................................";

                // جلب القيم من المدخلات
                const interviewerVal = document.getElementById('interviewerInput').value;
                const applicantVal = document.getElementById('applicantInput').value;
                const specialtyVal = document.getElementById('specialtyInput').value;
                const datetimeVal = document.getElementById('datetimeInput').value;
                const linkVal = document.getElementById('linkInput').value;

                // عكس القيم على الأماكن المخصصة أو عرض النقاط الافتراضية
                document.getElementById('interviewerDisplay').innerText = interviewerVal ? interviewerVal : defaultText;
                document.getElementById('applicantDisplay').innerText = applicantVal ? applicantVal : defaultText;
                document.getElementById('specialtyDisplay').innerText = specialtyVal ? specialtyVal : defaultText;

                // تنسيق التاريخ والوقت
                let formattedDateTime = "..../../.. - ..:..";
                if (datetimeVal) {
                    const dateObj = new Date(datetimeVal);
                    // استخراج التاريخ
                    const datePart = dateObj.toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });
                    // استخراج الوقت بصيغة 12 ساعة
                    const timePart = dateObj.toLocaleTimeString('ar-SA', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                    formattedDateTime = `${datePart} - ${timePart}`;
                }
                document.getElementById('datetimeDisplay').innerText = formattedDateTime;

                // تنسيق الرابط
                const linkDisplay = document.getElementById('linkDisplay');
                if (linkVal) {
                    linkDisplay.innerText = linkVal;
                    linkDisplay.href = linkVal;
                } else {
                    linkDisplay.innerText = "https://meet.google.com/gyf-eyds-cgc";
                    linkDisplay.href = "https://meet.google.com/gyf-eyds-cgc";
                }
            }

            // تشغيل الدالة فور تحميل الصفحة لتهيئة الحقول بالبيانات الممررة
            window.onload = function () {
                updateFields();
            };
        </script>
    </body>

</html>
