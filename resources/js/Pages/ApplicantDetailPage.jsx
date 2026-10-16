import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import IconButton from '../components/IconButton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';

export default function ApplicantDetailPage({ currentRoute, navigate }) {
    const { t, isRtl } = useLanguage();
    const { hasPermission, user } = useAuth();
    const { showToast } = useToast();

    // Extract applicant ID from route (e.g. #/applicants/3)
    const parts = currentRoute.split('/');
    const applicantId = parts[2] ? parts[2].split('?')[0] : null;

    const [applicant, setApplicant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, resume, social, portfolio, interviews, emails, timeline

    // Editing Personal Info
    const [personalForm, setPersonalForm] = useState({});
    const [savingPersonal, setSavingPersonal] = useState(false);

    // Skills
    const [skillsList, setSkillsList] = useState([]);
    const [newSkill, setNewSkill] = useState('');

    // Social Links (متعدد)
    const [socialLinks, setSocialLinks] = useState([]);
    const [newSocial, setNewSocial] = useState({ platform: 'linkedin', url: '', label: '' });

    // Portfolio Items (متعدد - روابط أو صور)
    const [portfolioItems, setPortfolioItems] = useState([]);
    const [newPortfolio, setNewPortfolio] = useState({ title: '', url: '', image_url: '', description: '' });

    // CV Upload (ملف واحد)
    const [uploadingCv, setUploadingCv] = useState(false);
    const [cvFile, setCvFile] = useState(null);

    // Status Change Modal
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [toStatus, setToStatus] = useState('participant');
    const [statusNote, setStatusNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [sendEmailNotification, setSendEmailNotification] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Interview Scorecard & Custom Questions
    const [activeInterview, setActiveInterview] = useState(null);
    const [questionsList, setQuestionsList] = useState([]);
    const [newQuestionText, setNewQuestionText] = useState('');
    const [newQuestionCategory, setNewQuestionCategory] = useState('technical');
    const [savingQuestions, setSavingQuestions] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        scheduled_at: '',
        interview_type: 'online',
        meeting_link: '',
        location: '',
        send_invitation_email: true,
    });

    // Post-Interview Decision & Response Email Modal
    const [decisionModalOpen, setDecisionModalOpen] = useState(false);
    const [decisionType, setDecisionType] = useState('accepted'); // accepted, probation, rejected
    const [decisionEmailSubject, setDecisionEmailSubject] = useState('');
    const [decisionEmailBody, setDecisionEmailBody] = useState('');
    const [sendingDecision, setSendingDecision] = useState(false);

    // Email Conversation
    const [newEmailSubject, setNewEmailSubject] = useState('');
    const [newEmailBody, setNewEmailBody] = useState('');
    const [sendingEmail, setSendingEmail] = useState(false);
    const [simulatingReply, setSimulatingReply] = useState(false);

    const loadApplicant = async () => {
        if (!applicantId) return;
        setLoading(true);
        try {
            const res = await api.get(`/applicants/${applicantId}`);
            const app = res.applicant;
            setApplicant(app);

            // Populate forms
            setPersonalForm({
                full_name: app.full_name || '',
                email: app.email || '',
                phone: app.phone || '',
                national_id: app.national_id || '',
                age: app.age || '',
                birth_date: app.birth_date || '',
                gender: app.gender || 'ذكر',
                country: app.country || 'مصر',
                city: app.city || '',
                governorate: app.governorate || '',
                address: app.address || '',
                marital_status: app.marital_status || 'أعزب',
                position: app.position || '',
                experience_years: app.experience_years ?? 1,
                education_level: app.education_level || '',
                cover_letter: app.cover_letter || '',
                internal_notes: app.internal_notes || '',
                rating: app.rating || 0,
            });

            setSkillsList(app.skills || []);
            setSocialLinks(app.social_links || []);
            setPortfolioItems(app.portfolio_items || []);

            // Set default interview if exists
            if (app.interviews && app.interviews.length > 0) {
                const firstInt = app.interviews[0];
                setActiveInterview(firstInt);
                setQuestionsList(firstInt.questions || [
                    { id: 1, question: 'الخبرة العملية السابقة والمشاريع المنجزة', category: 'experience', score: 8, max_score: 10, notes: 'عرض مشاريع ممتازة' },
                    { id: 2, question: 'فهم الأساسيات والمعمارية البرمجية', category: 'technical', score: 9, max_score: 10, notes: 'إلمام قوي بالهيكلية' },
                    { id: 3, question: 'مهارات التواصل والتفاعل والعمل الجماعي', category: 'communication', score: 8, max_score: 10, notes: 'تواصل لَبِق وواضح' },
                    { id: 4, question: 'التفرغ والجاهزية للالتزام بمواعيد التسليم', category: 'commitment', score: 9, max_score: 10, notes: 'مستعد للبدء الفوري' },
                ]);
            }
        } catch (e) {
            showToast('تعذر العثور على المتقدم المطلوب.', 'error');
            navigate('#/applicants');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplicant();
    }, [applicantId]);

    // Save Personal & Professional Data
    const handleSavePersonalInfo = async (e) => {
        e.preventDefault();
        setSavingPersonal(true);
        try {
            const payload = {
                ...personalForm,
                skills: skillsList,
                social_links: socialLinks,
                portfolio_items: portfolioItems,
            };
            const res = await api.put(`/applicants/${applicant.id}`, payload);
            setApplicant(res.applicant);
            showToast('تم حفظ وتحديث بيانات المتقدم بنجاح!', 'success');
        } catch (err) {
            showToast(err.message || 'فشل تحديث البيانات.', 'error');
        } finally {
            setSavingPersonal(false);
        }
    };

    // CV Upload (Single File)
    const handleUploadCv = async (e) => {
        e.preventDefault();
        if (!cvFile) {
            showToast('يرجى اختيار ملف السيرة الذاتية أولاً.', 'warning');
            return;
        }

        setUploadingCv(true);
        const formData = new FormData();
        formData.append('resume', cvFile);

        try {
            const res = await api.post(`/applicants/${applicant.id}/resume`, formData);
            showToast('تم رفع ملف السيرة الذاتية بنجاح!', 'success');
            setApplicant(res.applicant);
            setCvFile(null);
        } catch (err) {
            showToast(err.message || 'فشل رفع الملف.', 'error');
        } finally {
            setUploadingCv(false);
        }
    };

    // Skills Add/Remove
    const handleAddSkill = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            const trimmed = newSkill.trim();
            if (trimmed && !skillsList.includes(trimmed)) {
                setSkillsList([...skillsList, trimmed]);
                setNewSkill('');
            }
        }
    };

    const handleRemoveSkill = (skill) => {
        setSkillsList(skillsList.filter(s => s !== skill));
    };

    // Social Links Add/Remove (متعدد)
    const handleAddSocial = (e) => {
        e.preventDefault();
        if (!newSocial.url) return;
        const newEntry = {
            id: Date.now(),
            platform: newSocial.platform,
            url: newSocial.url,
            label: newSocial.label || newSocial.platform,
        };
        const updated = [...socialLinks, newEntry];
        setSocialLinks(updated);
        setNewSocial({ platform: 'linkedin', url: '', label: '' });
        // auto-save to backend
        api.put(`/applicants/${applicant.id}`, { social_links: updated })
            .then(res => setApplicant(res.applicant));
        showToast('تمت إضافة الرابط الاجتماعي!', 'success');
    };

    const handleRemoveSocial = (id) => {
        const updated = socialLinks.filter(s => s.id !== id);
        setSocialLinks(updated);
        api.put(`/applicants/${applicant.id}`, { social_links: updated })
            .then(res => setApplicant(res.applicant));
    };

    // Portfolio Items Add/Remove (متعدد - روابط أو صور)
    const handleAddPortfolio = (e) => {
        e.preventDefault();
        if (!newPortfolio.title || (!newPortfolio.url && !newPortfolio.image_url)) return;
        const newEntry = {
            id: Date.now(),
            title: newPortfolio.title,
            url: newPortfolio.url,
            image_url: newPortfolio.image_url,
            description: newPortfolio.description,
        };
        const updated = [...portfolioItems, newEntry];
        setPortfolioItems(updated);
        setNewPortfolio({ title: '', url: '', image_url: '', description: '' });
        api.put(`/applicants/${applicant.id}`, { portfolio_items: updated })
            .then(res => setApplicant(res.applicant));
        showToast('تمت إضافة المشروع لمعرض الأعمال!', 'success');
    };

    const handleRemovePortfolio = (id) => {
        const updated = portfolioItems.filter(p => p.id !== id);
        setPortfolioItems(updated);
        api.put(`/applicants/${applicant.id}`, { portfolio_items: updated })
            .then(res => setApplicant(res.applicant));
    };

    // Status Change / Promotion
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        setUpdatingStatus(true);
        try {
            await api.post(`/applicants/${applicant.id}/status`, {
                to_status: toStatus,
                notes: statusNote,
                rejection_reason: rejectionReason,
                send_email: sendEmailNotification,
            });
            showToast('تم تحديث وترقية حالة المتقدم بنجاح!', 'success');
            setStatusModalOpen(false);
            loadApplicant();
        } catch (err) {
            showToast(err.message || 'فشل تحديث الحالة.', 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Interview Questions & Scoring
    const handleAddQuestion = (e) => {
        e.preventDefault();
        if (!newQuestionText.trim()) return;
        const newQ = {
            id: Date.now(),
            question: newQuestionText.trim(),
            category: newQuestionCategory,
            score: 8,
            max_score: 10,
            notes: '',
        };
        const updated = [...questionsList, newQ];
        setQuestionsList(updated);
        setNewQuestionText('');
    };

    const handleUpdateQuestionScore = (id, score) => {
        setQuestionsList(questionsList.map(q => q.id === id ? { ...q, score: Number(score) } : q));
    };

    const handleUpdateQuestionNotes = (id, notes) => {
        setQuestionsList(questionsList.map(q => q.id === id ? { ...q, notes } : q));
    };

    const handleRemoveQuestion = (id) => {
        setQuestionsList(questionsList.filter(q => q.id !== id));
    };

    const handleSaveInterviewScorecard = async () => {
        if (!activeInterview) return;
        setSavingQuestions(true);

        // compute overall average
        const avg = questionsList.length > 0
            ? Math.round((questionsList.reduce((acc, q) => acc + Number(q.score), 0) / questionsList.length) * 10) / 10
            : 8;

        try {
            await api.post(`/interviews/${activeInterview.id}/result`, {
                technical_score: avg >= 8 ? 9 : 7,
                communication_score: avg >= 8 ? 9 : 7,
                commitment_score: avg >= 8 ? 9 : 8,
                overall_score: avg,
                recommendation: avg >= 8.5 ? 'strong_hire' : (avg >= 7 ? 'hire' : 'under_consideration'),
                feedback: `تم تقييم ${questionsList.length} محاور وأسئلة فنية بمعدل إجمالي ${avg}/10.`,
                questions: questionsList,
            });
            showToast('تم حفظ تقييم الأسئلة والمقابلة بنجاح!', 'success');
            loadApplicant();
        } catch (err) {
            showToast(err.message || 'فشل حفظ تقييم المقابلة.', 'error');
        } finally {
            setSavingQuestions(false);
        }
    };

    // Open Post-Interview Decision & Response Email Modal
    const openDecisionEmailModal = (type) => {
        setDecisionType(type);
        if (type === 'accepted') {
            setDecisionEmailSubject(`تهانينا! اعتماد قبولك رسمياً في المنصة [${applicant.application_no}]`);
            setDecisionEmailBody(`مرحباً ${applicant.full_name}،\n\nيسعدنا جداً إعلامك باجتيازك المقابلة الشخصية والتقييم الفني بنجاح فائق، واعتماد قبولك رسمياً في المنصة كـ (${applicant.position}).\n\nستتلقى قريباً خطوات التدشين وبدء المساهمة.\n\nأهلاً بك معنا في الفريق!`);
        } else if (type === 'probation') {
            setDecisionEmailSubject(`نتيجة المقابلة - الانتقال لمرحلة الاختبار (Probation) [${applicant.application_no}]`);
            setDecisionEmailBody(`عزيزي ${applicant.full_name}،\n\nبناءً على نتائج مقابلتك الموفقة، يسرنا إعلامك بانتقالك إلى مرحلة تحت الاختبار (Probation Task).\nيرجى الاطلاع على متطلبات التكليف التجريبي وتسليمه خلال المدة المتفق عليها.\n\nمع تمنياتنا لك بالتوفيق والتميز.`);
        } else {
            setDecisionEmailSubject(`بخصوص طلب انضمامك كـ ${applicant.position} [${applicant.application_no}]`);
            setDecisionEmailBody(`عزيزي ${applicant.full_name}،\n\nنشكرك على اهتمامك ووقتك في إجراء المقابلة الشخصية معنا.\nنظراً لمحدودية الشواغر المتاحة في الدورة الحالية، نعتذر عن عدم المضي قدماً في طلبك في الوقت الراهن، مع احتفاظنا بملفك للمشاريع والفرص القادمة.\n\nنتمنى لك دوام النجاح والتألق.`);
        }
        setDecisionModalOpen(true);
    };

    const handleSendDecision = async (e) => {
        e.preventDefault();
        setSendingDecision(true);
        try {
            // 1. Send decision email
            await api.post('/emails/send', {
                applicant_id: applicant.id,
                recipient_email: applicant.email,
                subject: decisionEmailSubject,
                body: decisionEmailBody,
            });

            // 2. Update status to match decision
            await api.post(`/applicants/${applicant.id}/status`, {
                to_status: decisionType,
                notes: `تم الرد البريدي على المتقدم واعتماد القرار (${t(`status_${decisionType}`)})`,
                send_email: false,
            });

            showToast('تم إرسال الرد الرسمي للمتقدم وترقية حالته بنجاح!', 'success');
            setDecisionModalOpen(false);
            loadApplicant();
        } catch (err) {
            showToast(err.message || 'فشل إرسال الرد.', 'error');
        } finally {
            setSendingDecision(false);
        }
    };

    // Schedule Interview
    const handleScheduleInterview = async (e) => {
        e.preventDefault();
        try {
            await api.post('/interviews', {
                ...scheduleForm,
                applicant_id: applicant.id,
            });
            showToast('تمت جدولة المقابلة بنجاح!', 'success');
            setScheduleModalOpen(false);
            loadApplicant();
        } catch (err) {
            showToast(err.message || 'فشل جدولة المقابلة.', 'error');
        }
    };

    // Direct Email Message
    const handleSendDirectEmail = async (e) => {
        e.preventDefault();
        if (!newEmailSubject || !newEmailBody) return;
        setSendingEmail(true);
        try {
            await api.post('/emails/send', {
                applicant_id: applicant.id,
                recipient_email: applicant.email,
                subject: newEmailSubject,
                body: newEmailBody,
            });
            showToast('تم إرسال الرسالة وتسجيلها في المحادثة!', 'success');
            setNewEmailSubject('');
            setNewEmailBody('');
            loadApplicant();
        } catch (err) {
            showToast(err.message || 'فشل إرسال الرسالة.', 'error');
        } finally {
            setSendingEmail(false);
        }
    };

    // Simulate Applicant Reply
    const handleSimulateReply = async () => {
        setSimulatingReply(true);
        try {
            await api.post('/emails/simulate-reply', {
                applicant_id: applicant.id,
                subject: `رد من ${applicant.full_name}: استفسار وتأكيد الموعد`,
                body: `السلام عليكم ورحمة الله،\nأود التأكيد على استلامي لرسالتكم الكريمة، وجاهزيتي التامة لتسليم المهام ومتابعة الخطوات القادمة.\n\nشاكر ومقدّر لاهتمامكم.\n${applicant.full_name}`,
            });
            showToast('تمت محاكاة وصول رد بريدي جديد من المتقدم في المحادثة!', 'success');
            loadApplicant();
        } catch (err) {
            showToast(err.message || 'فشل محاكاة الرد.', 'error');
        } finally {
            setSimulatingReply(false);
        }
    };

    if (loading) {
        return (
            <AppLayout currentRoute={currentRoute} navigate={navigate}>
                <div className="py-24 text-center text-slate-400">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-bold text-slate-500">جاري تحميل الملف الشامل للمتقدم...</p>
                </div>
            </AppLayout>
        );
    }

    if (!applicant) return null;

    const getStatusBadge = (status) => {
        const styles = {
            applicant: 'bg-blue-50 text-blue-700 border-blue-200',
            participant: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            probation: 'bg-amber-50 text-amber-700 border-amber-200',
            accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            rejected: 'bg-rose-50 text-rose-700 border-rose-200',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
                {t(`status_${status}`) || status}
            </span>
        );
    };

    return (
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
            <div className="space-y-6">
                {/* Standardized Page Header Box */}
                <PageHeader
                    title={`ملف المتقدم: ${applicant.full_name}`}
                    subtitle={`${applicant.position} • إدارة البيانات الشخصية، تقييم المقابلات، السيرة الذاتية، والمراسلات.`}
                    icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    badge={
                        <div className="inline-flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-mono">{applicant.application_no}</span>
                            {getStatusBadge(applicant.status)}
                        </div>
                    }
                >
                    {/* Back to Applicants List */}
                    <IconButton
                        onClick={() => navigate('#/applicants')}
                        tooltip="العودة لقائمة المتقدمين"
                        icon="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />

                    {/* Download / Upload CV */}
                    {applicant.resume_path ? (
                        <IconButton
                            variant="success"
                            href={applicant.resume_path}
                            target="_blank"
                            rel="noreferrer"
                            download
                            tooltip="تحميل السيرة الذاتية (CV)"
                            icon="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    ) : (
                        <IconButton
                            onClick={() => setActiveTab('resume')}
                            tooltip="رفع السيرة الذاتية (CV)"
                            icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                    )}

                    {/* Schedule Interview */}
                    {hasPermission('schedule_interviews') && (
                        <IconButton
                            onClick={() => setScheduleModalOpen(true)}
                            tooltip={t('scheduleInterview')}
                            icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    )}

                    {/* Change / Promote Status (Primary Action) */}
                    {hasPermission('promote_applicants') && (
                        <IconButton
                            variant="primary"
                            onClick={() => {
                                setToStatus(applicant.status === 'applicant' ? 'participant' : applicant.status === 'participant' ? 'probation' : 'accepted');
                                setStatusModalOpen(true);
                            }}
                            tooltip={t('changeStatus')}
                            icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                        />
                    )}
                </PageHeader>

                {/* Applicant Summary Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
                            {applicant.full_name?.charAt(0) || 'A'}
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-800">
                                {applicant.full_name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500">
                                <span>📧 {applicant.email}</span>
                                <span>📞 {applicant.phone}</span>
                                <span>📍 {applicant.city ? `${applicant.city}، ` : ''}{applicant.country}</span>
                                {applicant.age && <span>🎂 {applicant.age} سنة</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Smooth Tabs Navigation (بدون زحام) */}
                <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex items-center gap-1 overflow-x-auto scrollbar-none">
                    {[
                        { id: 'overview', label: 'البيانات الشخصية والمهنية', icon: '👤' },
                        { id: 'social', label: `ملفات التواصل (${socialLinks.length})`, icon: '🌐' },
                        { id: 'portfolio', label: `معرض الأعمال (${portfolioItems.length})`, icon: '🎨' },
                        { id: 'resume', label: 'السيرة الذاتية (CV)', icon: '📄' },
                        { id: 'interviews', label: `المقابلات والتقييم (${applicant.interviews?.length || 0})`, icon: '🎯' },
                        { id: 'emails', label: `المراسلات والردود (${applicant.email_logs?.length || 0})`, icon: '✉️' },
                        { id: 'timeline', label: 'المسار والترقيات', icon: '⏳' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                activeTab === tab.id
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab 1: Overview & Personal Details (العمر، المحافظة، العنوان...) */}
                {activeTab === 'overview' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div>
                                <h3 className="font-black text-sm text-slate-800">
                                    البيانات الشخصية والوظيفية المفصلة
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    استعراض وتعديل كافة المعلومات الشخصية والمهنية للمتقدم.
                                </p>
                            </div>
                            <button
                                onClick={handleSavePersonalInfo}
                                disabled={savingPersonal}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                            >
                                {savingPersonal ? 'جاري الحفظ...' : '💾 حفظ التعديلات'}
                            </button>
                        </div>

                        <form onSubmit={handleSavePersonalInfo} className="space-y-6">
                            {/* Personal Details Section */}
                            <div>
                                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">
                                    1. المعلومات الشخصية (Personal Info)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')}</label>
                                        <input
                                            type="text"
                                            value={personalForm.full_name}
                                            onChange={e => setPersonalForm({ ...personalForm, full_name: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">العمر (سنوات)</label>
                                        <input
                                            type="number"
                                            min="15"
                                            max="90"
                                            value={personalForm.age}
                                            onChange={e => setPersonalForm({ ...personalForm, age: e.target.value })}
                                            placeholder="مثلاً: 27"
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الميلاد</label>
                                        <input
                                            type="date"
                                            value={personalForm.birth_date}
                                            onChange={e => setPersonalForm({ ...personalForm, birth_date: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">الجنس</label>
                                        <select
                                            value={personalForm.gender}
                                            onChange={e => setPersonalForm({ ...personalForm, gender: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                        >
                                            <option value="ذكر">ذكر (Male)</option>
                                            <option value="أنثى">أنثى (Female)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('nationalId')}</label>
                                        <input
                                            type="text"
                                            value={personalForm.national_id}
                                            onChange={e => setPersonalForm({ ...personalForm, national_id: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">الحالة الاجتماعية</label>
                                        <select
                                            value={personalForm.marital_status}
                                            onChange={e => setPersonalForm({ ...personalForm, marital_status: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                        >
                                            <option value="أعزب">أعزب / عزباء</option>
                                            <option value="متزوج">متزوج / متزوجة</option>
                                            <option value="أخرى">أخرى</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Location & Contact Section */}
                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">
                                    2. الموقع والعناوين والتواصل (Location & Contact)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')}</label>
                                        <input
                                            type="email"
                                            value={personalForm.email}
                                            onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
                                        <input
                                            type="text"
                                            value={personalForm.phone}
                                            onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('country')}</label>
                                        <input
                                            type="text"
                                            value={personalForm.country}
                                            onChange={e => setPersonalForm({ ...personalForm, country: e.target.value })}
                                            placeholder="مصر، السعودية..."
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">المحافظة / الإمارة</label>
                                        <input
                                            type="text"
                                            value={personalForm.governorate}
                                            onChange={e => setPersonalForm({ ...personalForm, governorate: e.target.value })}
                                            placeholder="الجيزة، الدقهلية، الرياض..."
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                                        />
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">العنوان التفصيلي والسكن</label>
                                        <input
                                            type="text"
                                            value={personalForm.address}
                                            onChange={e => setPersonalForm({ ...personalForm, address: e.target.value })}
                                            placeholder="الشارع، الحي، المعلم القريب..."
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Professional & Skills Section */}
                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">
                                    3. المؤهل والتخصص والمهارات (Professional Details)
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('position')}</label>
                                        <input
                                            type="text"
                                            value={personalForm.position}
                                            onChange={e => setPersonalForm({ ...personalForm, position: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('experienceYears')}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={personalForm.experience_years}
                                            onChange={e => setPersonalForm({ ...personalForm, experience_years: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('educationLevel')}</label>
                                        <input
                                            type="text"
                                            value={personalForm.education_level}
                                            onChange={e => setPersonalForm({ ...personalForm, education_level: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                                        />
                                    </div>
                                </div>

                                {/* Skills Chips Builder */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('skills')}</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newSkill}
                                            onChange={e => setNewSkill(e.target.value)}
                                            onKeyDown={handleAddSkill}
                                            placeholder="أضف مهارة جديدة (مثلاً: React, Docker, UI/UX)..."
                                            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSkill}
                                            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold"
                                        >
                                            إضافة
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {skillsList.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                                            >
                                                <span>{skill}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="text-indigo-400 hover:text-indigo-800 font-bold"
                                                >
                                                    &times;
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Cover Letter & Internal Notes */}
                            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('coverLetter')}</label>
                                    <textarea
                                        rows={4}
                                        value={personalForm.cover_letter}
                                        onChange={e => setPersonalForm({ ...personalForm, cover_letter: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('internalNotes')}</label>
                                    <textarea
                                        rows={4}
                                        value={personalForm.internal_notes}
                                        onChange={e => setPersonalForm({ ...personalForm, internal_notes: e.target.value })}
                                        placeholder="ملاحظات سرية للإدارة وفريق الفرز..."
                                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed bg-amber-50/20"
                                    ></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tab 2: Resume (CV) Upload & Viewer (ملف واحد) */}
                {activeTab === 'resume' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl">
                        <h3 className="font-black text-sm text-slate-800 mb-2">
                            ملف السيرة الذاتية (CV / Resume)
                        </h3>
                        <p className="text-xs text-slate-500 mb-6">
                            يمكنك هنا رفع ملف سيرة ذاتية للمتقدم (ملف واحد بصيغة PDF أو Word) واستعراضه أو تنزيله مباشرة.
                        </p>

                        {/* Current CV status */}
                        {applicant.resume_path ? (
                            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-xl shadow-xs">
                                        📄
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs text-emerald-950">تم رفع السيرة الذاتية بنجاح</p>
                                        <p className="text-[11px] text-emerald-700 font-mono mt-0.5 truncate max-w-xs">
                                            {applicant.resume_path}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <a
                                        href={applicant.resume_path}
                                        target="_blank"
                                        rel="noreferrer"
                                        download
                                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                    >
                                        تحميل / فتح
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div className="p-5 rounded-2xl bg-slate-50 border border-dashed border-slate-300 text-center mb-8 text-xs text-slate-500">
                                لا يوجد ملف سيرة ذاتية مرفوع حالياً لهذا المتقدم.
                            </div>
                        )}

                        {/* Upload Form */}
                        <form onSubmit={handleUploadCv} className="space-y-4">
                            <label className="block text-xs font-bold text-slate-700">
                                رفع ملف سيرة ذاتية جديد (PDF, DOC, DOCX حتى 10MB)
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={e => setCvFile(e.target.files[0])}
                                className="w-full text-xs text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                            />

                            <button
                                type="submit"
                                disabled={uploadingCv || !cvFile}
                                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 disabled:opacity-50 transition-all flex items-center gap-2"
                            >
                                {uploadingCv ? 'جاري رفع الملف...' : '⬆️ حفظ ورفع السيرة الذاتية'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Tab 3: Social Links (روابط ملفات سوشيال متعدد) */}
                {activeTab === 'social' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div>
                                <h3 className="font-black text-sm text-slate-800">
                                    روابط حسابات التواصل الاجتماعي والمنصات (متعدد)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    إضافة روابط متعددة لملفات LinkedIn, GitHub, Twitter/X, Behance, Facebook وغيرها.
                                </p>
                            </div>
                        </div>

                        {/* Add Social Link Form */}
                        <form onSubmit={handleAddSocial} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">المنصة</label>
                                <select
                                    value={newSocial.platform}
                                    onChange={e => setNewSocial({ ...newSocial, platform: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                                >
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="github">GitHub</option>
                                    <option value="twitter">Twitter / X</option>
                                    <option value="behance">Behance</option>
                                    <option value="dribbble">Dribbble</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="telegram">Telegram</option>
                                    <option value="website">موقع شخصي / مدونة</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">العنوان / الوصف</label>
                                <input
                                    type="text"
                                    value={newSocial.label}
                                    onChange={e => setNewSocial({ ...newSocial, label: e.target.value })}
                                    placeholder="مثلاً: حسابي على لينكد إن"
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">رابط الحساب (URL) *</label>
                                <input
                                    type="url"
                                    required
                                    value={newSocial.url}
                                    onChange={e => setNewSocial({ ...newSocial, url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
                                />
                            </div>

                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs"
                            >
                                + إضافة الرابط
                            </button>
                        </form>

                        {/* Social Links List */}
                        {socialLinks.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400">
                                لا توجد روابط سوشيال مضافة حتى الآن.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {socialLinks.map(s => (
                                    <div
                                        key={s.id || s.url}
                                        className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between bg-white shadow-xs"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700">
                                                {s.platform}
                                            </span>
                                            <h4 className="font-bold text-xs text-slate-800 mt-1 truncate">
                                                {s.label || s.platform}
                                            </h4>
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[11px] text-indigo-600 hover:underline truncate block font-mono mt-0.5"
                                            >
                                                {s.url}
                                            </a>
                                        </div>

                                        <button
                                            onClick={() => handleRemoveSocial(s.id)}
                                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg text-sm"
                                            title="حذف الرابط"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 4: Portfolio Showcase (معرض أعمال - روابط وصور متعددة) */}
                {activeTab === 'portfolio' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                            <div>
                                <h3 className="font-black text-sm text-slate-800">
                                    معرض الأعمال والمشاريع (روابط وصور)
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    إضافة نماذج للمشاريع السابقة، لقطات شاشة، وروابط حية لمعاينتها.
                                </p>
                            </div>
                        </div>

                        {/* Add Portfolio Form */}
                        <form onSubmit={handleAddPortfolio} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 mb-8 space-y-4">
                            <h4 className="text-xs font-bold text-indigo-700 uppercase">إضافة مشروع أو عمل جديد</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم المشروع *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newPortfolio.title}
                                        onChange={e => setNewPortfolio({ ...newPortfolio, title: e.target.value })}
                                        placeholder="مثلاً: تطبيق إدارة العقارات"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">رابط المشروع الحي (URL)</label>
                                    <input
                                        type="url"
                                        value={newPortfolio.url}
                                        onChange={e => setNewPortfolio({ ...newPortfolio, url: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">رابط صورة المعاينة (Image URL)</label>
                                    <input
                                        type="url"
                                        value={newPortfolio.image_url}
                                        onChange={e => setNewPortfolio({ ...newPortfolio, image_url: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-mono"
                                    />
                                </div>
                                <div className="sm:col-span-3">
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">وصف العمل والتقنيات المستخدمة</label>
                                    <textarea
                                        rows={2}
                                        value={newPortfolio.description}
                                        onChange={e => setNewPortfolio({ ...newPortfolio, description: e.target.value })}
                                        placeholder="تحدث بإيجاز عن دور المتقدم في هذا المشروع..."
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                                    ></textarea>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-xs"
                            >
                                + إضافة المشروع لمعرض الأعمال
                            </button>
                        </form>

                        {/* Portfolio Cards Grid */}
                        {portfolioItems.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400">
                                لا توجد مشاريع مضافة لمعرض الأعمال حتى الآن.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {portfolioItems.map(p => (
                                    <div
                                        key={p.id}
                                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
                                    >
                                        <div>
                                            {p.image_url ? (
                                                <div className="h-40 bg-slate-100 overflow-hidden">
                                                    <img
                                                        src={p.image_url}
                                                        alt={p.title}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                        onError={(e) => { e.target.style.display = 'none'; }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="h-28 bg-gradient-to-tr from-slate-100 to-indigo-50 flex items-center justify-center text-3xl">
                                                    💻
                                                </div>
                                            )}

                                            <div className="p-4">
                                                <h4 className="font-bold text-xs text-slate-800">{p.title}</h4>
                                                {p.description && (
                                                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-3 leading-relaxed">
                                                        {p.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 pt-0 border-t border-slate-50 mt-2 flex items-center justify-between">
                                            {p.url ? (
                                                <a
                                                    href={p.url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                                                >
                                                    🔗 معاينة المشروع
                                                </a>
                                            ) : (
                                                <span></span>
                                            )}
                                            <button
                                                onClick={() => handleRemovePortfolio(p.id)}
                                                className="text-slate-400 hover:text-rose-600 text-xs font-bold"
                                            >
                                                حذف
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 5: Interviews & Evaluation Questions (ملف مقابلة مخصص + أسئلة + رد مناسب) */}
                {activeTab === 'interviews' && (
                    <div className="space-y-6">
                        {/* Interview Selector & Schedule New */}
                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-black text-sm text-slate-800">
                                    ملف المقابلة والأسئلة التقييمية
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    إضافة أسئلة محددة، تسجيل درجات المحكّم، واتخاذ القرار النهائي مع إرسال الرد المناسب للمتقدم.
                                </p>
                            </div>

                            <button
                                onClick={() => setScheduleModalOpen(true)}
                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5"
                            >
                                + جدولة مقابلة جديدة
                            </button>
                        </div>

                        {activeInterview ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left 2 cols: Questions Scorecard */}
                                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-sm text-slate-800">
                                                أسئلة التقييم المخصصة للمقابلة
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                                                {questionsList.length} محاور
                                            </span>
                                        </div>

                                        <button
                                            onClick={handleSaveInterviewScorecard}
                                            disabled={savingQuestions}
                                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 disabled:opacity-50"
                                        >
                                            {savingQuestions ? 'جاري الحفظ...' : '💾 اعتماد التقييم'}
                                        </button>
                                    </div>

                                    {/* Add Question Box */}
                                    <form onSubmit={handleAddQuestion} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-2 items-center">
                                        <input
                                            type="text"
                                            value={newQuestionText}
                                            onChange={e => setNewQuestionText(e.target.value)}
                                            placeholder="أضف سؤالاً للمقابلة (مثلاً: ما هي خبرتك في تأمين API؟)..."
                                            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white w-full"
                                        />
                                        <select
                                            value={newQuestionCategory}
                                            onChange={e => setNewQuestionCategory(e.target.value)}
                                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                                        >
                                            <option value="technical">فني وتقني</option>
                                            <option value="experience">خبرة سابقة</option>
                                            <option value="communication">تواصل وذكاء اجتماعي</option>
                                            <option value="problem_solving">حل المشكلات</option>
                                        </select>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl whitespace-nowrap"
                                        >
                                            + إضافة سؤال
                                        </button>
                                    </form>

                                    {/* Questions List with rating sliders */}
                                    <div className="space-y-4">
                                        {questionsList.map((q, idx) => (
                                            <div
                                                key={q.id}
                                                className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all bg-white shadow-xs space-y-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                                                            {idx + 1}
                                                        </span>
                                                        <h5 className="font-bold text-xs text-slate-800">
                                                            {q.question}
                                                        </h5>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveQuestion(q.id)}
                                                        className="text-slate-300 hover:text-rose-600 text-sm"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>

                                                {/* Score Slider */}
                                                <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl">
                                                    <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">الدرجة:</span>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={q.score}
                                                        onChange={e => handleUpdateQuestionScore(q.id, e.target.value)}
                                                        className="flex-1 accent-indigo-600 cursor-pointer"
                                                    />
                                                    <span className="font-mono font-black text-indigo-700 text-xs min-w-[40px] text-end">
                                                        {q.score} / 10
                                                    </span>
                                                </div>

                                                {/* Notes */}
                                                <input
                                                    type="text"
                                                    value={q.notes || ''}
                                                    onChange={e => handleUpdateQuestionNotes(q.id, e.target.value)}
                                                    placeholder="ملاحظات المحكّم على إجابة المتقدم..."
                                                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 placeholder-slate-400"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right 1 col: Interview Summary & Decision Email Composer */}
                                <div className="space-y-6">
                                    {/* Overall Score Summary */}
                                    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs text-center">
                                        <span className="text-xs font-bold text-slate-400 block mb-1">
                                            المعدل النهائي للمقابلة
                                        </span>
                                        <div className="text-4xl font-black text-indigo-700 my-2 font-mono">
                                            {questionsList.length > 0
                                                ? Math.round((questionsList.reduce((acc, q) => acc + Number(q.score), 0) / questionsList.length) * 10) / 10
                                                : 8} <span className="text-sm font-normal text-slate-400">/ 10</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mb-6">
                                            تم احتساب المتوسط التلقائي لـ {questionsList.length} محاور تقييمية.
                                        </p>

                                        {/* Decision Actions (الرد على المتقدم بالرد المناسب) */}
                                        <h4 className="text-xs font-black text-slate-800 mb-3 text-start">
                                            اتخاذ القرار وإرسال الرد المناسب للمتقدم:
                                        </h4>
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => openDecisionEmailModal('accepted')}
                                                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-between"
                                            >
                                                <span>🎉 إرسال خطاب القبول والاعتماد</span>
                                                <span>&rarr;</span>
                                            </button>
                                            <button
                                                onClick={() => openDecisionEmailModal('probation')}
                                                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-between"
                                            >
                                                <span>⏳ إرسال تكليف مرحلة الاختبار</span>
                                                <span>&rarr;</span>
                                            </button>
                                            <button
                                                onClick={() => openDecisionEmailModal('rejected')}
                                                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-between"
                                            >
                                                <span>✉️ إرسال خطاب اعتذار مع الملاحظات</span>
                                                <span>&rarr;</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400">
                                لا توجد مقابلات مجدولة حتى الآن. اضغط "جدولة مقابلة جديدة" بالأعلى للبدء.
                            </div>
                        )}
                    </div>
                )}

                {/* Tab 6: Emails & Message Exchange Thread (أشوف ايميلاته اللى بعتهالي وردودي عليها) */}
                {activeTab === 'emails' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                            <div>
                                <h3 className="font-black text-sm text-slate-800">
                                    سجل المحادثات والمراسلات البريدية المتبادلة
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    استعراض جميع الرسائل الصادرة والواردة مع ({applicant.email}) وإرسال رد فوري.
                                </p>
                            </div>

                            <button
                                onClick={handleSimulateReply}
                                disabled={simulatingReply}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start"
                                title="محاكاة وصول رد جديد من المتقدم في المحادثة"
                            >
                                <span>📥</span>
                                <span>{simulatingReply ? 'جاري الاستقبال...' : 'محاكاة رد بريدي من المتقدم'}</span>
                            </button>
                        </div>

                        {/* Thread Timeline View */}
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {!applicant.email_logs || applicant.email_logs.length === 0 ? (
                                <div className="py-12 text-center text-xs text-slate-400">
                                    لا توجد رسائل متبادلة بعد مع هذا المتقدم.
                                </div>
                            ) : (
                                applicant.email_logs.map(log => {
                                    const isReceived = log.type === 'received';
                                    return (
                                        <div
                                            key={log.id}
                                            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                                                isReceived
                                                    ? 'bg-amber-50/40 border-amber-200 ms-0 me-6'
                                                    : 'bg-indigo-50/40 border-indigo-200 ms-6 me-0'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        isReceived ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                                                    }`}>
                                                        {isReceived ? '📥 رسالة واردة من المتقدم' : '📤 رسالة صادرة من الإدارة'}
                                                    </span>
                                                    <span className="font-bold text-xs text-slate-800">
                                                        {log.subject}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {new Date(log.created_at).toLocaleString('ar-EG')}
                                                </span>
                                            </div>

                                            <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white/70 p-3 rounded-xl border border-white">
                                                {log.body}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Inline Reply Composer */}
                        <form onSubmit={handleSendDirectEmail} className="pt-4 border-t border-slate-100 space-y-3">
                            <h4 className="font-bold text-xs text-slate-800">
                                الرد على المتقدم برسالة جديدة:
                            </h4>
                            <input
                                type="text"
                                required
                                value={newEmailSubject}
                                onChange={e => setNewEmailSubject(e.target.value)}
                                placeholder="موضوع الرسالة (مثلاً: بخصوص موعد المقابلة)..."
                                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                            />
                            <textarea
                                rows={3}
                                required
                                value={newEmailBody}
                                onChange={e => setNewEmailBody(e.target.value)}
                                placeholder="اكتب ردك هنا إلى المتقدم..."
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs leading-relaxed"
                            ></textarea>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={sendingEmail}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                                >
                                    {sendingEmail ? 'جاري الإرسال...' : 'إرسال الرد الآن ✉️'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tab 7: Timeline of Status Transitions */}
                {activeTab === 'timeline' && (
                    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
                        <h3 className="font-black text-sm text-slate-800 mb-6">
                            سجل ومسار التدرج التاريخي للحالة
                        </h3>

                        <div className="border-s-2 border-indigo-200 ms-4 ps-6 space-y-6 text-xs">
                            {applicant.status_logs?.map((log, idx) => (
                                <div key={idx} className="relative">
                                    <div className="absolute -start-[31px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs"></div>
                                    <h4 className="font-bold text-slate-800 text-xs">
                                        {log.notes || `تم تغيير الحالة إلى ${t(`status_${log.to_status}`)}`}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        المسؤول: {log.changed_by_user?.name || 'النظام'} &bull; {new Date(log.created_at).toLocaleString('ar-EG')}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal: Change Status & Promotion */}
            {statusModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">{t('changeStatus')}</h3>
                            <button onClick={() => setStatusModalOpen(false)} className="text-slate-400 text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">المرحلة الجديدة</label>
                                <select
                                    value={toStatus}
                                    onChange={e => setToStatus(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="applicant">{t('status_applicant')} (متقدم جديد)</option>
                                    <option value="participant">{t('status_participant')} (مشارك في الفرز والمقابلات)</option>
                                    <option value="probation">{t('status_probation')} (تحت الاختبار / تجربة)</option>
                                    <option value="accepted">{t('status_accepted')} (مقبول ومعتمد)</option>
                                    <option value="rejected">{t('status_rejected')} (مرفوض / اعتذار)</option>
                                </select>
                            </div>
                            {toStatus === 'rejected' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('rejectionReason')}</label>
                                    <input
                                        type="text"
                                        value={rejectionReason}
                                        onChange={e => setRejectionReason(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('notes')}</label>
                                <textarea
                                    rows={2}
                                    value={statusNote}
                                    onChange={e => setStatusNote(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                ></textarea>
                            </div>
                            <div className="pt-2 flex gap-2 justify-end">
                                <button type="button" onClick={() => setStatusModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">{t('cancel')}</button>
                                <button type="submit" disabled={updatingStatus} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                                    {updatingStatus ? 'جاري الحفظ...' : t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Schedule New Interview */}
            {scheduleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">{t('scheduleInterview')}</h3>
                            <button onClick={() => setScheduleModalOpen(false)} className="text-slate-400 text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleScheduleInterview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('scheduledAt')} *</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={scheduleForm.scheduled_at}
                                    onChange={e => setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('interviewType')}</label>
                                <select
                                    value={scheduleForm.interview_type}
                                    onChange={e => setScheduleForm({ ...scheduleForm, interview_type: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="online">أونلاين (Google Meet)</option>
                                    <option value="in_person">حضورياً في المقر</option>
                                    <option value="phone">هاتفياً</option>
                                </select>
                            </div>
                            <div className="pt-2 flex gap-2 justify-end">
                                <button type="button" onClick={() => setScheduleModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">{t('cancel')}</button>
                                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold">تأكيد الجدولة</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Post-Interview Decision & Response Email (الرد على المتقدم بالرد المناسب) */}
            {decisionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-800">
                                إرسال قرار المقابلة والرد المناسب للمتقدم
                            </h3>
                            <button onClick={() => setDecisionModalOpen(false)} className="text-slate-400 text-xl">&times;</button>
                        </div>
                        <form onSubmit={handleSendDecision} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">المستلم</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={`${applicant.full_name} <${applicant.email}>`}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">موضوع الرسالة *</label>
                                <input
                                    type="text"
                                    required
                                    value={decisionEmailSubject}
                                    onChange={e => setDecisionEmailSubject(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">نص الرد الرسمي *</label>
                                <textarea
                                    rows={6}
                                    required
                                    value={decisionEmailBody}
                                    onChange={e => setDecisionEmailBody(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs leading-relaxed"
                                ></textarea>
                            </div>
                            <div className="pt-2 flex gap-2 justify-end">
                                <button type="button" onClick={() => setDecisionModalOpen(false)} className="px-4 py-2 border rounded-xl text-xs font-bold">{t('cancel')}</button>
                                <button
                                    type="submit"
                                    disabled={sendingDecision}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100"
                                >
                                    {sendingDecision ? 'جاري الإرسال...' : 'إرسال الرد وتحديث الحالة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
