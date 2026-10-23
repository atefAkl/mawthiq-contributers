import React, { useState } from 'react';
import { api } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function PartnerLoginPage({ navigate }) {
    const { showToast } = useToast();
    const [mode, setMode] = useState('password'); // 'password', 'otp_request', 'otp_verify', 'reset_password'
    const [loading, setLoading] = useState(false);

    // Form fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');

    const handlePasswordLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/partner/login', { email, password });
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            localStorage.setItem('partner_applicant', JSON.stringify(res.applicant));
            showToast(res.message || 'تم تسجيل الدخول بنجاح.', 'success');
            navigate('#/partner/profile');
            window.location.reload();
        } catch (err) {
            showToast(err.message || 'فشل تسجيل الدخول. تحقق من بياناتك.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/partner/send-otp', { email });
            showToast(res.message || 'تم إرسال رمز التحقق إلى بريدك.', 'success');
            if (res.debug_otp) {
                setOtpCode(res.debug_otp);
                showToast(`رمز التحقق (بيئة التجربة): ${res.debug_otp}`, 'info');
            }
            setMode(mode === 'reset_password' ? 'reset_password_verify' : 'otp_verify');
        } catch (err) {
            showToast(err.message || 'فشل إرسال رمز التحقق.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/partner/verify-otp', { email, otp_code: otpCode });
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('user', JSON.stringify(res.user));
            localStorage.setItem('partner_applicant', JSON.stringify(res.applicant));
            showToast('تم التحقق بنجاح والدخول إلى حسابك!', 'success');
            navigate('#/partner/profile');
            window.location.reload();
        } catch (err) {
            showToast(err.message || 'رمز التحقق غير صحيح أو منتهي.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== newPasswordConfirmation) {
            showToast('كلمتا المرور غير متطابقتين.', 'warning');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/partner/reset-password', {
                email,
                otp_code: otpCode,
                password: newPassword,
                password_confirmation: newPasswordConfirmation,
            });
            showToast(res.message || 'تم تغيير كلمة المرور بنجاح!', 'success');
            setMode('password');
            setPassword(newPassword);
        } catch (err) {
            showToast(err.message || 'فشل إعادة تعيين كلمة المرور.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden" dir="rtl">
            {/* Background glowing ambient light */}
            <div className="absolute top-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
                        ⚜️
                    </div>
                    <h2 className="text-2xl font-black text-white">بوابة الشركاء والمساهمين</h2>
                    <p className="text-xs text-slate-400">منظومة موثِق للتمكين التقني والاستثماري</p>
                </div>

                {/* Mode Tabs */}
                <div className="flex bg-slate-800/80 p-1 rounded-xl text-xs font-bold text-slate-400 border border-slate-700/60">
                    <button
                        type="button"
                        onClick={() => setMode('password')}
                        className={`flex-1 py-2 rounded-lg transition-all ${
                            mode === 'password' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'hover:text-white'
                        }`}
                    >
                        كلمة المرور
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('otp_request')}
                        className={`flex-1 py-2 rounded-lg transition-all ${
                            mode.startsWith('otp') ? 'bg-amber-500 text-slate-950 shadow-xs' : 'hover:text-white'
                        }`}
                    >
                        رمز التحقق (OTP)
                    </button>
                </div>

                {/* Form 1: Password Login */}
                {mode === 'password' && (
                    <form onSubmit={handlePasswordLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full text-xs bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="text-xs font-bold text-slate-300">كلمة المرور</label>
                                <button
                                    type="button"
                                    onClick={() => setMode('reset_password')}
                                    className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                                >
                                    نسيت كلمة المرور؟
                                </button>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full text-xs bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                        </button>
                    </form>
                )}

                {/* Form 2: OTP Request */}
                {mode === 'otp_request' && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق سريع للدخول مباشرة دون الحاجة لكلمة مرور.
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full text-xs bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'جاري إرسال الرمز...' : 'إرسال رمز التحقق'}
                        </button>
                    </form>
                )}

                {/* Form 3: OTP Verify */}
                {mode === 'otp_verify' && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <p className="text-xs text-slate-400 leading-relaxed">
                            تم إرسال رمز مكون من 6 أرقام إلى ({email}). أدخله أدناه للمتابعة:
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">رمز التحقق (OTP)</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="123456"
                                className="w-full text-center tracking-widest text-lg font-mono font-black bg-slate-800/90 border border-slate-700 text-amber-400 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'جاري التحقق...' : 'تأكيد الدخول'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode('otp_request')}
                            className="w-full text-center text-xs text-slate-400 hover:text-white"
                        >
                            إعادة إرسال الرمز
                        </button>
                    </form>
                )}

                {/* Form 4: Reset Password (Send OTP) */}
                {mode === 'reset_password' && (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <h4 className="text-sm font-bold text-white">استعادة كلمة المرور</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            أدخل بريدك الإلكتروني لإرسال رمز إعادة التعيين:
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full text-xs bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'جاري الإرسال...' : 'إرسال رمز إعادة التعيين'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setMode('password')}
                            className="w-full text-center text-xs text-slate-400 hover:text-white"
                        >
                            العودة لتسجيل الدخول
                        </button>
                    </form>
                )}

                {/* Form 5: Reset Password (Verify OTP & set new pass) */}
                {mode === 'reset_password_verify' && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <h4 className="text-sm font-bold text-white">تعيين كلمة مرور جديدة</h4>
                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">رمز التحقق (OTP)</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                placeholder="123456"
                                className="w-full text-center tracking-widest text-sm font-mono font-bold bg-slate-800/90 border border-slate-700 text-amber-400 rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full text-xs bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1">تأكيد كلمة المرور الجديدة</label>
                            <input
                                type="password"
                                required
                                minLength={8}
                                value={newPasswordConfirmation}
                                onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                placeholder="••••••••"
                                className="w-full text-xs bg-slate-800/90 border border-slate-700 text-white rounded-xl px-3.5 py-2 focus:outline-none focus:border-amber-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all cursor-pointer disabled:opacity-50"
                        >
                            {loading ? 'جاري الحفظ...' : 'تأكيد وحفظ كلمة المرور'}
                        </button>
                    </form>
                )}

                {/* Footer link to admin login */}
                <div className="pt-4 border-t border-slate-800 text-center">
                    <a
                        href="#/login"
                        className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        تسجيل الدخول كعضو في إدارة المنصة
                    </a>
                </div>
            </div>
        </div>
    );
}
