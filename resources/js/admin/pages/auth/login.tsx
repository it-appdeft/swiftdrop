import { Head, useForm } from '@inertiajs/react';
import { LockKeyhole, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: string | boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('admin.login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <AuthLayout title="Sign in to your account" description="Welcome back. Enter your credentials to continue.">
            <Head title="Log in" />

            {status ? (
                <p className="rounded-md border border-success/30 bg-success-muted px-3 py-2 text-sm font-medium text-success">
                    {status}
                </p>
            ) : null}

            <form className="space-y-5" onSubmit={submit} noValidate>
                <FormField label="Email address" error={errors.email} required>
                    <Input
                        type="email"
                        required
                        autoFocus
                        tabIndex={1}
                        autoComplete="email"
                        placeholder="you@company.com"
                        leftAdornment={<Mail aria-hidden />}
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </FormField>

                <FormField
                    label={
                        <span className="flex w-full items-center justify-between gap-2">
                            <span>Password</span>
                            {/* {canResetPassword && (
                                <TextLink href={route('password.request')} className="text-xs font-normal" tabIndex={5}>
                                    Forgot password?
                                </TextLink>
                            )} */}
                        </span>
                    }
                    error={errors.password}
                    required
                >
                    <Input
                        type="password"
                        required
                        tabIndex={2}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        leftAdornment={<LockKeyhole aria-hidden />}
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </FormField>

                <div className="flex items-center gap-2">
                    <Checkbox
                        id="remember"
                        name="remember"
                        tabIndex={3}
                        checked={data.remember}
                        onCheckedChange={(checked) => setData('remember', checked === true)}
                    />
                    <Label htmlFor="remember" className="text-sm font-normal">
                        Remember me for 30 days
                    </Label>
                </div>

                <Button type="submit" block size="lg" tabIndex={4} loading={processing}>
                    Sign in
                </Button>
            </form>

        </AuthLayout>
    );
}
