/**
 * Design tokens — TypeScript mirror of the CSS custom properties defined in
 * resources/css/app.css. Use these when you need token values inside JS
 * (charts, inline styles, etc.) so the source of truth stays consistent.
 *
 * Visual values live in CSS; do not duplicate raw color literals here.
 */

export const radii = {
    xs: 'rounded-[2px]',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
} as const;

export const shadows = {
    none: 'shadow-none',
    xs: 'shadow-xs',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
} as const;

export const semanticColors = [
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'info',
    'muted',
] as const;

export type SemanticColor = (typeof semanticColors)[number];

export const typography = {
    displayLg: 'text-4xl font-semibold tracking-tight',
    displayMd: 'text-3xl font-semibold tracking-tight',
    displaySm: 'text-2xl font-semibold tracking-tight',
    h1: 'text-2xl font-semibold tracking-tight',
    h2: 'text-xl font-semibold tracking-tight',
    h3: 'text-lg font-semibold',
    body: 'text-sm leading-6',
    bodyLg: 'text-base leading-7',
    caption: 'text-xs text-muted-foreground',
    overline: 'text-xs font-medium uppercase tracking-wider text-muted-foreground',
} as const;

/**
 * Chart palette — references the CSS chart-* tokens. Useful when feeding
 * external charting libraries that need raw color strings.
 */
export const chartPalette = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
] as const;
