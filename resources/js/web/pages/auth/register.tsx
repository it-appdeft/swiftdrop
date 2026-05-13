import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AuthShell } from '../../components/auth-shell';

interface RegisterProps {
    role: 'customer' | 'restaurant';
}

const OTP_LENGTH = 4;
const RESEND_SECONDS = 55;

function formatCountdown(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Inline OTP entry block with 4 digit boxes + a Verify button on the right.
interface OtpRowProps {
    label: string;
    helper: string;
    digits: string[];
    onDigit: (index: number, value: string) => void;
    onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
    inputsRef: React.MutableRefObject<Array<HTMLInputElement | null>>;
    onVerify: () => void;
    verified: boolean;
    resendIn: number;
    onResend: () => void;
}

function OtpRow({ label, helper, digits, onDigit, onKeyDown, inputsRef, onVerify, verified, resendIn, onResend }: OtpRowProps) {
    return (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{helper}</p>

            <div className="mt-3 flex items-center gap-2">
                <div className="flex flex-1 gap-2">
                    {digits.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => {
                                inputsRef.current[index] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => onDigit(index, e.target.value)}
                            onKeyDown={(e) => onKeyDown(index, e)}
                            disabled={verified}
                            className={cn(
                                'size-10 rounded-md border border-input bg-background text-center text-base font-semibold',
                                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30',
                                verified && 'border-primary/50 text-primary',
                            )}
                        />
                    ))}
                </div>
                <Button
                    type="button"
                    size="sm"
                    onClick={onVerify}
                    disabled={verified || digits.join('').length < OTP_LENGTH}
                    className="h-10 px-4"
                >
                    {verified ? 'Verified' : 'Verify'}
                </Button>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px]">
                {resendIn > 0 ? (
                    <>
                        <span className="text-primary">Resend code</span>
                        <span className="text-muted-foreground">{formatCountdown(resendIn)}</span>
                    </>
                ) : (
                    <button type="button" onClick={onResend} className="text-primary hover:underline">
                        Resend code
                    </button>
                )}
            </div>
        </div>
    );
}

export default function Register({ role }: RegisterProps) {
    const { data, setData, post, processing, errors } = useForm({
        role,
        name: '',
        email: '',
        country_code: '+44',
        mobile: '',
    });

    // Email verification state
    const emailInputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const [emailDigits, setEmailDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [emailVerified, setEmailVerified] = useState(false);
    const [emailResendIn, setEmailResendIn] = useState(RESEND_SECONDS);

    // Mobile verification state
    const mobileInputsRef = useRef<Array<HTMLInputElement | null>>([]);
    const [mobileDigits, setMobileDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
    const [mobileVerified, setMobileVerified] = useState(false);
    const [mobileResendIn, setMobileResendIn] = useState(RESEND_SECONDS);

    useEffect(() => {
        if (emailResendIn <= 0) return;
        const t = setTimeout(() => setEmailResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [emailResendIn]);

    useEffect(() => {
        if (mobileResendIn <= 0) return;
        const t = setTimeout(() => setMobileResendIn((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [mobileResendIn]);

    const makeDigitHandlers = (
        digits: string[],
        setDigits: React.Dispatch<React.SetStateAction<string[]>>,
        inputsRef: React.MutableRefObject<Array<HTMLInputElement | null>>,
    ) => ({
        onDigit: (index: number, value: string) => {
            const digit = value.replace(/\D/g, '').slice(-1);
            const next = [...digits];
            next[index] = digit;
            setDigits(next);
            if (digit && index < OTP_LENGTH - 1) {
                inputsRef.current[index + 1]?.focus();
            }
        },
        onKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Backspace' && !digits[index] && index > 0) {
                inputsRef.current[index - 1]?.focus();
            }
        },
    });

    const emailHandlers = makeDigitHandlers(emailDigits, setEmailDigits, emailInputsRef);
    const mobileHandlers = makeDigitHandlers(mobileDigits, setMobileDigits, mobileInputsRef);

    const submit: React.FormEventHandler = (e) => {
        e.preventDefault();
        post(role === 'restaurant' ? route('register.restaurant') : route('register.customer'));
    };

    const canSubmit = emailVerified && mobileVerified && data.name.length > 0;

    return (
        <AuthShell>
            <Head title={role === 'restaurant' ? 'Register your restaurant' : 'Create your account'} />

            <h1 className="text-2xl font-bold tracking-tight">Create Your Account</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Join the elite network of urban food connoisseurs.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
                <input type="hidden" name="role" value={role} />

                <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                        {role === 'restaurant' ? 'Restaurant Name' : 'Full Name'}
                    </Label>
                    <Input
                        id="name"
                        type="text"
                        autoComplete="name"
                        placeholder="John Doe"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                        Email Address
                    </Label>
                    <div className="flex gap-2">
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="john@example.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            disabled={emailVerified}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant={emailVerified ? 'secondary' : 'default'}
                            disabled={emailVerified || !data.email}
                            onClick={() => setEmailResendIn(RESEND_SECONDS)}
                            className="h-10 whitespace-nowrap px-3"
                        >
                            {emailVerified ? 'Verified' : 'Verify E-mail'}
                        </Button>
                    </div>
                    {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <OtpRow
                    label="Enter Verification Code"
                    helper="We've sent a 4-digit code to your email"
                    digits={emailDigits}
                    onDigit={emailHandlers.onDigit}
                    onKeyDown={emailHandlers.onKeyDown}
                    inputsRef={emailInputsRef}
                    verified={emailVerified}
                    onVerify={() => setEmailVerified(true)}
                    resendIn={emailResendIn}
                    onResend={() => setEmailResendIn(RESEND_SECONDS)}
                />

                <div className="space-y-1.5">
                    <Label htmlFor="mobile" className="text-xs font-medium text-muted-foreground">
                        Mobile Number
                    </Label>
                    <div className="flex gap-2">
                        <select
                            value={data.country_code}
                            onChange={(e) => setData('country_code', e.target.value)}
                            disabled={mobileVerified}
                            className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                        >
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+91">🇮🇳 +91</option>
                        </select>
                        <Input
                            id="mobile"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="7123 456789"
                            value={data.mobile}
                            onChange={(e) => setData('mobile', e.target.value)}
                            disabled={mobileVerified}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant={mobileVerified ? 'secondary' : 'default'}
                            disabled={mobileVerified || !data.mobile}
                            onClick={() => setMobileResendIn(RESEND_SECONDS)}
                            className="h-10 whitespace-nowrap px-3"
                        >
                            {mobileVerified ? 'Verified' : 'Verify Mobile'}
                        </Button>
                    </div>
                    {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
                </div>

                <OtpRow
                    label="Enter SMS Verification Code"
                    helper="We've sent a 4-digit code to your mobile"
                    digits={mobileDigits}
                    onDigit={mobileHandlers.onDigit}
                    onKeyDown={mobileHandlers.onKeyDown}
                    inputsRef={mobileInputsRef}
                    verified={mobileVerified}
                    onVerify={() => setMobileVerified(true)}
                    resendIn={mobileResendIn}
                    onResend={() => setMobileResendIn(RESEND_SECONDS)}
                />

                <Button
                    type="submit"
                    size="lg"
                    className="mt-2 w-full"
                    disabled={processing || !canSubmit}
                >
                    Create Account
                    <ArrowRight className="ml-1 size-4" />
                </Button>
            </form>

            <p className="mt-4 text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{' '}
                <Link href="#" className="text-primary hover:underline">
                    Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="#" className="text-primary hover:underline">
                    Privacy Policy
                </Link>
                .
            </p>

            <p className="mt-3 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href={route('login')} className="font-medium text-primary hover:underline">
                    Login
                </Link>
            </p>
        </AuthShell>
    );
}
