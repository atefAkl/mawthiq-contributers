/**
 * Date & Time Utilities for Middle East (Asia/Riyadh - GMT+3)
 */

export const RIYADH_TIMEZONE = 'Asia/Riyadh';

/**
 * Format date and time in Riyadh timezone (Asia/Riyadh).
 *
 * @param {string|Date|number} value
 * @param {boolean} isRtl
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export function formatRiyadhDateTime(value, isRtl = true, options = {}) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const locale = isRtl ? 'ar-SA-u-nu-latn' : 'en-US';
    return date.toLocaleString(locale, {
        timeZone: RIYADH_TIMEZONE,
        ...options,
    });
}

/**
 * Format date only in Riyadh timezone (Asia/Riyadh).
 *
 * @param {string|Date|number} value
 * @param {boolean} isRtl
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export function formatRiyadhDate(value, isRtl = true, options = {}) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const locale = isRtl ? 'ar-SA-u-nu-latn' : 'en-US';
    return date.toLocaleDateString(locale, {
        timeZone: RIYADH_TIMEZONE,
        ...options,
    });
}

/**
 * Format time only in Riyadh timezone (Asia/Riyadh).
 *
 * @param {string|Date|number} value
 * @param {boolean} isRtl
 * @param {Intl.DateTimeFormatOptions} options
 * @returns {string}
 */
export function formatRiyadhTime(value, isRtl = true, options = {}) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return '';

    const locale = isRtl ? 'ar-SA-u-nu-latn' : 'en-US';
    return date.toLocaleTimeString(locale, {
        timeZone: RIYADH_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        ...options,
    });
}

/**
 * Format a Date object into UTC string for Calendar invites (Google Calendar & iCal .ics).
 * Format: YYYYMMDDTHHmmssZ
 *
 * @param {Date} d
 * @returns {string}
 */
export function formatUtcCalendar(d) {
    if (!d || isNaN(d.getTime())) return '';
    return d.toISOString().replace(/-|:|\.\d\d\d/g, "");
}
