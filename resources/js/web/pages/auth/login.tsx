import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, Link, useForm } from '@inertiajs/react';
import { Phone } from 'lucide-react';
import { AuthShell } from '../../components/auth-shell';
import { use } from 'react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        country_code: '+44',
        mobile: '',
        channel: 'sms',
    });

    const submit: React.FormEventHandler = (e) => {
        e.preventDefault();
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
                        <select
                            value={data.country_code}
                            onChange={(e) => setData('country_code', e.target.value)}
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+91">🇮🇳 +91</option>
                        </select>
                        <div className="relative flex-1">
                            <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="mobile"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                placeholder="7123 456789"
                                value={data.mobile}
                                onChange={(e) => setData('mobile', e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    {errors.mobile && <p className="text-sm text-destructive">{errors.mobile}</p>}
                </div>
                <Button type="submit" size="lg" className="w-full" disabled={processing}>
                    Get OTP
                </Button>
            </form>
            <div className="mt-6 space-y-3">
                <p className="text-center text-sm text-muted-foreground">New to Swiftdrop? Create an account as</p>
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href={`${route('register')}?as=customer`}
                        className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
                    >
                        Customer
                    </Link>
                    <Link
                        href={`${route('register')}?as=restaurant`}
                        className="flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground hover:border-primary hover:text-primary"
                    >
                        Restaurant
                    </Link>
                </div>
            </div>
        </AuthShell>
    );
}
