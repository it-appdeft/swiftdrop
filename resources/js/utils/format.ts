/**
 * Locale-aware formatters used across the dashboard. Centralized so number,
 * currency, and date formatting stay consistent in tables, KPIs, and toasts.
 */

const numberFormatter = new Intl.NumberFormat('en-US');
const compactFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 });

export const formatNumber = (value: number) => numberFormatter.format(value);

export const formatCompact = (value: number) => compactFormatter.format(value);

export const formatPercent = (value: number) => percentFormatter.format(value);

export const formatCurrency = (value: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
    }).format(value);

export const formatDate = (value: Date | string, options?: Intl.DateTimeFormatOptions) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options,
    }).format(date);
};

export const formatRelative = (value: Date | string) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    const diff = (Date.now() - date.getTime()) / 1000;
    const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

    const ranges: [number, Intl.RelativeTimeFormatUnit][] = [
        [60, 'second'],
        [3600, 'minute'],
        [86400, 'hour'],
        [604800, 'day'],
        [2629800, 'week'],
        [31557600, 'month'],
        [Number.POSITIVE_INFINITY, 'year'],
    ];

    let elapsed = diff;
    for (const [limit, unit] of ranges) {
        if (Math.abs(elapsed) < limit) {
            const divisor = unit === 'second' ? 1 : unit === 'minute' ? 60 : unit === 'hour' ? 3600 : unit === 'day' ? 86400 : unit === 'week' ? 604800 : unit === 'month' ? 2629800 : 31557600;
            return rtf.format(-Math.round(elapsed / (divisor / (unit === 'second' ? 1 : 1))), unit);
        }
    }
    return rtf.format(-Math.round(elapsed / 31557600), 'year');
};

export const initials = (name: string, max = 2) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, max)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
