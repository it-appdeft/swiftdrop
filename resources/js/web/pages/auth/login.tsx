import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { Phone } from 'lucide-react';
import { AuthShell } from '../../components/auth-shell';
import { CountryCodeDropdown } from '../../components/country-code-dropdown';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        type: 'login',
        user_type: 'customer',
        channel: 'sms',
        country_code: '+44',
        mobile: '',
    });

    const mobileDigits = data.mobile.replace(/\D/g, '');
    const mobileFormatError =
        data.mobile.trim().length === 0
            ? null
            : /[^\d\s-]/.test(data.mobile)
              ? 'Please enter a valid mobile number — country code is selected separately.'
              : mobileDigits.length < 6
                ? 'Mobile number must be at least 6 digits.'
                : mobileDigits.length > 11
                  ? 'Mobile number must be at most 11 digits.'
                  : null;

    const submit: React.FormEventHandler = (e) => {
        e.preventDefault();
        if (mobileFormatError || mobileDigits.length === 0) return;
        post(route('otp.send'));
    };

    return (
        <AuthShell>
            <Head title="Sign in" />
            <h1 className="text-2xl font-bold tracking-tight">Craving Something Delicious?</h1>
            <form onSubmit={submit} className="mt-6 space-y-5">
                <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-xs font-medium text-muted-foreground">
                        Mobile Number
                    </Label>
                    <div className="flex gap-2">
                        <CountryCodeDropdown
                            value={data.country_code}
                            onChange={(v) => setData('country_code', v)}
                        />
                        <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="mobile"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="7123 456789"
                                maxLength={14}
                                value={data.mobile}
                                onChange={(e) => setData('mobile', e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    {mobileFormatError && (
                        <p className="text-sm text-destructive">{mobileFormatError}</p>
                    )}
                    {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
                </div>
                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={processing || !!mobileFormatError}
                >
                    Get OTP
                </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                New to Swiftdrop? Create an account as{' '}
                <Link
                    href={`${route('register')}?as=customer`}
                    className="font-medium text-primary hover:underline"
                >
                    Customer
                </Link>{' '}
                or{' '}
                <Link
                    href={`${route('register')}?as=restaurant`}
                    className="font-medium text-primary hover:underline"
                >
                    Restaurant
                </Link>
            </p>
        </AuthShell>
    );
}
