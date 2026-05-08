import { Head, useForm } from '@inertiajs/react';
import { LockKeyhole, Mail, User } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import AuthLayout from '@/layouts/auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    [key: string]: string;
};

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm<RegisterForm>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout title="Create your account" description="Get started in seconds — no credit card required.">
            <Head title="Register" />

            <form className="space-y-5" onSubmit={submit} noValidate>
                <FormField label="Full name" error={errors.name} required>
                    <Input
                        type="text"
                        required
                        autoFocus
                        tabIndex={1}
                        autoComplete="name"
                        placeholder="Ada Lovelace"
                        leftAdornment={<User aria-hidden />}
                        value={data.name}
                        disabled={processing}
                        onChange={(e) => setData('name', e.target.value)}
                    />
                </FormField>

                <FormField label="Work email" error={errors.email} required>
                    <Input
                        type="email"
                        required
                        tabIndex={2}
                        autoComplete="email"
                        placeholder="you@company.com"
                        leftAdornment={<Mail aria-hidden />}
                        value={data.email}
                        disabled={processing}
                        onChange={(e) => setData('email', e.target.value)}
                    />
                </FormField>

                <FormField label="Password" error={errors.password} hint="At least 8 characters." required>
                    <Input
                        type="password"
                        required
                        tabIndex={3}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        leftAdornment={<LockKeyhole aria-hidden />}
                        value={data.password}
                        disabled={processing}
                        onChange={(e) => setData('password', e.target.value)}
                    />
                </FormField>

                <FormField label="Confirm password" error={errors.password_confirmation} required>
                    <Input
                        type="password"
                        required
                        tabIndex={4}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        leftAdornment={<LockKeyhole aria-hidden />}
                        value={data.password_confirmation}
                        disabled={processing}
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                </FormField>

                <Button type="submit" block size="lg" tabIndex={5} loading={processing}>
                    Create account
                </Button>
            </form>

            <p className="text-muted-foreground text-center text-sm">
                Already have an account?{' '}
                <TextLink href={route('login')} tabIndex={6}>
                    Sign in
                </TextLink>
            </p>
        </AuthLayout>
    );
}
