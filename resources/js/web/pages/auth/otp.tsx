import { Button } from '@/components/ui/button';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { AuthShell } from '../../components/auth-shell';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 59;

function formatCountdown(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

interface OtpProps {
    target?: string | null;
    email?: string | null;
    country_code?: string | null;
    mobile?: string | null;
}

export default function Otp({ target, email, country_code, mobile }: OtpProps) {
    const { data, setData, post, processing, errors } = useForm({
        email: email ?? '',
        country_code: country_code ?? '',
        mobile: mobile ?? '',
        code: '',
    });

    // Keep form state in sync if the props update (e.g. after a back-redirect).
    useEffect(() => {
        setData((current) => ({
            ...current,
            email: email ?? '',
            country_code: country_code ?? '',
            mobile: mobile ?? '',
        }));
    }, [email, country_code, mobile, setData]);

    const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [resendIn, setResendIn] = useState(RESEND_SECONDS);

    useEffect(() => {
        if (resendIn <= 0) return;
        const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
        return () => clearTimeout(timer);
    }, [resendIn]);

    const handleChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);
        setData('code', next.join(''));
        if (digit && index < OTP_LENGTH - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const submit: React.FormEventHandler = (e) => {
        e.preventDefault();
        post(route('otp.verify'));
    };

    return (
        <AuthShell>
            <Head title="Verify your number" />

            <h1 className="text-2xl font-bold tracking-tight">Verify Your Number</h1>
            <p className="mt-2 text-sm text-muted-foreground">
                Enter the 4-digit code sent to{' '}
                <span className="font-medium text-foreground">{target ?? '+44 7700 900XXX'}</span>
            </p>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div className="flex justify-center gap-3">
                    {digits.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => {
                                inputsRef.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            className="size-12 rounded-lg border border-input bg-background text-center text-xl font-semibold focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    ))}
                </div>
                {errors.code && <p className="text-center text-sm text-destructive">{errors.code}</p>}
                {(errors.email || errors.mobile) && (
                    <p className="text-center text-sm text-destructive">
                        {errors.email ?? errors.mobile}
                    </p>
                )}

                <Button
                    type="submit"
                    size="lg"
                    className="w-full uppercase tracking-wide"
                    disabled={processing || data.code.length < OTP_LENGTH}
                >
                    Verify & Continue
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Didn't receive code?{' '}
                {resendIn > 0 ? (
                    <span className="font-medium text-primary">Resend Code ({formatCountdown(resendIn)})</span>
                ) : (
                    <button
                        type="button"
                        onClick={() => setResendIn(RESEND_SECONDS)}
                        className="font-medium text-primary hover:underline"
                    >
                        Resend Code
                    </button>
                )}
            </p>
        </AuthShell>
    );
}
