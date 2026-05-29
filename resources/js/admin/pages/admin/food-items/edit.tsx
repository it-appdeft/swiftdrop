import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { FoodItem } from '@/types/admin';

interface Props {
    item: FoodItem;
}

interface FoodItemFormState {
    name: string;
    slug: string;
    image: File | null;
    [key: string]: string | File | null;
}

export default function FoodItemEdit({ item }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin', href: '/admin/food-items' },
        { title: 'Food Items', href: '/admin/food-items' },
        { title: item.name, href: `/admin/food-items/${item.id}/edit` },
    ];

    const { data, setData, post, processing, errors } = useForm<FoodItemFormState>({
        name: item.name,
        slug: item.slug,
        image: null,
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(item.image_url);

    const onPickImage = (file: File | null) => {
        setData('image', file);
        if (file) {
            setPreview(URL.createObjectURL(file));
        } else {
            setPreview(item.image_url);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/admin/food-items/${item.id}`, { forceFormData: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${item.name}`} />

            <PageContainer width="narrow">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href="/admin/food-items"><ArrowLeft /></Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title={`Edit ${item.name}`} />
                </div>

                <form onSubmit={submit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Item details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Image" error={errors.image}>
                                <div className="flex items-center gap-4">
                                    {preview ? (
                                        <div className="relative">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="size-20 rounded-md border border-border/60 object-cover"
                                            />
                                            {data.image ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onPickImage(null)}
                                                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                                                    aria-label="Discard new image"
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <div className="flex size-20 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-muted-foreground">
                                            <ImagePlus className="size-5" />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                                        />
                                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                            {data.image ? 'Replace image' : 'Change image'}
                                        </Button>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or SVG — max 2 MB.</p>
                                    </div>
                                </div>
                            </FormField>

                            <FormField label="Name" error={errors.name} required>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Pizza"
                                />
                            </FormField>

                            <FormField
                                label="Slug"
                                error={errors.slug}
                                hint="URL-safe identifier."
                            >
                                <Input
                                    value={data.slug}
                                    onChange={(e) => setData('slug', e.target.value)}
                                    placeholder="pizza"
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/admin/food-items">Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
