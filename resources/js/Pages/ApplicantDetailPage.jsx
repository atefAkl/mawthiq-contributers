import React, { useState, useEffect } from 'react';
import AppLayout from '../layouts/AppLayout';
import PageHeader from '../components/PageHeader';
import IconButton from '../components/IconButton';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { formatRiyadhDateTime, formatRiyadhDate, formatRiyadhTime, formatUtcCalendar, RIYADH_TIMEZONE } from '../utils/date';
import InterviewReportModal from '../components/InterviewReportModal';
import InterviewAgendaModal from '../components/InterviewAgendaModal';

export default function ApplicantDetailPage({ currentRoute, navigate }) {
    const { t, isRtl } = useLanguage();
    const { hasPermission, user } = useAuth();
    const { showToast } = useToast();

    // Extract applicant ID & tab from route (e.g. #/applicants/3 or #/applicants/3?tab=interviews)
    const getTabFromRoute = (route) => {
        if (!route) return null;
        const queryIndex = route.indexOf('?');
        if (queryIndex !== -1) {
            const params = new URLSearchParams(route.substring(queryIndex));
            return params.get('tab');
        }
        return null;
    };

    const parts = currentRoute.split('/');
    const applicantId = parts[2] ? parts[2].split('?')[0] : null;

    const [applicant, setApplicant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(() => getTabFromRoute(currentRoute) || 'overview'); // overview, resume, social, portfolio, interviews, emails, timeline

    useEffect(() => {
        const tab = getTabFromRoute(currentRoute);
        if (tab) {
            setActiveTab(tab);
        }
    }, [currentRoute]);

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

    // CV & Attachments Management (إصدارات متعددة + استبدال + حذف)
    const [uploadingCv, setUploadingCv] = useState(false);
    const [cvFile, setCvFile] = useState(null);
    const [cvMode, setCvMode] = useState('new_version'); // 'new_version' | 'replace'
    const [replaceTargetId, setReplaceTargetId] = useState(null);
    const [cvNotes, setCvNotes] = useState('');
    const [deletingAttId, setDeletingAttId] = useState(null);
    const [activatingAttId, setActivatingAttId] = useState(null);
    const fileInputRef = React.useRef(null);

    // Status Change Modal
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [toStatus, setToStatus] = useState('participant');
    const [statusNote, setStatusNote] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [sendEmailNotification, setSendEmailNotification] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Scorecard Templates & Interview Management (ADR-010)
    const [scorecardTemplates, setScorecardTemplates] = useState([]);
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
        interviewer_id: '',
        scorecard_template_id: '',
        send_invitation_email: true,
    });
    const [conflictWarning, setConflictWarning] = useState(null);
    const [schedulingLoading, setSchedulingLoading] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [agendaModalOpen, setAgendaModalOpen] = useState(false);

    // Countries, Cities, and Interviewers
    const [countries, setCountries] = useState([]);
    const [cities, setCities] = useState([]);
    const [loadingCities, setLoadingCities] = useState(false);
    const [interviewers, setInterviewers] = useState([]);

    // Edit Interview Modal
    const [editInterviewModalOpen, setEditInterviewModalOpen] = useState(false);
    const [savingEditInterview, setSavingEditInterview] = useState(false);
    const [editConflictWarning, setEditConflictWarning] = useState(null);
    const [editInterviewForm, setEditInterviewForm] = useState({
        scheduled_at: '',
        interview_type: 'online',
        meeting_link: '',
        location: '',
        interviewer_id: '',
        scorecard_template_id: '',
        status: 'scheduled',
        send_update_email: true,
        force_conflict: false,
    });

    // Cancel Interview Modal
    const [cancelInterviewModalOpen, setCancelInterviewModalOpen] = useState(false);
    const [savingCancelInterview, setSavingCancelInterview] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [sendCancellationEmail, setSendCancellationEmail] = useState(true);

    const formatForDateTimeLocal = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const loadCountries = async () => {
        try {
            const res = await api.get('/countries');
            setCountries(res.data || []);
        } catch (e) {}
    };

    const loadUsers = async () => {
        try {
            const res = await api.get('/interviews/interviewers').catch(() => api.get('/users'));
            const list = res.data || res.users || res.interviewers || [];
            setInterviewers(list.filter(u => u.role?.name !== 'contributor'));
        } catch (e) {}
    };

    const loadCities = async (countryParam) => {
        if (!countryParam) {
            setCities([]);
            return;
        }
        setLoadingCities(true);
        try {
            const res = await api.get(`/countries/${encodeURIComponent(countryParam)}/cities`);
            setCities(res.data || []);
        } catch (e) {
            setCities([]);
        } finally {
            setLoadingCities(false);
        }
    };

    const openEditInterviewModal = (interview) => {
        setEditConflictWarning(null);
        setEditInterviewForm({
            scheduled_at: formatForDateTimeLocal(interview.scheduled_at),
            interview_type: interview.interview_type || 'online',
            meeting_link: interview.meeting_link || '',
            location: interview.location || '',
            interviewer_id: interview.interviewer_id || '',
            scorecard_template_id: interview.scorecard_template_id || '',
            status: interview.status || 'scheduled',
            send_update_email: true,
            force_conflict: false,
        });
        setEditInterviewModalOpen(true);
    };

    const handleSaveEditInterview = async (e, forceConflict = false) => {
        if (e) e.preventDefault();
        if (!activeInterview) return;
        setSavingEditInterview(true);
        try {
            await api.put(`/interviews/${activeInterview.id}`, {
                ...editInterviewForm,
                force_conflict: forceConflict || editInterviewForm.force_conflict,
            });
            showToast('تم تعديل موعد وبيانات المقابلة بنجاح!', 'success');
            setEditInterviewModalOpen(false);
            setEditConflictWarning(null);
            await loadApplicant();
        } catch (err) {
            if (err.has_conflict) {
                setEditConflictWarning(err.message);
            } else {
                showToast(err.message || 'فشل تعديل بيانات المقابلة.', 'error');
            }
        } finally {
            setSavingEditInterview(false);
        }
    };

    const openCancelInterviewModal = () => {
        setCancellationReason('');
        setSendCancellationEmail(true);
        setCancelInterviewModalOpen(true);
    };

    const handleConfirmCancelInterview = async () => {
        if (!activeInterview) return;
        setSavingCancelInterview(true);
        try {
            await api.put(`/interviews/${activeInterview.id}`, {
                status: 'cancelled',
                cancellation_reason: cancellationReason,
                send_cancellation_email: sendCancellationEmail,
            });
            showToast('تم إلغاء المقابلة بنجاح.', 'info');
            setCancelInterviewModalOpen(false);
            await loadApplicant();
        } catch (err) {
            showToast(err.message || 'فشل إلغاء المقابلة.', 'error');
        } finally {
            setSavingCancelInterview(false);
        }
    };

    // Google Calendar & iCalendar (.ics) integration helpers (25-min active interview unit in Riyadh Timezone)
    const getGoogleCalendarUrl = (interview, app) => {
        if (!interview || !interview.scheduled_at || !app) return '#';
        const title = encodeURIComponent(`مقابلة توظيف: ${app.full_name} (${app.position || 'مساهم'})`);
        const start = new Date(interview.scheduled_at);
        const end = new Date(start.getTime() + 25 * 60 * 1000);
        const dates = `${formatUtcCalendar(start)}/${formatUtcCalendar(end)}`;
        const details = encodeURIComponent(`مقابلة المرشح: ${app.full_name}\nرقم الطلب: ${app.application_no}\nرابط الاجتماع: ${interview.meeting_link || ''}\nنوع المقابلة: ${interview.interview_type === 'online' ? 'أونلاين' : 'حضوري'}\nالتوقيت: بتوقيت الشرق الأوسط (الرياض - GMT+3)`);
        const location = encodeURIComponent(interview.meeting_link || interview.location || 'Online');
        return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}&ctz=${RIYADH_TIMEZONE}`;
    };

    const downloadIcsFile = (interview, app) => {
        if (!interview || !interview.scheduled_at || !app) return;
        const start = new Date(interview.scheduled_at);
        const end = new Date(start.getTime() + 25 * 60 * 1000);
        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Mawthiq Contributors//Interview Scheduler//AR',
            'CALSCALE:GREGORIAN',
            'METHOD:REQUEST',
            'X-WR-TIMEZONE:Asia/Riyadh',
            'BEGIN:VTIMEZONE',
            'TZID:Asia/Riyadh',
            'BEGIN:STANDARD',
            'DTSTART:19700101T000000',
            'TZOFFSETFROM:+0300',
            'TZOFFSETTO:+0300',
            'TZNAME:AST',
            'END:STANDARD',
            'END:VTIMEZONE',
            'BEGIN:VEVENT',
            `UID:interview-${interview.id}-${Date.now()}@mawthiq.com`,
            `DTSTAMP:${formatUtcCalendar(new Date())}`,
            `DTSTART:${formatUtcCalendar(start)}`,
            `DTEND:${formatUtcCalendar(end)}`,
            `SUMMARY:مقابلة توظيف: ${app.full_name}`,
            `DESCRIPTION:مقابلة المرشح ${app.full_name} لوظيفة ${app.position || ''}\\nرابط الاجتماع: ${interview.meeting_link || ''}\\nبتوقيت الشرق الأوسط (الرياض - GMT+3)`,
            `LOCATION:${interview.meeting_link || interview.location || 'Online'}`,
            'STATUS:CONFIRMED',
            'END:VEVENT',
            'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.setAttribute('download', `interview_${app.application_no || app.id}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('تم تحميل ملف التقويم (.ics) للتنبيهات بنجاح.', 'success');
    };

    // Calculate 25-minute interview duration from scheduled start time in Riyadh Timezone
    const getInterviewDurationInfo = (scheduledAt) => {
        if (!scheduledAt) return null;
        const start = new Date(scheduledAt);
        if (isNaN(start.getTime())) return null;
        const end = new Date(start.getTime() + 25 * 60 * 1000);
        return {
            startText: formatRiyadhTime(start, isRtl),
            endText: formatRiyadhTime(end, isRtl),
            dateText: formatRiyadhDate(start, isRtl, { weekday: 'long', year: 'numeric', month: 'numeric', day: 'numeric' }),
        };
    };

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
                phone_code: app.phone_code || '+20',
                national_id: app.national_id || '',
                age: app.age || '',
                birth_date: app.birth_date || '',
                gender: app.gender || 'ذكر',
                country: app.country || 'مصر',
                city: app.city || app.governorate || '',
                governorate: app.governorate || app.city || '',
                address: app.address || '',
                marital_status: app.marital_status || 'أعزب',
                position: app.position || '',
                experience_years: app.experience_years ?? 1,
                education_level: app.education_level || '',
                cover_letter: app.cover_letter || '',
                internal_notes: app.internal_notes || '',
                rating: app.rating || 0,
                availability: (() => {
                    if (app.availability?.windows && Array.isArray(app.availability.windows) && app.availability.windows.length > 0) {
                        return app.availability;
                    }
                    if (app.availability?.preferred_days && Array.isArray(app.availability.preferred_days) && app.availability.preferred_days.length > 0) {
                        const isAll = app.availability.preferred_period === 'anytime';
                        return {
                            windows: [
                                {
                                    days: app.availability.preferred_days,
                                    all_day: isAll,
                                    from: app.availability.preferred_period === 'morning' ? '09:00' : '15:00',
                                    to: app.availability.preferred_period === 'morning' ? '13:00' : '18:00',
                                }
                            ],
                            notes: app.availability.notes || '',
                        };
                    }
                    return {
                        windows: [
                            {
                                days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                                all_day: false,
                                from: '15:00',
                                to: '18:00',
                            }
                        ],
                        notes: '',
                    };
                })(),
            });

            setSkillsList(app.skills || []);
            setSocialLinks(app.social_links || []);
            setPortfolioItems(app.portfolio_items || []);
            loadCities(app.country || 'مصر');

            // Set active interview if exists
            if (app.interviews && app.interviews.length > 0) {
                const currentInt = activeInterview
                    ? (app.interviews.find(i => i.id === activeInterview.id) || app.interviews[0])
                    : app.interviews[0];
                setActiveInterview(currentInt);
                setQuestionsList(currentInt.questions || [
                    { id: 'q_1', question: 'الخبرة العملية السابقة والمشاريع المنجزة', category: 'الخبرة', score: 8, max_score: 10, notes: '' },
                    { id: 'q_2', question: 'فهم الأساسيات والمعمارية البرمجية', category: 'المهارات الفنية', score: 9, max_score: 10, notes: '' },
                    { id: 'q_3', question: 'مهارات التواصل والتفاعل والعمل الجماعي', category: 'التواصل', score: 8, max_score: 10, notes: '' },
                    { id: 'q_4', question: 'التفرغ والجاهزية للالتزام بمواعيد التسليم', category: 'الالتزام', score: 9, max_score: 10, notes: '' },
                ]);
            } else {
                setActiveInterview(null);
                setQuestionsList([]);
            }
        } catch (e) {
            showToast('تعذر العثور على المتقدم المطلوب.', 'error');
            navigate('#/applicants');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteInterview = async (interviewId) => {
        if (!window.confirm(t('confirmDeleteInterview'))) return;
        try {
            await api.delete(`/api/interviews/${interviewId}`);
            showToast(t('interviewDeletedSuccess'), 'success');
            await loadApplicant();
        } catch (err) {
            console.error('Failed to delete interview', err);
            showToast(err.message || 'فشل حذف المقابلة', 'error');
        }
    };

    useEffect(() => {
        loadApplicant();
    }, [applicantId]);

    useEffect(() => {
        loadCountries();
        loadUsers();
        api.get('/scorecard-templates')
            .then(res => setScorecardTemplates(res.data || []))
            .catch(() => {});
    }, []);

    // Matching Slots & Interviewer Info for Scheduling Modal
    const [matchingSlots, setMatchingSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [interviewerInfo, setInterviewerInfo] = useState(null);
    const [applicantSlotInfo, setApplicantSlotInfo] = useState(null);
    const [savingAvailability, setSavingAvailability] = useState(false);

    const fetchAvailableSlots = async () => {
        if (!applicant) return;
        setLoadingSlots(true);
        try {
            const res = await api.get(`/interviews/available-slots?applicant_id=${applicant.id}`);
            setMatchingSlots(res.slots || []);
            setInterviewerInfo(res.interviewer || null);
            setApplicantSlotInfo(res.applicant || null);
        } catch (err) {
            console.error('Failed to fetch available slots:', err);
        } finally {
            setLoadingSlots(false);
        }
    };

    useEffect(() => {
        if (scheduleModalOpen && applicant) {
            fetchAvailableSlots();
        }
    }, [scheduleModalOpen, applicant?.id]);

    const daysList = [
        { key: 'Sunday', label: t('daySunday') },
        { key: 'Monday', label: t('dayMonday') },
        { key: 'Tuesday', label: t('dayTuesday') },
        { key: 'Wednesday', label: t('dayWednesday') },
        { key: 'Thursday', label: t('dayThursday') },
        { key: 'Friday', label: t('dayFriday') },
        { key: 'Saturday', label: t('daySaturday') },
    ];

    const handleAddAvailabilityWindow = () => {
        setPersonalForm(prev => {
            const currentWindows = prev.availability?.windows || [];
            return {
                ...prev,
                availability: {
                    ...(prev.availability || {}),
                    windows: [
                        ...currentWindows,
                        {
                            days: ['Sunday'],
                            all_day: false,
                            from: '15:00',
                            to: '18:00',
                        }
                    ]
                }
            };
        });
    };

    const handleRemoveAvailabilityWindow = (index) => {
        setPersonalForm(prev => {
            const currentWindows = prev.availability?.windows || [];
            return {
                ...prev,
                availability: {
                    ...(prev.availability || {}),
                    windows: currentWindows.filter((_, i) => i !== index)
                }
            };
        });
    };

    const handleToggleAvailabilityWindowDay = (winIndex, dayKey) => {
        setPersonalForm(prev => {
            const currentWindows = prev.availability?.windows || [];
            const updated = currentWindows.map((win, idx) => {
                if (idx !== winIndex) return win;
                const days = win.days || [];
                const nextDays = days.includes(dayKey)
                    ? days.filter(d => d !== dayKey)
                    : [...days, dayKey];
                return { ...win, days: nextDays };
            });
            return {
                ...prev,
                availability: {
                    ...(prev.availability || {}),
                    windows: updated
                }
            };
        });
    };

    const handleToggleAvailabilityAllDays = (winIndex) => {
        setPersonalForm(prev => {
            const currentWindows = prev.availability?.windows || [];
            const allKeys = daysList.map(d => d.key);
            const updated = currentWindows.map((win, idx) => {
                if (idx !== winIndex) return win;
                const isAll = (win.days || []).length === allKeys.length;
                return { ...win, days: isAll ? [] : allKeys };
            });
            return {
                ...prev,
                availability: {
                    ...(prev.availability || {}),
                    windows: updated
                }
            };
        });
    };

    const handleUpdateAvailabilityField = (winIndex, field, value) => {
        setPersonalForm(prev => {
            const currentWindows = prev.availability?.windows || [];
            const updated = currentWindows.map((win, idx) => {
                if (idx !== winIndex) return win;
                return { ...win, [field]: value };
            });
            return {
                ...prev,
                availability: {
                    ...(prev.availability || {}),
                    windows: updated
                }
            };
        });
    };

    // Save Personal & Professional Data
    const handleSavePersonalInfo = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        setSavingPersonal(true);
        try {
            const payload = {
                ...personalForm,
                age: personalForm.age !== '' && !isNaN(personalForm.age) ? parseInt(personalForm.age) : null,
                experience_years: personalForm.experience_years !== '' && !isNaN(personalForm.experience_years) ? parseInt(personalForm.experience_years) : 0,
                birth_date: personalForm.birth_date || null,
                rating: personalForm.rating !== '' && !isNaN(personalForm.rating) ? parseFloat(personalForm.rating) : 0,
                availability: {
                    windows: personalForm.availability?.windows || [],
                    notes: personalForm.availability?.notes || '',
                },
                skills: skillsList,
                social_links: socialLinks,
                portfolio_items: portfolioItems,
            };
            const res = await api.put(`/applicants/${applicant.id}`, payload);
            setApplicant(res.applicant);
            showToast('تم حفظ وتحديث بيانات المتقدم وأوقات التفرغ بنجاح!', 'success');
        } catch (err) {
            showToast(err.message || 'فشل تحديث البيانات.', 'error');
        } finally {
            setSavingPersonal(false);
        }
    };

    // Dedicated Save for Availability Windows Only
    const handleSaveAvailabilityOnly = async () => {
        setSavingAvailability(true);
        try {
            const payload = {
                availability: {
                    windows: personalForm.availability?.windows || [],
                    notes: personalForm.availability?.notes || '',
                }
            };
            const res = await api.patch(`/applicants/${applicant.id}/availability`, payload);
            setApplicant(res.applicant);
            showToast('تم حفظ واعتماد أوقات تفرغ المتقدم في قاعدة البيانات بنجاح!', 'success');
            fetchAvailableSlots();
        } catch (err) {
            showToast(err.message || 'فشل حفظ أوقات التفرغ.', 'error');
        } finally {
            setSavingAvailability(false);
        }
    };

    // Quick One-Click Default Availability Setup from Modal or Overview
    const handleQuickSaveDefaultAvailability = async () => {
        setLoadingSlots(true);
        try {
            const defaultWindows = [
                {
                    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                    all_day: false,
                    from: '15:00',
                    to: '18:00',
                }
            ];
            const payload = {
                availability: {
                    windows: defaultWindows,
                    notes: personalForm.availability?.notes || '',
                }
            };
            const res = await api.patch(`/applicants/${applicant.id}/availability`, payload);
            setApplicant(res.applicant);
            setPersonalForm(prev => ({
                ...prev,
                availability: res.applicant.availability,
            }));
            showToast('تم تثبيت واعتماد أوقات تفرغ المتقدم (3:00 م - 6:00 م) بنجاح!', 'success');
            await fetchAvailableSlots();
        } catch (err) {
            showToast(err.message || 'فشل حفظ أوقات التفرغ', 'error');
        } finally {
            setLoadingSlots(false);
        }
    };

    // CV Upload (New Version or Replace)
    const handleUploadCv = async (e) => {
        e.preventDefault();
        if (!cvFile) {
            showToast('يرجى اختيار ملف السيرة الذاتية أولاً.', 'warning');
            return;
        }

        setUploadingCv(true);
        const formData = new FormData();
        formData.append('resume', cvFile);
        formData.append('mode', cvMode);
        if (replaceTargetId) {
            formData.append('attachment_id', replaceTargetId);
        }
        if (cvNotes.trim()) {
            formData.append('notes', cvNotes.trim());
        }

        try {
            const res = await api.post(`/applicants/${applicant.id}/resume`, formData);
            showToast(res.message || 'تم رفع ملف السيرة الذاتية بنجاح!', 'success');
            setApplicant(res.applicant);
            setCvFile(null);
            setCvNotes('');
            setReplaceTargetId(null);
            setCvMode('new_version');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            showToast(err.message || 'فشل رفع الملف.', 'error');
        } finally {
            setUploadingCv(false);
        }
    };

    const handleActivateAttachment = async (attachmentId) => {
        setActivatingAttId(attachmentId);
        try {
            const res = await api.patch(`/applicants/${applicant.id}/resume/${attachmentId}/activate`);
            setApplicant(res.applicant);
            showToast(res.message || 'تم اعتماد هذا الإصدار بنجاح.', 'success');
        } catch (err) {
            showToast(err.message || 'فشل تفعيل الإصدار.', 'error');
        } finally {
            setActivatingAttId(null);
        }
    };

    const handleDeleteAttachment = async (attachmentId) => {
        if (!window.confirm(t('confirmDeleteAttachment'))) return;
        setDeletingAttId(attachmentId || 'current');
        try {
            const endpoint = attachmentId
                ? `/applicants/${applicant.id}/resume/${attachmentId}`
                : `/applicants/${applicant.id}/resume`;
            const res = await api.delete(endpoint);
            setApplicant(res.applicant);
            showToast(res.message || 'تم حذف المرفق بنجاح.', 'success');
        } catch (err) {
            showToast(err.message || 'فشل حذف المرفق.', 'error');
        } finally {
            setDeletingAttId(null);
        }
    };

    const startReplaceAttachment = (att) => {
        setActiveTab('resume');
        setCvMode('replace');
        setReplaceTargetId(att?.id || null);
        setCvNotes(att?.notes || '');
        setTimeout(() => {
            if (fileInputRef.current) {
                fileInputRef.current.focus();
                fileInputRef.current.click();
            }
        }, 50);
    };

    const formatBytes = (bytes) => {
        if (!bytes || bytes <= 0) return '—';
        const kb = bytes / 1024;
        if (kb < 1024) return `${Math.round(kb)} KB`;
        return `${(kb / 1024).toFixed(2)} MB`;
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

    const handleToggleChecklistItem = (questionId, itemId) => {
        setQuestionsList(prev => prev.map(q => {
            if (q.id !== questionId) return q;
            const currentChecked = Array.isArray(q.checked_items) ? q.checked_items : [];
            const isChecked = currentChecked.includes(itemId);
            const newChecked = isChecked 
                ? currentChecked.filter(id => id !== itemId)
                : [...currentChecked, itemId];

            // Auto calculate question score from checklist weights
            let newScore = q.score;
            if (Array.isArray(q.checklist_items) && q.checklist_items.length > 0) {
                let calc = 0;
                let hasExplicitWeights = false;
                q.checklist_items.forEach(it => {
                    const w = Number(it.weight) || 0;
                    if (w > 0) hasExplicitWeights = true;
                    if (newChecked.includes(it.id)) {
                        calc += w;
                    }
                });
                const max = Number(q.max_score) || 10;
                if (!hasExplicitWeights) {
                    calc = Math.round((newChecked.length / q.checklist_items.length) * max);
                }
                newScore = Math.min(max, calc);
            }

            return {
                ...q,
                checked_items: newChecked,
                score: newScore,
            };
        }));
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

        const sumScore = questionsList.reduce((acc, q) => acc + (Number(q.score) || 0), 0);
        const sumMax = questionsList.reduce((acc, q) => acc + (Number(q.max_score) || 10), 0);
        const percentage = sumMax > 0 ? Math.round((sumScore / sumMax) * 100) : 0;

        try {
            await api.post(`/interviews/${activeInterview.id}/questions`, {
                questions: questionsList,
                total_score: sumScore,
                max_score: sumMax,
                overall_percentage: percentage,
                feedback: `تم تقييم أسئلة المقابلة بنتيجة ${sumScore} من أصل ${sumMax} (${percentage}%).`,
                recommendation: percentage >= 85 ? 'strong_hire' : (percentage >= 70 ? 'hire' : (percentage >= 50 ? 'under_consideration' : 'reject')),
                status: 'completed',
            });
            showToast('تم حفظ تقييم كرت المقابلة ورصد الدرجات بنجاح!', 'success');
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
    const handleScheduleInterview = async (e, forceConflict = false) => {
        if (e) e.preventDefault();
        setSchedulingLoading(true);
        setConflictWarning(null);
        try {
            await api.post('/interviews', {
                ...scheduleForm,
                applicant_id: applicant.id,
                force_conflict: forceConflict,
            });
            showToast('تمت جدولة المقابلة بنجاح!', 'success');
            setScheduleModalOpen(false);
            setConflictWarning(null);
            loadApplicant();
        } catch (err) {
            if (err.has_conflict) {
                setConflictWarning(err.message);
            } else {
                showToast(err.message || 'فشل جدولة المقابلة.', 'error');
            }
        } finally {
            setSchedulingLoading(false);
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
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-bold text-slate-500">جاري تحميل الملف الشامل للمتقدم...</p>
                </div>
            </AppLayout>
        );
    }

    if (!applicant) return null;

    const getStatusBadge = (status) => {
        const styles = {
            applicant: 'bg-blue-50 text-blue-700 border-blue-200',
            participant: 'bg-blue-50 text-blue-700 border-blue-200',
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
                    title={`${t('applicantDetailTitle')} ${applicant.full_name}`}
                    subtitle={`${applicant.position} • ${t('applicantDetailSubtitle')}`}
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
                        tooltip={t('backToApplicants')}
                        icon="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />

                    {/* Preview / Download / Upload CV */}
                    {applicant.resume_path ? (
                        <>
                            <IconButton
                                variant="active"
                                href={applicant.resume_path}
                                target="_blank"
                                rel="noreferrer"
                                tooltip={t('previewCvTooltip')}
                                icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                            <IconButton
                                variant="success"
                                href={`${applicant.resume_path}?download=1`}
                                tooltip={t('downloadCvTooltip')}
                                icon="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </>
                    ) : (
                        <IconButton
                            onClick={() => setActiveTab('resume')}
                            tooltip={t('uploadCvTooltip')}
                            icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                    )}

                    {/* Edit Profile & Availability */}
                    {hasPermission('edit_applicants') && (
                        <IconButton
                            onClick={() => {
                                setActiveTab('overview');
                                const el = document.getElementById('personal-overview-card');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            tooltip={t('editApplicant')}
                            icon="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
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

                {/* 4 KPI Summary Cards (Matches Reference Layout Scheme ADR-005) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between">
                        <div>
                            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1.5">{t('experienceYears')}</p>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {applicant.experience_years ?? 0}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between">
                        <div>
                            <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1.5">{t('tab_files')}</p>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {applicant.attachments?.length || (applicant.resume_path ? 1 : 0)}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between">
                        <div>
                            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1.5">{t('tab_interviews')}</p>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {applicant.interviews?.length || 0}
                        </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3.5 flex items-center justify-between">
                        <div>
                            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold mt-1.5">{t('overallScore')}</p>
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {applicant.rating || 0}<span className="text-xs text-slate-400 font-normal">/5</span>
                        </div>
                    </div>
                </div>

                {/* Concise Tabs Bar (Matches Reference Filter Pills Style) */}
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                    {[
                        { id: 'overview', label: t('tab_overview') },
                        { id: 'resume', label: 'CV' },
                        { id: 'files', label: `${t('tab_files')} (${applicant.attachments?.length || (applicant.resume_path ? 1 : 0)})` },
                        { id: 'social', label: `${t('tab_social')} (${socialLinks.length})` },
                        { id: 'portfolio', label: `${t('tab_portfolio')} (${portfolioItems.length})` },
                        { id: 'interviews', label: `${t('tab_interviews')} (${applicant.interviews?.length || 0})` },
                        { id: 'emails', label: `${t('tab_emails')} (${applicant.email_logs?.length || 0})` },
                        { id: 'timeline', label: t('tab_timeline') },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3.5 py-1.5 rounded-md text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab 1: Overview & Personal Details */}
                {activeTab === 'overview' && (
                    <div id="personal-overview-card" className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">
                                    {t('tab_overview')}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {applicant.full_name} &bull; {applicant.email} &bull; {applicant.phone}
                                </p>
                            </div>
                            <button
                                onClick={handleSavePersonalInfo}
                                disabled={savingPersonal}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                            >
                                {savingPersonal ? t('saving') : t('save')}
                            </button>
                        </div>

                        <form onSubmit={handleSavePersonalInfo} className="space-y-6">
                            {/* Personal Details Section */}
                            <div>
                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                                    1. {t('tab_overview')}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('fullName')}</label>
                                        <input
                                            type="text"
                                            value={personalForm.full_name}
                                            onChange={e => setPersonalForm({ ...personalForm, full_name: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">العمر</label>
                                        <input
                                            type="number"
                                            min="15"
                                            max="90"
                                            value={personalForm.age}
                                            onChange={e => setPersonalForm({ ...personalForm, age: e.target.value })}
                                            placeholder="27"
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الميلاد</label>
                                        <input
                                            type="date"
                                            value={personalForm.birth_date}
                                            onChange={e => setPersonalForm({ ...personalForm, birth_date: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">الجنس</label>
                                        <select
                                            value={personalForm.gender}
                                            onChange={e => setPersonalForm({ ...personalForm, gender: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
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
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">الحالة الاجتماعية</label>
                                        <select
                                            value={personalForm.marital_status}
                                            onChange={e => setPersonalForm({ ...personalForm, marital_status: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
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
                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                                    2. التواصل والعنوان
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('email')}</label>
                                        <input
                                            type="email"
                                            value={personalForm.email}
                                            onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('phone')}</label>
                                        <div className="flex gap-1.5">
                                            <select
                                                value={personalForm.phone_code || '+20'}
                                                onChange={e => setPersonalForm({ ...personalForm, phone_code: e.target.value })}
                                                className="w-28 px-2 py-2 rounded-lg border border-slate-200 text-xs font-mono bg-white shrink-0"
                                            >
                                                {countries.map(c => (
                                                    <option key={c.id} value={c.phone_code}>
                                                        {c.flag_emoji} {c.phone_code}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="text"
                                                value={personalForm.phone}
                                                onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                                                className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('country')}</label>
                                        <select
                                            value={personalForm.country}
                                            onChange={e => {
                                                const newCountry = e.target.value;
                                                const countryObj = countries.find(c => c.name_ar === newCountry || c.name_en === newCountry);
                                                setPersonalForm(prev => ({
                                                    ...prev,
                                                    country: newCountry,
                                                    city: '',
                                                    governorate: '',
                                                    phone_code: countryObj?.phone_code || prev.phone_code
                                                }));
                                                loadCities(newCountry);
                                            }}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs bg-white font-semibold"
                                        >
                                            <option value="">-- {t('selectCountry')} --</option>
                                            {countries.some(c => c.is_arab) && (
                                                <optgroup label={t('allArabCountries')}>
                                                    {countries.filter(c => c.is_arab).map(c => (
                                                        <option key={c.id} value={isRtl ? c.name_ar : c.name_en}>
                                                            {c.flag_emoji} {isRtl ? c.name_ar : c.name_en}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                            {countries.some(c => !c.is_arab) && (
                                                <optgroup label={t('otherCountries')}>
                                                    {countries.filter(c => !c.is_arab).map(c => (
                                                        <option key={c.id} value={isRtl ? c.name_ar : c.name_en}>
                                                            {c.flag_emoji} {isRtl ? c.name_ar : c.name_en}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            )}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('governorate')} / {t('city')}</label>
                                        {cities.length > 0 ? (
                                            <select
                                                value={personalForm.city || personalForm.governorate || ''}
                                                onChange={e => setPersonalForm(prev => ({
                                                    ...prev,
                                                    city: e.target.value,
                                                    governorate: e.target.value,
                                                }))}
                                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs bg-white font-semibold"
                                            >
                                                <option value="">-- {t('selectCity')} --</option>
                                                {cities.map(ct => (
                                                    <option key={ct.id} value={isRtl ? ct.name_ar : ct.name_en}>
                                                        {isRtl ? ct.name_ar : ct.name_en}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                type="text"
                                                value={personalForm.city || personalForm.governorate || ''}
                                                onChange={e => setPersonalForm(prev => ({
                                                    ...prev,
                                                    city: e.target.value,
                                                    governorate: e.target.value,
                                                }))}
                                                placeholder={loadingCities ? 'جاري التحميل...' : 'المدينة أو المحافظة...'}
                                                className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs"
                                            />
                                        )}
                                    </div>
                                    <div className="sm:col-span-4">
                                        <label className="block text-xs font-bold text-slate-700 mb-1">العنوان</label>
                                        <input
                                            type="text"
                                            value={personalForm.address}
                                            onChange={e => setPersonalForm({ ...personalForm, address: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Professional & Skills Section */}
                            <div className="pt-4 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">
                                    3. المؤهل والمهارات
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('position')}</label>
                                        <input
                                            type="text"
                                            value={personalForm.position}
                                            onChange={e => setPersonalForm({ ...personalForm, position: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-800"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('experienceYears')}</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={personalForm.experience_years}
                                            onChange={e => setPersonalForm({ ...personalForm, experience_years: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">{t('educationLevel')}</label>
                                        <input
                                            type="text"
                                            value={personalForm.education_level}
                                            onChange={e => setPersonalForm({ ...personalForm, education_level: e.target.value })}
                                            className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs"
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
                                            placeholder="React, Laravel, UI/UX..."
                                            className="flex-1 px-3.5 py-2 rounded-lg border border-slate-200 text-xs"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSkill}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {skillsList.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                                            >
                                                <span>{skill}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="text-blue-400 hover:text-blue-800 font-bold"
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
                                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs leading-relaxed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('internalNotes')}</label>
                                    <textarea
                                        rows={4}
                                        value={personalForm.internal_notes}
                                        onChange={e => setPersonalForm({ ...personalForm, internal_notes: e.target.value })}
                                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs leading-relaxed bg-slate-50/50"
                                    />
                                </div>
                            </div>

                            {/* Section 4: Dynamic Multi-Rule Interview Availability */}
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2">
                                            <span>4. {t('interviewAvailability')}</span>
                                            <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full lowercase tracking-normal">
                                                توقيت الرياض (GMT+3)
                                            </span>
                                        </h4>
                                        <p className="text-[11px] text-slate-500 mt-0.5">
                                            حدد أوقات تفرغ المتقدم الأسبوعية بتوقيت الشرق الأوسط (الرياض / مكة المكرمة - GMT+3)
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleAddAvailabilityWindow}
                                        className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer"
                                    >
                                        {t('addAvailabilityRule')}
                                    </button>
                                </div>

                                {/* Availability Windows List */}
                                <div className="space-y-3">
                                    {(personalForm.availability?.windows || []).map((win, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                <span className="text-xs font-bold text-slate-700">
                                                    فترة #{idx + 1}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleAvailabilityAllDays(idx)}
                                                        className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                                                    >
                                                        {t('allDays')}
                                                    </button>
                                                    {(personalForm.availability?.windows || []).length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveAvailabilityWindow(idx)}
                                                            className="text-slate-400 hover:text-rose-600 text-xs font-bold px-2 py-0.5 cursor-pointer"
                                                            title={t('removeRule')}
                                                        >
                                                            ✕ {t('removeRule')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Days Selector Chips */}
                                            <div className="flex flex-wrap gap-1.5">
                                                {daysList.map(d => {
                                                    const isSelected = (win.days || []).includes(d.key);
                                                    return (
                                                        <button
                                                            key={d.key}
                                                            type="button"
                                                            onClick={() => handleToggleAvailabilityWindowDay(idx, d.key)}
                                                            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                                                isSelected
                                                                    ? 'bg-blue-600 text-white shadow-2xs'
                                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            {d.label} {isSelected && '✓'}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Times from/to and all day toggle */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60 items-center">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`win_allday_${idx}`}
                                                        checked={win.all_day || false}
                                                        onChange={e => handleUpdateAvailabilityField(idx, 'all_day', e.target.checked)}
                                                        className="rounded text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <label htmlFor={`win_allday_${idx}`} className="text-xs font-bold text-slate-700 cursor-pointer">
                                                        {t('allDayFlexible')}
                                                    </label>
                                                </div>

                                                {!win.all_day && (
                                                    <>
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                                {t('fromTime')} <span className="text-[10px] text-blue-600 font-normal">(بتوقيت الرياض)</span>
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={win.from || '15:00'}
                                                                onChange={e => handleUpdateAvailabilityField(idx, 'from', e.target.value)}
                                                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                                                            />
                                                        </div>

                                                        <div>
                                                            <label className="block text-[11px] font-bold text-slate-600 mb-1">
                                                                {t('toTime')} <span className="text-[10px] text-blue-600 font-normal">(بتوقيت الرياض)</span>
                                                            </label>
                                                            <input
                                                                type="time"
                                                                value={win.to || '18:00'}
                                                                onChange={e => handleUpdateAvailabilityField(idx, 'to', e.target.value)}
                                                                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white font-mono"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* General Availability Notes */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        {t('availabilityNotes')}
                                    </label>
                                    <input
                                        type="text"
                                        value={personalForm.availability?.notes || ''}
                                        onChange={e => setPersonalForm(prev => ({
                                            ...prev,
                                            availability: {
                                                ...(prev.availability || {}),
                                                notes: e.target.value,
                                            }
                                        }))}
                                        placeholder="مثال: يفضل التواصل المسبق قبل الموعد بنصف ساعة أو أي تفضيلات أخرى"
                                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 text-xs"
                                    />
                                </div>

                                {/* Section 4 Dedicated Save Action */}
                                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-blue-50/70 p-3.5 rounded-xl border border-blue-100">
                                    <div className="text-xs text-blue-900 font-medium">
                                        💡 انقر لحفظ وتثبيت أوقات التفرغ هذه للمتقدم مباشرة في قاعدة البيانات لاعتمادها في احتساب التقاطع:
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleSaveAvailabilityOnly}
                                        disabled={savingAvailability}
                                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-2xs"
                                    >
                                        <span>💾</span>
                                        <span>{savingAvailability ? t('saving') : 'حفظ أوقات التفرغ للمتقدم'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Full Form Bottom Actions Bar */}
                            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
                                <span className="text-xs text-slate-500">
                                    تأكد من حفظ التعديلات لاعتمادها في النظام والجدولة الذكية
                                </span>
                                <button
                                    type="submit"
                                    disabled={savingPersonal}
                                    className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-2xs"
                                >
                                    <span>💾</span>
                                    <span>{savingPersonal ? t('saving') : t('save')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tab 2: CV (Active CV + Ordered Upload Form ONLY — No server path, no bottom files list per ADR-007) */}
                {activeTab === 'resume' && (() => {
                    const attachmentsList = Array.isArray(applicant.attachments) && applicant.attachments.length > 0
                        ? [...applicant.attachments].sort((a, b) => (b.version || 0) - (a.version || 0))
                        : (applicant.resume_path ? [{
                            id: 'att_legacy',
                            version: 1,
                            filename: applicant.resume_path.split('/').pop(),
                            original_name: applicant.resume_path.split('/').pop(),
                            path: applicant.resume_path,
                            size: 0,
                            notes: 'النسخة الأساسية',
                            uploaded_at: applicant.updated_at || applicant.created_at,
                            is_current: true,
                            file_exists: true,
                        }] : []);
                    const currentAtt = attachmentsList.find(a => a.is_current) || attachmentsList[0] || null;

                    return (
                        <div className="bg-white rounded-lg border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-4 pb-3.5 border-b border-slate-100">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900">
                                        {t('cvSectionTitle')}
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {t('cvSectionSubtitle')}
                                    </p>
                                </div>
                                {attachmentsList.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('files')}
                                        className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
                                    >
                                        {t('tab_files')} ({attachmentsList.length})
                                    </button>
                                )}
                            </div>

                            {/* Active CV Status Banner (Without any server path exposure) */}
                            {currentAtt ? (
                                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 font-bold flex items-center justify-center shrink-0">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-bold">
                                                    v{currentAtt.version || 1} &bull; {t('activeCvBadge')}
                                                </span>
                                                <span className="font-bold text-xs text-slate-900 truncate">
                                                    {currentAtt.original_name || currentAtt.filename}
                                                </span>
                                                {currentAtt.size > 0 && (
                                                    <span className="text-[11px] text-slate-400 font-mono">
                                                        ({formatBytes(currentAtt.size)})
                                                    </span>
                                                )}
                                            </div>
                                            {currentAtt.notes && (
                                                <p className="text-xs text-slate-500 mt-1 truncate">
                                                    {currentAtt.notes}
                                                </p>
                                            )}
                                            {currentAtt.file_exists === false && (
                                                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                                                    {t('fileMissingWarning')}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <IconButton
                                            href={`${currentAtt.path}?name=${encodeURIComponent(currentAtt.original_name || currentAtt.filename || 'cv.pdf')}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            tooltip={t('previewFile')}
                                            icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                        />
                                        <IconButton
                                            href={`${currentAtt.path}?download=1&name=${encodeURIComponent(currentAtt.original_name || currentAtt.filename || 'cv.pdf')}`}
                                            tooltip={t('downloadFile')}
                                            icon="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                                    {t('noAttachmentsFound')}
                                </div>
                            )}

                            {/* Upload Form Ordered Strictly per ADR-007:
                                1. File Input -> 2. Description Input -> 3. Radio (Replace / New Version) -> 4. Save Button */}
                            <form onSubmit={handleUploadCv} className="p-4 sm:p-5 rounded-lg border border-slate-200 bg-white space-y-4">
                                {/* 1. File Input */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        1. {t('fileFieldLabel')}
                                    </label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={e => setCvFile(e.target.files[0] || null)}
                                        className="w-full text-xs text-slate-600 bg-slate-50 rounded-lg border border-slate-200 p-1.5 file:me-3 file:py-1.5 file:px-3.5 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                    />
                                </div>

                                {/* 2. Description Input */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        2. {t('fileDescriptionLabel')}
                                    </label>
                                    <input
                                        type="text"
                                        value={cvNotes}
                                        onChange={e => setCvNotes(e.target.value)}
                                        placeholder={t('fileDescriptionPlaceholder')}
                                        className="w-full px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                                    />
                                </div>

                                {/* 3. Radio Input for Upload Type (Replace vs New Version) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        3. {t('uploadTypeLabel')}
                                    </label>
                                    <div className="flex flex-wrap items-center gap-6 pt-1">
                                        <label className={`inline-flex items-center gap-2 text-xs font-semibold cursor-pointer ${attachmentsList.length === 0 ? 'opacity-40 pointer-events-none' : 'text-slate-700'}`}>
                                            <input
                                                type="radio"
                                                name="cvUploadMode"
                                                value="replace"
                                                checked={cvMode === 'replace'}
                                                disabled={attachmentsList.length === 0}
                                                onChange={() => {
                                                    setCvMode('replace');
                                                    if (!replaceTargetId && currentAtt) {
                                                        setReplaceTargetId(currentAtt.id);
                                                    }
                                                }}
                                                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                            />
                                            <span>{t('uploadModeReplace')}</span>
                                        </label>

                                        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="cvUploadMode"
                                                value="new_version"
                                                checked={cvMode === 'new_version'}
                                                onChange={() => {
                                                    setCvMode('new_version');
                                                    setReplaceTargetId(null);
                                                }}
                                                className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                            />
                                            <span>{t('uploadModeNewVersion')}</span>
                                        </label>
                                    </div>
                                </div>

                                {/* 4. Save Button */}
                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={uploadingCv || !cvFile}
                                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs disabled:opacity-50 transition-all cursor-pointer"
                                    >
                                        {uploadingCv ? t('uploadingFile') : t('saveFileBtn')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    );
                })()}

                {/* Tab 3: Files (ملفات) — Dedicated Tab for All Uploaded Files & Versions per ADR-007 */}
                {activeTab === 'files' && (() => {
                    const attachmentsList = Array.isArray(applicant.attachments) && applicant.attachments.length > 0
                        ? [...applicant.attachments].sort((a, b) => (b.version || 0) - (a.version || 0))
                        : (applicant.resume_path ? [{
                            id: 'att_legacy',
                            version: 1,
                            filename: applicant.resume_path.split('/').pop(),
                            original_name: applicant.resume_path.split('/').pop(),
                            path: applicant.resume_path,
                            size: 0,
                            notes: 'النسخة الأساسية',
                            uploaded_at: applicant.updated_at || applicant.created_at,
                            is_current: true,
                            file_exists: true,
                        }] : []);

                    return (
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
                                <div>
                                    <h3 className="font-bold text-sm text-slate-900">
                                        {t('filesTabTitle')} ({attachmentsList.length})
                                    </h3>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {t('filesTabSubtitle')}
                                    </p>
                                </div>
                                <IconButton
                                    variant="primary"
                                    onClick={() => {
                                        setCvMode('new_version');
                                        setReplaceTargetId(null);
                                        setActiveTab('resume');
                                    }}
                                    tooltip={t('uploadCvTooltip')}
                                    icon="M12 4v16m8-8H4"
                                />
                            </div>

                            {attachmentsList.length === 0 ? (
                                <div className="py-12 text-center text-xs text-slate-400">
                                    {t('noAttachmentsFound')}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-start text-xs text-slate-700">
                                        <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500">
                                            <tr>
                                                <th className="px-4 py-3 text-start"># {t('versionCol')}</th>
                                                <th className="px-4 py-3 text-start">{t('fileNameCol')}</th>
                                                <th className="px-4 py-3 text-start">{t('descriptionCol')}</th>
                                                <th className="px-4 py-3 text-start">{t('sizeCol')}</th>
                                                <th className="px-4 py-3 text-start">{t('dateCol')}</th>
                                                <th className="px-4 py-3 text-start">{t('statusCol')}</th>
                                                <th className="px-4 py-3 text-center">{t('actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {attachmentsList.map(att => (
                                                <tr key={att.id || att.version} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                                                        v{att.version || 1}
                                                    </td>
                                                    <td className="px-4 py-3 font-semibold text-slate-900">
                                                        {att.original_name || att.filename}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500">
                                                        {att.notes || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-slate-500">
                                                        {formatBytes(att.size)}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                                                        {att.uploaded_at
                                                            ? formatRiyadhDate(att.uploaded_at, isRtl, { dateStyle: 'medium' })
                                                            : '—'}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {att.is_current ? (
                                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                {t('activeCvBadge')}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                                                                v{att.version || 1}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="inline-flex items-center gap-1">
                                                            <IconButton
                                                                size="sm"
                                                                variant="ghost"
                                                                tooltipPosition="top"
                                                                href={`${att.path}?name=${encodeURIComponent(att.original_name || att.filename || 'cv.pdf')}`}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                tooltip={t('previewFile')}
                                                                icon="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                            />
                                                            <IconButton
                                                                size="sm"
                                                                variant="ghost"
                                                                tooltipPosition="top"
                                                                href={`${att.path}?download=1&name=${encodeURIComponent(att.original_name || att.filename || 'cv.pdf')}`}
                                                                tooltip={t('downloadFile')}
                                                                icon="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            />
                                                            {!att.is_current && (
                                                                <IconButton
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    tooltipPosition="top"
                                                                    disabled={activatingAttId === att.id}
                                                                    onClick={() => handleActivateAttachment(att.id)}
                                                                    tooltip={t('setAsActiveCv')}
                                                                    icon="M5 13l4 4L19 7"
                                                                />
                                                            )}
                                                            <IconButton
                                                                size="sm"
                                                                variant="ghost"
                                                                tooltipPosition="top"
                                                                onClick={() => startReplaceAttachment(att)}
                                                                tooltip={t('replaceThisFile')}
                                                                icon="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                            />
                                                            <IconButton
                                                                size="sm"
                                                                variant="ghost"
                                                                tooltipPosition="top"
                                                                disabled={deletingAttId === att.id}
                                                                onClick={() => handleDeleteAttachment(att.id)}
                                                                tooltip={t('deleteAttachment')}
                                                                className="hover:text-rose-600 hover:bg-rose-50"
                                                                icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })()}

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
                                        className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex items-center justify-between bg-white shadow-xs"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
                                                {s.platform}
                                            </span>
                                            <h4 className="font-bold text-xs text-slate-800 mt-1 truncate">
                                                {s.label || s.platform}
                                            </h4>
                                            <a
                                                href={s.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[11px] text-blue-600 hover:underline truncate block font-mono mt-0.5"
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
                            <h4 className="text-xs font-bold text-blue-700 uppercase">إضافة مشروع أو عمل جديد</h4>
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
                                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
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
                                                <div className="h-28 bg-gradient-to-tr from-slate-100 to-blue-50 flex items-center justify-center text-3xl">
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
                                                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
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
                        {/* Candidate Availability Summary Banner */}
                        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                    🗓️
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">
                                        {t('interviewAvailability')}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                        {Array.isArray(applicant.availability?.windows) && applicant.availability.windows.length > 0 ? (
                                            applicant.availability.windows.map((w, i) => (
                                                <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                                                    {(w.days || []).map(d => t(`day${d}`) || d).join(', ')}: {w.all_day ? t('allDayFlexible') : `${w.from} إلى ${w.to}`}
                                                </span>
                                            ))
                                        ) : Array.isArray(applicant.availability?.preferred_days) && applicant.availability.preferred_days.length > 0 ? (
                                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
                                                {applicant.availability.preferred_days.map(d => t(`day${d}`) || d).join(', ')}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                                                ⚠️ لم يتم حفظ أوقات تفرغ مخصصة في قاعدة البيانات بعد (انقر على &quot;تعديل&quot; لضبطها وحفظها)
                                            </span>
                                        )}
                                    </div>
                                    {applicant.availability?.notes && (
                                        <p className="text-[11px] text-slate-500 mt-1">
                                            {applicant.availability.notes}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setActiveTab('overview');
                                    const el = document.getElementById('personal-overview-card');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="px-3 py-1.5 rounded-md border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                                {t('editApplicantShort')}
                            </button>
                        </div>

                        {/* Interview Selector & Schedule New */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-100 flex items-center gap-1.5 cursor-pointer"
                            >
                                + جدولة مقابلة جديدة
                            </button>
                        </div>

                        {/* If multiple interviews exist, show selector pills */}
                        {applicant.interviews && applicant.interviews.length > 1 && (
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                <span className="text-xs font-bold text-slate-500 shrink-0">جلسات المقابلة:</span>
                                {applicant.interviews.map((intv, idx) => {
                                    const isSel = activeInterview?.id === intv.id;
                                    return (
                                        <button
                                            key={intv.id}
                                            type="button"
                                            onClick={() => {
                                                setActiveInterview(intv);
                                                setQuestionsList(intv.questions || []);
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                                                isSel
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            مقابلة {idx + 1} ({formatRiyadhDateTime(intv.scheduled_at, isRtl, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {activeInterview ? (
                            <div className="space-y-4">
                                {/* Active Interview Details & Meeting/Calendar Action Bar (ADR-010) */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                🗓️
                                            </span>
                                            <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="text-xs font-bold text-slate-900">
                                                        موعد المقابلة: {formatRiyadhDateTime(activeInterview.scheduled_at, isRtl, { dateStyle: 'full', timeStyle: 'short' })} <span className="text-[11px] text-blue-700 font-semibold">(بتوقيت الرياض)</span>
                                                    </h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                        activeInterview.status === 'completed'
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : activeInterview.status === 'cancelled'
                                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            : activeInterview.status === 'missed'
                                                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                    }`}>
                                                        {activeInterview.status === 'missed' ? t('status_missed_badge') : (t(`interview_${activeInterview.status}`) || activeInterview.status)}
                                                    </span>
                                                    {activeInterview.status === 'cancelled' && activeInterview.cancellation_reason && (
                                                        <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200">
                                                            {t('cancellationReason')}: {activeInterview.cancellation_reason}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                                                    <span>المحكّم: <strong className="text-slate-700">{activeInterview.interviewer?.name || 'غير محدد'}</strong></span>
                                                    <span>&bull;</span>
                                                    <span>النوع: <strong className="text-slate-700">{activeInterview.interview_type === 'online' ? 'عبر الإنترنت (أونلاين)' : 'حضورياً'}</strong></span>
                                                    <span>&bull;</span>
                                                    <span>المدة: <strong className="text-emerald-700">25 دقيقة نشطة</strong> (إلى {formatRiyadhTime(new Date(activeInterview.scheduled_at).getTime() + 25 * 60 * 1000, isRtl)})</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Scorecard Template Badge if attached */}
                                        {activeInterview.scorecard_template && (
                                            <div className="flex items-center gap-1.5 self-start md:self-center px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200 text-blue-800 text-xs font-bold">
                                                <span>📋</span>
                                                <span>{t('scorecardTemplate')}: {activeInterview.scorecard_template.title}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Meeting Link & Calendar Integration Row (ADR-010) */}
                                    <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {activeInterview.meeting_link && (
                                                <>
                                                    <a
                                                        href={activeInterview.meeting_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                                    >
                                                        <span>🔗</span>
                                                        <span>{t('joinMeeting')}</span>
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(activeInterview.meeting_link);
                                                            showToast(t('linkCopied'), 'info');
                                                        }}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                    >
                                                        <span>📋</span>
                                                        <span>{t('copyMeetingLink')}</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        {/* Calendar Export & Delete Action Buttons */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {activeInterview.status !== 'completed' && hasPermission('schedule_interviews') && (
                                                <button
                                                    type="button"
                                                    onClick={() => openEditInterviewModal(activeInterview)}
                                                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                >
                                                    <span>✏️</span>
                                                    <span>{t('editInterview')}</span>
                                                </button>
                                            )}
                                            {(activeInterview.status === 'scheduled' || activeInterview.status === 'missed') && hasPermission('schedule_interviews') && (
                                                <button
                                                    type="button"
                                                    onClick={openCancelInterviewModal}
                                                    className="px-2.5 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                >
                                                    <span>🚫</span>
                                                    <span>{t('cancelInterview')}</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => window.open(`/interviews/${activeInterview.id}/agenda-doc`, '_blank')}
                                                className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                                title="عرض وطباعة وثيقة أجندة اللقاء الرسمية المعتمدة (4 صفحات كاملة ومستقلة)"
                                            >
                                                <span>📄</span>
                                                <span>أجندة اللقاء (PDF)</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => window.open(`/interviews/${activeInterview.id}/report-doc`, '_blank')}
                                                className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                                title="عرض التقرير التنفيذي والشهادة الملكية بالذكاء الاصطناعي (صفحة مستقلة للطباعة)"
                                            >
                                                <span>⚜️</span>
                                                <span>تقرير التقييم والشهادة الملكية (AI)</span>
                                            </button>
                                            <a
                                                href={getGoogleCalendarUrl(activeInterview, applicant)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                title="إضافة موعد المقابلة إلى تقويم Google"
                                            >
                                                <span>📅</span>
                                                <span>{t('addToGoogleCalendar')}</span>
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => downloadIcsFile(activeInterview, applicant)}
                                                className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                                title="تنزيل ملف .ics للتنبيهات على الهاتف و Outlook"
                                            >
                                                <span>📥</span>
                                                <span>{t('downloadIcsCalendar')}</span>
                                            </button>
                                            {hasPermission('delete_interviews') && (
                                                <IconButton
                                                    variant="ghost"
                                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                    onClick={() => handleDeleteInterview(activeInterview.id)}
                                                    tooltip={t('deleteInterview')}
                                                    icon="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left 2 cols: Questions Scorecard */}
                                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
                                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-sm text-slate-800">
                                                    أسئلة التقييم المخصصة للمقابلة
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                                                    {questionsList.length} محاور
                                                </span>
                                            </div>

                                            <button
                                                onClick={handleSaveInterviewScorecard}
                                                disabled={savingQuestions}
                                                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-100 disabled:opacity-50 cursor-pointer"
                                            >
                                                {savingQuestions ? 'جاري الحفظ...' : '💾 ' + t('saveScorecardEvaluation')}
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
                                                <option value="المهارات الفنية">فني وتقني</option>
                                                <option value="الخبرة السابقة">خبرة سابقة</option>
                                                <option value="التواصل والعمل الجماعي">تواصل وذكاء اجتماعي</option>
                                                <option value="حل المشكلات">حل المشكلات</option>
                                                <option value="الالتزام والانضباط">الالتزام والانضباط</option>
                                            </select>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer"
                                            >
                                                + إضافة سؤال
                                            </button>
                                        </form>

                                        {/* Questions List with rating sliders & expected model answers */}
                                        <div className="space-y-4">
                                            {questionsList.map((q, idx) => {
                                                const maxScore = Number(q.max_score) || 10;
                                                return (
                                                    <div
                                                        key={q.id || idx}
                                                        className="p-4 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all bg-white shadow-xs space-y-3"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                                                                    {idx + 1}
                                                                </span>
                                                                <h5 className="font-bold text-xs text-slate-800">
                                                                    {q.question}
                                                                </h5>
                                                                {q.category && (
                                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                                                        {q.category}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveQuestion(q.id)}
                                                                className="text-slate-300 hover:text-rose-600 text-sm cursor-pointer"
                                                                title="حذف هذا السؤال"
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>

                                                        {/* Expected Answer Structure Guide for Interviewer (ADR-010) */}
                                                        {q.expected_answer && (
                                                            <div className="text-[11px] bg-blue-50/60 border border-blue-100 text-blue-900 p-2.5 rounded-xl leading-relaxed">
                                                                <span className="font-bold text-blue-800 block mb-0.5">
                                                                    💡 {t('expectedAnswer')}:
                                                                </span>
                                                                <div
                                                                    className="prose prose-xs max-w-none text-blue-900 leading-relaxed [&_h3]:font-bold [&_h3]:text-blue-950 [&_h4]:font-bold [&_h4]:text-blue-900 [&_ul]:list-disc [&_ul]:ps-4 [&_ol]:list-decimal [&_ol]:ps-4"
                                                                    dangerouslySetInnerHTML={{ __html: q.expected_answer }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Weakness Indicators & Red Flags Guide (ADR-010) */}
                                                        {q.answer_weaknesses && (
                                                            <div className="text-[11px] bg-rose-50/60 border border-rose-100 text-rose-900 p-2.5 rounded-xl leading-relaxed">
                                                                <span className="font-bold text-rose-800 block mb-0.5">
                                                                    ⚠️ {t('answerWeaknesses')}:
                                                                </span>
                                                                <div
                                                                    className="prose prose-xs max-w-none text-rose-900 leading-relaxed [&_h3]:font-bold [&_h3]:text-rose-950 [&_h4]:font-bold [&_h4]:text-rose-900 [&_ul]:list-disc [&_ul]:ps-4 [&_ol]:list-decimal [&_ol]:ps-4"
                                                                    dangerouslySetInnerHTML={{ __html: q.answer_weaknesses }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Interactive Checklist Items for Evaluation */}
                                                        {Array.isArray(q.checklist_items) && q.checklist_items.length > 0 && (
                                                            <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-3 space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
                                                                        <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">☑️</span>
                                                                        <span>عناصر الإجابة القوية (حدد ما تضمنته إجابة المرشح):</span>
                                                                    </span>
                                                                    <span className="text-[10px] font-bold text-emerald-700 font-mono">
                                                                        {Array.isArray(q.checked_items) ? q.checked_items.length : 0} من {q.checklist_items.length} محقق
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                    {q.checklist_items.map((item, itemIdx) => {
                                                                        const isChecked = Array.isArray(q.checked_items) && q.checked_items.includes(item.id);
                                                                        return (
                                                                            <label
                                                                                key={item.id || itemIdx}
                                                                                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-all select-none ${
                                                                                    isChecked
                                                                                        ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-semibold shadow-2xs'
                                                                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                                                                                }`}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isChecked}
                                                                                    onChange={() => handleToggleChecklistItem(q.id, item.id)}
                                                                                    className="mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                                                />
                                                                                <span className="flex-1 leading-snug">{item.text}</span>
                                                                                <span className="text-[10px] font-mono text-emerald-700 font-bold shrink-0 bg-emerald-50 px-1 rounded">
                                                                                    +{item.weight}
                                                                                </span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Score Slider & Direct Input */}
                                                        <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl">
                                                            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{t('interviewerScore')}:</span>
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max={maxScore}
                                                                step="1"
                                                                value={q.score ?? 0}
                                                                onChange={e => handleUpdateQuestionScore(q.id, e.target.value)}
                                                                className="flex-1 accent-blue-600 cursor-pointer"
                                                            />
                                                            <div className="flex items-center gap-1 font-mono font-black text-blue-700 text-xs min-w-[55px] text-end">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={maxScore}
                                                                    value={q.score ?? 0}
                                                                    onChange={e => handleUpdateQuestionScore(q.id, e.target.value)}
                                                                    className="w-12 text-center text-xs font-bold bg-white border border-slate-300 rounded px-1 py-0.5"
                                                                />
                                                                <span>/ {maxScore}</span>
                                                            </div>
                                                        </div>

                                                        {/* Notes */}
                                                        <input
                                                            type="text"
                                                            value={q.notes || ''}
                                                            onChange={e => handleUpdateQuestionNotes(q.id, e.target.value)}
                                                            placeholder={t('interviewerNotes')}
                                                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-[11px] text-slate-600 placeholder-slate-400 bg-white"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Right 1 col: Interview Summary & Decision Email Composer */}
                                    <div className="space-y-6">
                                        {/* Overall Score Summary */}
                                        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs text-center">
                                            <span className="text-xs font-bold text-slate-400 block mb-1">
                                                المجموع الكلي ونسبة التقييم
                                            </span>
                                            {(() => {
                                                const totalGiven = questionsList.reduce((acc, q) => acc + (Number(q.score) || 0), 0);
                                                const totalPossible = questionsList.reduce((acc, q) => acc + (Number(q.max_score) || 10), 0);
                                                const pct = totalPossible > 0 ? Math.round((totalGiven / totalPossible) * 100) : 0;
                                                return (
                                                    <>
                                                        <div className="text-4xl font-black text-blue-700 my-2 font-mono">
                                                            {totalGiven} <span className="text-sm font-normal text-slate-400">/ {totalPossible}</span>
                                                        </div>
                                                        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-4">
                                                            النسبة الإجمالية: {pct}%
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 mb-6">
                                                            تم احتساب المجموع التلقائي لـ {questionsList.length} محاور تقييمية.
                                                        </p>
                                                    </>
                                                );
                                            })()}

                                            {/* Decision Actions (الرد على المتقدم بالرد المناسب) */}
                                            <h4 className="text-xs font-black text-slate-800 mb-3 text-start">
                                                اتخاذ القرار وإرسال الرد المناسب للمتقدم:
                                            </h4>
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => openDecisionEmailModal('accepted')}
                                                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-between cursor-pointer"
                                                >
                                                    <span>🎉 إرسال خطاب القبول والاعتماد</span>
                                                    <span>&rarr;</span>
                                                </button>
                                                <button
                                                    onClick={() => openDecisionEmailModal('probation')}
                                                    className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-between cursor-pointer"
                                                >
                                                    <span>⏳ إرسال تكليف مرحلة الاختبار</span>
                                                    <span>&rarr;</span>
                                                </button>
                                                <button
                                                    onClick={() => openDecisionEmailModal('rejected')}
                                                    className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
                                                >
                                                    <span>✉️ إرسال خطاب اعتذار مع الملاحظات</span>
                                                    <span>&rarr;</span>
                                                </button>
                                            </div>
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
                                                    : 'bg-blue-50/40 border-blue-200 ms-6 me-0'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        isReceived ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {isReceived ? '📥 رسالة واردة من المتقدم' : '📤 رسالة صادرة من الإدارة'}
                                                    </span>
                                                    <span className="font-bold text-xs text-slate-800">
                                                        {log.subject}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {formatRiyadhDateTime(log.created_at, isRtl)}
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
                                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-100 transition-all disabled:opacity-50"
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

                        <div className="border-s-2 border-blue-200 ms-4 ps-6 space-y-6 text-xs">
                            {applicant.status_logs?.map((log, idx) => (
                                <div key={idx} className="relative">
                                    <div className="absolute -start-[31px] top-1 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-xs"></div>
                                    <h4 className="font-bold text-slate-800 text-xs">
                                        {log.notes || `تم تغيير الحالة إلى ${t(`status_${log.to_status}`)}`}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        المسؤول: {log.changed_by_user?.name || 'النظام'} &bull; {formatRiyadhDateTime(log.created_at, isRtl)}
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
                                <button type="submit" disabled={updatingStatus} className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
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
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div>
                                <h3 className="font-bold text-sm text-slate-800">{t('scheduleInterview')}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{applicant.full_name} &bull; {applicant.position}</p>
                            </div>
                            <button
                                onClick={() => {
                                    setScheduleModalOpen(false);
                                    setConflictWarning(null);
                                }}
                                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {/* Reference Box: Weekly Availability & Duty Hours */}
                        <div className="mb-4 p-4 rounded-2xl border border-blue-200/80 bg-gradient-to-b from-blue-50/70 to-slate-50 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                                    <span>⚡</span> {t('candidateAvailabilitySummary')} و {t('interviewerDutyHours')}
                                </span>
                                <span className="text-[10px] text-blue-800 bg-blue-100 font-semibold px-2.5 py-0.5 rounded-full">
                                    مرجع أسبوعي دوري (بتوقيت الرياض - GMT+3)
                                </span>
                            </div>

                            {/* Candidate Availability & Duty Hours Chips */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                                    <span className="font-bold text-slate-700 block">
                                        👤 {t('candidateAvailabilitySummary')}:
                                    </span>
                                    {(() => {
                                        const windows = (applicantSlotInfo?.windows && applicantSlotInfo.windows.length > 0)
                                            ? applicantSlotInfo.windows
                                            : (Array.isArray(applicant.availability?.windows) && applicant.availability.windows.length > 0
                                                ? applicant.availability.windows
                                                : []);

                                        if (windows.length > 0) {
                                            return windows.map((w, i) => (
                                                <div key={i} className="text-slate-600 font-medium text-[11px]">
                                                    &bull; {(w.days || []).map(d => t(`day${d}`) || d).join(', ')}:{' '}
                                                    <span className="font-bold text-blue-700">
                                                        {w.all_day ? t('allDayFlexible') : `${w.from} إلى ${w.to}`}
                                                    </span>
                                                </div>
                                            ));
                                        }

                                        return (
                                            <div className="space-y-1.5 pt-0.5">
                                                <div className="text-amber-700 font-semibold text-[10px] bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                                                    ⚠️ أوقات التفرغ غير محفوظة في قاعدة البيانات للمتقدم بعد.
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleQuickSaveDefaultAvailability}
                                                    disabled={loadingSlots}
                                                    className="w-full py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                                                >
                                                    <span>⚡</span>
                                                    <span>تثبيت تفرغ المتقدم (3:00 م - 6:00 م بتوقيت الرياض)</span>
                                                </button>
                                            </div>
                                        );
                                    })()}
                                    {(applicantSlotInfo?.notes || applicant.availability?.notes) && (
                                        <div className="text-slate-400 italic text-[10px] mt-0.5">
                                            &ldquo;{applicantSlotInfo?.notes || applicant.availability.notes}&rdquo;
                                        </div>
                                    )}
                                </div>

                                <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
                                    <span className="font-bold text-slate-700 block">
                                        ⏱️ {t('interviewerDutyHours')}:
                                    </span>
                                    {interviewerInfo?.working_hours && Array.isArray(interviewerInfo.working_hours) ? (
                                        interviewerInfo.working_hours.map((w, i) => (
                                            <div key={i} className="text-slate-600 font-medium">
                                                &bull; {(w.days || []).map(d => t(`day${d}`) || d).join(', ')}:{' '}
                                                <span className="font-bold text-emerald-700">
                                                    {w.all_day ? t('allDayFlexible') : `${w.from} إلى ${w.to}`}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-slate-500">الأحد - الخميس (09:00 ص - 05:00 م)</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Conflict Warning Alert Box */}
                        {conflictWarning && (
                            <div className="mb-4 p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 space-y-2 animate-in fade-in">
                                <div className="flex items-center gap-2 font-bold text-xs">
                                    <span>⚠️</span> {t('conflictWarning')}
                                </div>
                                <p className="text-xs leading-relaxed">
                                    {conflictWarning}
                                </p>
                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        disabled={schedulingLoading}
                                        onClick={(e) => handleScheduleInterview(e, true)}
                                        className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                                    >
                                        {schedulingLoading ? t('loading') : t('forceSchedule')}
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleScheduleInterview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('scheduledAt')} *
                                    <span className="text-[11px] font-semibold text-blue-700 ms-1.5">
                                        (بتوقيت الشرق الأوسط / الرياض - GMT+3)
                                    </span>
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={scheduleForm.scheduled_at}
                                    onChange={e => {
                                        setScheduleForm({ ...scheduleForm, scheduled_at: e.target.value });
                                        if (conflictWarning) setConflictWarning(null);
                                    }}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />

                                {/* Auto-Calculated 25-Minute Interview Window Box */}
                                {scheduleForm.scheduled_at && (() => {
                                    const info = getInterviewDurationInfo(scheduleForm.scheduled_at);
                                    if (!info) return null;
                                    return (
                                        <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base">⏱️</span>
                                                <div>
                                                    <span className="font-bold">فترة المقابلة المحسوبة (بتوقيت الرياض):</span>
                                                    <span className="mx-1.5 font-black text-emerald-800 text-[13px]">
                                                        من {info.startText} إلى {info.endText}
                                                    </span>
                                                    <span className="text-slate-600 text-[11px] block sm:inline">
                                                        ({info.dateText})
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] bg-emerald-200/80 text-emerald-950 font-black px-2.5 py-1 rounded-md shrink-0">
                                                25 دقيقة نشطة
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('assignedInterviewer')}</label>
                                    <select
                                        value={scheduleForm.interviewer_id || ''}
                                        onChange={e => setScheduleForm({ ...scheduleForm, interviewer_id: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                                    >
                                        <option value="">-- {t('assignedInterviewer')} --</option>
                                        {interviewers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} {u.role ? `(${u.role.display_name_ar ? u.role.display_name_ar.split('(')[0].trim() : (u.role.display_name_en || u.role.name)})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Scorecard Template Selector (ADR-010) */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('scorecardTemplate')}
                                </label>
                                <select
                                    value={scheduleForm.scorecard_template_id || ''}
                                    onChange={e => setScheduleForm({ ...scheduleForm, scorecard_template_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                                >
                                    <option value="">-- {t('noTemplate')} --</option>
                                    {scorecardTemplates.map(tpl => (
                                        <option key={tpl.id} value={tpl.id}>
                                            {tpl.title} ({tpl.position || 'عام'}) - {tpl.total_max_score} درجة
                                        </option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-slate-400 mt-1">
                                    عند اختيار كرت تقييم، سيتم تحميل محاور وأسئلة التقييم وهيكل الإجابة المتوقعة تلقائياً في المقابلة.
                                </p>
                            </div>

                            {/* Meeting Link for Online Interviews */}
                            {scheduleForm.interview_type === 'online' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        رابط المقابلة (Google Meet / Zoom)
                                    </label>
                                    <input
                                        type="url"
                                        value={scheduleForm.meeting_link || ''}
                                        onChange={e => setScheduleForm({ ...scheduleForm, meeting_link: e.target.value })}
                                        placeholder="https://meet.google.com/... (يتم توليده تلقائياً إذا تُرك فارغاً)"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">
                                        سيتم إدراج الرابط في دعوة البريد وإتاحته فوراً للانضمام وتصديره للتقويم.
                                    </p>
                                </div>
                            )}

                            {/* Send Invitation Email Checkbox */}
                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="send_invitation_email"
                                    checked={scheduleForm.send_invitation_email}
                                    onChange={e => setScheduleForm({ ...scheduleForm, send_invitation_email: e.target.checked })}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="send_invitation_email" className="text-xs font-bold text-slate-700 cursor-pointer">
                                    {t('sendNotificationEmail')}
                                </label>
                            </div>

                            <div className="pt-2 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setScheduleModalOpen(false);
                                        setConflictWarning(null);
                                    }}
                                    className="px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={schedulingLoading}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold cursor-pointer"
                                >
                                    {schedulingLoading ? t('loading') : 'تأكيد الجدولة'}
                                </button>
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
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100"
                                >
                                    {sendingDecision ? 'جاري الإرسال...' : 'إرسال الرد وتحديث الحالة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Interview */}
            {editInterviewModalOpen && activeInterview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <div>
                                <h3 className="font-bold text-sm text-slate-900">
                                    {t('editInterview')}
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                    {applicant.full_name} &bull; {applicant.position}
                                </p>
                            </div>
                            <button
                                onClick={() => setEditInterviewModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        {editConflictWarning && (
                            <div className="mb-4 p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs space-y-2">
                                <div className="flex items-center gap-1.5 font-bold">
                                    <span>⚠️</span> {t('conflictWarning')}
                                </div>
                                <p className="leading-relaxed">{editConflictWarning}</p>
                                <div className="pt-1 flex justify-end">
                                    <button
                                        type="button"
                                        disabled={savingEditInterview}
                                        onClick={(e) => handleSaveEditInterview(e, true)}
                                        className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
                                    >
                                        {savingEditInterview ? t('saving') : t('forceSchedule')}
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSaveEditInterview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('scheduledAt')} * <span className="text-[10px] text-blue-600 font-normal">(بتوقيت الرياض - GMT+3)</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={editInterviewForm.scheduled_at}
                                    onChange={e => {
                                        setEditInterviewForm({ ...editInterviewForm, scheduled_at: e.target.value });
                                        if (editConflictWarning) setEditConflictWarning(null);
                                    }}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                />

                                {editInterviewForm.scheduled_at && (() => {
                                    const info = getInterviewDurationInfo(editInterviewForm.scheduled_at);
                                    if (!info) return null;
                                    return (
                                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span>⏱️</span>
                                                <span>من <strong className="font-mono text-emerald-800">{info.startText}</strong> إلى <strong className="font-mono text-emerald-800">{info.endText}</strong></span>
                                            </div>
                                            <span className="text-[10px] bg-emerald-200/80 text-emerald-950 font-bold px-2 py-0.5 rounded">
                                                25 دقيقة نشطة
                                            </span>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('interviewType')}</label>
                                    <select
                                        value={editInterviewForm.interview_type}
                                        onChange={e => setEditInterviewForm({ ...editInterviewForm, interview_type: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                                    >
                                        <option value="online">{t('interviewType_online')}</option>
                                        <option value="in_person">{t('interviewType_in_person')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">{t('assignedInterviewer')}</label>
                                    <select
                                        value={editInterviewForm.interviewer_id}
                                        onChange={e => setEditInterviewForm({ ...editInterviewForm, interviewer_id: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                                    >
                                        <option value="">-- {t('assignedInterviewer')} --</option>
                                        {interviewers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} {u.role ? `(${u.role.display_name_ar ? u.role.display_name_ar.split('(')[0].trim() : (u.role.display_name_en || u.role.name)})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">{t('scorecardTemplate')}</label>
                                <select
                                    value={editInterviewForm.scorecard_template_id}
                                    onChange={e => setEditInterviewForm({ ...editInterviewForm, scorecard_template_id: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold"
                                >
                                    <option value="">-- {t('noTemplate')} --</option>
                                    {scorecardTemplates.map(tpl => (
                                        <option key={tpl.id} value={tpl.id}>
                                            {tpl.title} ({tpl.position || 'عام'}) - {tpl.total_max_score} درجة
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {editInterviewForm.interview_type === 'online' ? (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        رابط المقابلة (Meeting Link)
                                    </label>
                                    <input
                                        type="url"
                                        value={editInterviewForm.meeting_link}
                                        onChange={e => setEditInterviewForm({ ...editInterviewForm, meeting_link: e.target.value })}
                                        placeholder="https://meet.google.com/..."
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        مقر المقابلة (Location)
                                    </label>
                                    <input
                                        type="text"
                                        value={editInterviewForm.location}
                                        onChange={e => setEditInterviewForm({ ...editInterviewForm, location: e.target.value })}
                                        placeholder="اسم القاعة أو المقر..."
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="detail_edit_send_update_email"
                                    checked={editInterviewForm.send_update_email}
                                    onChange={e => setEditInterviewForm({ ...editInterviewForm, send_update_email: e.target.checked })}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="detail_edit_send_update_email" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    {t('sendUpdateEmail')}
                                </label>
                            </div>

                            <div className="pt-3 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setEditInterviewModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEditInterview}
                                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                                >
                                    {savingEditInterview ? t('saving') : t('save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Cancel Interview */}
            {cancelInterviewModalOpen && activeInterview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 my-8">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                            <h3 className="font-bold text-sm text-slate-900">
                                {t('cancelInterview')}
                            </h3>
                            <button
                                onClick={() => setCancelInterviewModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                            <p className="font-bold">{applicant.full_name}</p>
                            <p className="text-[11px] mt-0.5">{applicant.position}</p>
                            <p className="text-[11px] text-amber-700 mt-1">
                                هل أنت متأكد من رغبتك في إلغاء هذه المقابلة؟
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    {t('cancellationReason')}
                                </label>
                                <textarea
                                    rows={3}
                                    value={cancellationReason}
                                    onChange={e => setCancellationReason(e.target.value)}
                                    placeholder="اكتب سبب الإلغاء إن وجد (اختياري)..."
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs leading-relaxed"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="detail_cancel_send_email"
                                    checked={sendCancellationEmail}
                                    onChange={e => setSendCancellationEmail(e.target.checked)}
                                    className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                                />
                                <label htmlFor="detail_cancel_send_email" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    {t('sendCancellationEmail')}
                                </label>
                            </div>

                            <div className="pt-3 flex gap-2 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setCancelInterviewModalOpen(false)}
                                    className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    type="button"
                                    disabled={savingCancelInterview}
                                    onClick={handleConfirmCancelInterview}
                                    className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                                >
                                    {savingCancelInterview ? t('saving') : t('cancelInterview')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Executive Report & Royal Certificate Modal */}
            <InterviewReportModal
                isOpen={reportModalOpen}
                interviewId={activeInterview?.id}
                onClose={() => setReportModalOpen(false)}
            />

            {/* 4-Page Meeting Agenda Modal */}
            <InterviewAgendaModal
                isOpen={agendaModalOpen}
                interviewId={activeInterview?.id}
                onClose={() => setAgendaModalOpen(false)}
            />
        </AppLayout>
    );
}
