import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';

import { CountryCodeDropdown } from '@/components/country-code-dropdown';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
// Reuse the same Google Places autocomplete + draggable-pin map used in the
// partner onboarding flow (resources/js/restaurant/components) so the admin
// "new restaurant" form pins addresses exactly the same way.
import { AddressAutocomplete } from '../../../../restaurant/components/address-autocomplete';
import { LocationMapPicker } from '../../../../restaurant/components/location-map-picker';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin/restaurants' },
    { title: 'Restaurants', href: '/admin/restaurants' },
    { title: 'New restaurant', href: '/admin/restaurants/create' },
];

interface FoodTypeOption {
    id: number;
    name: string;
    slug: string;
    image_url: string | null;
}

interface Props {
    foodTypes: FoodTypeOption[];
    googleMapsApiKey: string | null;
}

type CategoryRow = { name: string };

type RestaurantForm = {
    name: string;
    description: string;
    email: string;
    country_code: string;
    country_iso: string;
    mobile: string;
    full_address: string;
    city: string;
    pin_code: string;
    lat: string;
    lng: string;
    commission_rate: string;
    vat_number: string;
    food_type_ids: number[];
    categories: CategoryRow[];
};

export default function RestaurantCreate({ foodTypes, googleMapsApiKey }: Props) {
    const { data, setData, post, processing, errors } = useForm<RestaurantForm>({
        name: '',
        description: '',
        email: '',
        country_code: '+44',
        country_iso: 'GB',
        mobile: '',
        full_address: '',
        city: '',
        pin_code: '',
        lat: '',
        lng: '',
        commission_rate: '10.00',
        vat_number: '',
        food_type_ids: [],
        categories: [{ name: '' }],
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/restaurants');
    };

    const toggleFoodType = (id: number) => {
        const next = data.food_type_ids.includes(id)
            ? data.food_type_ids.filter((x) => x !== id)
            : [...data.food_type_ids, id];
        setData('food_type_ids', next);
    };

    const setCategoryRow = (idx: number, patch: Partial<CategoryRow>) => {
        const next = data.categories.map((row, i) => (i === idx ? { ...row, ...patch } : row));
        setData('categories', next);
    };

    const addCategoryRow = () => {
        if (data.categories.length >= 50) return;
        setData('categories', [...data.categories, { name: '' }]);
    };

    const removeCategoryRow = (idx: number) => {
        const next = data.categories.filter((_, i) => i !== idx);
        setData('categories', next.length ? next : [{ name: '' }]);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Restaurant" />

            <PageContainer width="full">
                <div className="mb-6 flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href="/admin/restaurants"><ArrowLeft /></Link>
                    </Button>
                    <PageHeader eyebrow="Admin" title="New restaurant" />
                </div>

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Restaurant details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Restaurant name" error={errors.name} required>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="The Curry House"
                                />
                            </FormField>
                            <FormField label="Description" error={errors.description}>
                                <Textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Authentic Indian cuisine in the heart of the city…"
                                    rows={3}
                                />
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Owner account</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Email" error={errors.email} required hint="Used to log in to the restaurant portal">
                                <Input
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="owner@restaurant.co.uk"
                                    type="email"
                                />
                            </FormField>
                            <FormField
                                label="Mobile"
                                error={errors.mobile ?? errors.country_code ?? errors.country_iso}
                                required
                                hint="Subscriber number without the country code"
                            >
                                <div className="flex">
                                    <CountryCodeDropdown
                                        dial={data.country_code}
                                        iso={data.country_iso}
                                        onChange={(c) =>
                                            setData((d) => ({
                                                ...d,
                                                country_code: c.dial,
                                                country_iso: c.iso,
                                            }))
                                        }
                                        className="h-10 rounded-r-none border-r-0"
                                    />
                                    <Input
                                        value={data.mobile}
                                        onChange={(e) => setData('mobile', e.target.value)}
                                        placeholder="7700 900000"
                                        type="tel"
                                        className="flex-1 rounded-l-none"
                                    />
                                </div>
                            </FormField>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Food types</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Pick the categories this restaurant serves. Catalog is managed under Food Types.
                            </p>
                            {foodTypes.length === 0 ? (
                                <p className="rounded-md border border-dashed border-input bg-muted/30 px-3 py-4 text-xs text-muted-foreground">
                                    No food types defined yet — add some under Admin → Food Types first.
                                </p>
                            ) : (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {foodTypes.map((item) => {
                                        const isSelected = data.food_type_ids.includes(item.id);
                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() => toggleFoodType(item.id)}
                                                className={
                                                    'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ' +
                                                    (isSelected
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-input bg-background text-foreground hover:border-primary hover:text-primary')
                                                }
                                            >
                                                {item.image_url ? (
                                                    <span
                                                        className={
                                                            'flex size-5 shrink-0 overflow-hidden rounded-full ' +
                                                            (isSelected ? 'ring-1 ring-primary-foreground/40' : 'ring-1 ring-zinc-200')
                                                        }
                                                    >
                                                        <img
                                                            src={item.image_url}
                                                            alt=""
                                                            className="size-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    </span>
                                                ) : null}
                                                {isSelected && <Check className="size-3" />}
                                                {item.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {errors.food_type_ids && (
                                <p className="text-xs font-medium text-destructive">{errors.food_type_ids}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Menu categories</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-xs text-muted-foreground">
                                Sections the menu is organised into — e.g. Starters, Main course, Breads. Items can be added later from the restaurant dashboard.
                            </p>
                            <div className="space-y-3">
                                {data.categories.map((row, idx) => {
                                    const errorKey = `categories.${idx}.name` as const;
                                    const nameError = (errors as Record<string, string>)[errorKey];
                                    return (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-start"
                                        >
                                            <FormField
                                                label={idx === 0 ? 'Category name' : undefined}
                                                error={nameError}
                                            >
                                                <Input
                                                    value={row.name}
                                                    onChange={(e) => setCategoryRow(idx, { name: e.target.value })}
                                                    placeholder="Enter category name"
                                                />
                                            </FormField>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() => removeCategoryRow(idx)}
                                                aria-label="Remove category"
                                                className={idx === 0 ? 'sm:mt-[1.65rem]' : ''}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addCategoryRow}
                                className="border-dashed"
                            >
                                <Plus className="size-4" />
                                Add another category
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Address</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <FormField label="Full address" error={errors.full_address}>
                                <AddressAutocomplete
                                    apiKey={googleMapsApiKey}
                                    value={data.full_address}
                                    onChange={(v) => setData('full_address', v)}
                                    onSelect={(place) =>
                                        setData((d) => ({
                                            ...d,
                                            full_address: place.address,
                                            lat: String(place.lat),
                                            lng: String(place.lng),
                                            ...(place.city ? { city: place.city } : {}),
                                            ...(place.postcode ? { pin_code: place.postcode } : {}),
                                        }))
                                    }
                                    placeholder="Start typing the address…"
                                    invalid={!!errors.full_address}
                                />
                            </FormField>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="City" error={errors.city}>
                                    <Input
                                        value={data.city}
                                        onChange={(e) => setData('city', e.target.value)}
                                        placeholder="London"
                                    />
                                </FormField>
                                <FormField label="Postcode" error={errors.pin_code}>
                                    <Input
                                        value={data.pin_code}
                                        onChange={(e) => setData('pin_code', e.target.value.toUpperCase())}
                                        placeholder="SW1A 1AA"
                                        className="uppercase"
                                    />
                                </FormField>
                            </div>
                            <FormField label="Pin location on map" error={errors.lat ?? errors.lng}>
                                <LocationMapPicker
                                    apiKey={googleMapsApiKey}
                                    lat={data.lat ? Number(data.lat) : null}
                                    lng={data.lng ? Number(data.lng) : null}
                                    address={[data.full_address, data.city, data.pin_code]
                                        .filter(Boolean)
                                        .join(', ')}
                                    onChange={(la, ln) =>
                                        setData((d) => ({ ...d, lat: String(la), lng: String(ln) }))
                                    }
                                />
                            </FormField>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="Latitude" error={errors.lat}>
                                    <Input
                                        value={data.lat}
                                        onChange={(e) => setData('lat', e.target.value)}
                                        placeholder="51.5074"
                                    />
                                </FormField>
                                <FormField label="Longitude" error={errors.lng}>
                                    <Input
                                        value={data.lng}
                                        onChange={(e) => setData('lng', e.target.value)}
                                        placeholder="-0.1278"
                                    />
                                </FormField>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle>Business & billing</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField label="Commission rate (%)" error={errors.commission_rate} required>
                                    <Input
                                        value={data.commission_rate}
                                        onChange={(e) => setData('commission_rate', e.target.value)}
                                        placeholder="10.00"
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                    />
                                </FormField>
                                <FormField label="VAT number" error={errors.vat_number}>
                                    <Input
                                        value={data.vat_number}
                                        onChange={(e) => setData('vat_number', e.target.value)}
                                        placeholder="GB 123 4567 89"
                                    />
                                </FormField>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/admin/restaurants">Cancel</Link>
                        </Button>
                        <Button type="submit" loading={processing}>Create restaurant</Button>
                    </div>
                </form>
            </PageContainer>
        </AppLayout>
    );
}
