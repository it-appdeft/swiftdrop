export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

// ─── Customer ────────────────────────────────────────────────────────────────

export interface CustomerProfile {
    id: number;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
    date_of_birth: string | null;
    addresses?: CustomerAddress[];
}

export interface CustomerAddress {
    id: number;
    label: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    county: string | null;
    postcode: string;
    lat: string;
    lng: string;
    is_default: boolean;
}

export interface CustomerOrder {
    id: number;
    uuid: string;
    status: string;
    total: string;
    placed_at: string;
    created_at: string;
}

export interface Customer {
    id: number;
    /** Subscriber-only digits (no prefix). */
    mobile: string;
    /** Dialling prefix, e.g. "+44". */
    country_code: string | null;
    /** ISO 3166-1 alpha-2, e.g. "GB" — resolves the exact flag. */
    country_iso: string | null;
    /** country_code + mobile, the full number for display. */
    canonical_mobile: string | null;
    email: string | null;
    name: string;
    status: 'active' | 'suspended' | 'pending_approval';
    created_at: string;
    orders_count?: number;
    customer_profile: CustomerProfile | null;
    orders?: CustomerOrder[];
}

// ─── Driver ──────────────────────────────────────────────────────────────────

export interface DriverDocument {
    id: number;
    type: string;
    original_filename: string;
    file_path: string;
    expires_at: string | null;
    verification_status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    verified_at: string | null;
    verified_by: { id: number; name: string } | null;
    created_at: string;
}

export interface DriverDelivery {
    id: number;
    status: string;
    distance_miles: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    created_at: string;
    order?: { uuid: string; total: string } | null;
}

export interface DriverProfile {
    id: number;
    first_name: string;
    last_name: string;
    profile_photo: string | null;
    vehicle_type: 'bicycle' | 'motorcycle' | 'car' | 'van';
    vehicle_make: string | null;
    vehicle_model: string | null;
    vehicle_registration: string;
    availability: 'online' | 'offline';
    approval_status: 'pending' | 'approved' | 'rejected';
    current_lat: string | null;
    current_lng: string | null;
    deliveries_count?: number;
    documents_count?: number;
    pending_documents_count?: number;
    documents?: DriverDocument[];
    deliveries?: DriverDelivery[];
}

export interface Driver {
    id: number;
    /** Subscriber-only digits (no prefix). */
    mobile: string;
    /** Dialling prefix, e.g. "+44". */
    country_code: string | null;
    /** ISO 3166-1 alpha-2, e.g. "GB" — resolves the exact flag. */
    country_iso: string | null;
    /** country_code + mobile, the full number for display. */
    canonical_mobile: string | null;
    email: string | null;
    name: string;
    status: 'active' | 'suspended' | 'pending_approval';
    created_at: string;
    driver_profile: DriverProfile | null;
}

// ─── Restaurant ───────────────────────────────────────────────────────────────

export interface RestaurantDocument {
    id: number;
    type: string;
    original_filename: string;
    file_path: string;
    expires_at: string | null;
    verification_status: 'pending' | 'approved' | 'rejected';
    rejection_reason: string | null;
    verified_at: string | null;
    verified_by: { id: number; name: string } | null;
    created_at: string;
}

export interface RestaurantOrder {
    id: number;
    uuid: string;
    status: string;
    total: string;
    placed_at: string | null;
    created_at: string;
}

export interface RestaurantOwner {
    id: number;
    email: string | null;
    /** Subscriber-only digits (no prefix). */
    mobile: string | null;
    /** Dialling prefix, e.g. "+44". */
    country_code: string | null;
    /** ISO 3166-1 alpha-2, e.g. "GB" — resolves the exact flag. */
    country_iso: string | null;
    /** country_code + mobile, the full number for display. */
    canonical_mobile: string | null;
    status: 'active' | 'suspended' | 'pending_approval';
}

export interface Restaurant {
    id: number;
    name: string;
    legal_business_name: string | null;
    owner_name: string | null;
    owner_email: string | null;
    owner_mobile: string | null;
    description: string | null;
    restaurant_type: string | null;
    branches: number | null;
    seating_capacity: number | null;
    /** Single-line address string — schema uses this rather than line_1/line_2/postcode. */
    full_address: string | null;
    city: string | null;
    pin_code: string | null;
    lat: string | null;
    lng: string | null;
    status: 'pending_approval' | 'active' | 'inactive' | 'suspended';
    approval_status: 'pending' | 'approved' | 'rejected';
    rating: string;
    total_reviews: number;
    commission_rate: string;
    orders_count?: number;
    created_at: string;
    user: RestaurantOwner | null;
    documents?: RestaurantDocument[];
    orders?: RestaurantOrder[];
}

// ─── Food Type ────────────────────────────────────────────────────────────────

export interface FoodType {
    id: number;
    name: string;
    slug: string;
    image: string | null;
    image_url: string | null;
    created_at: string;
    updated_at: string;
}

// ─── Shared ──────────────────────────────────────────────────────────────────

export type UserStatus = 'active' | 'suspended' | 'pending_approval';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type DocumentVerificationStatus = 'pending' | 'approved' | 'rejected';
