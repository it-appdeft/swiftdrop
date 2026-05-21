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
    mobile: string;
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
    mobile: string;
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
    mobile: string | null;
    status: 'active' | 'suspended' | 'pending_approval';
}

export interface Restaurant {
    id: number;
    name: string;
    description: string | null;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    county: string | null;
    postcode: string;
    lat: string;
    lng: string;
    phone: string;
    cuisine_type: string | null;
    logo_path: string | null;
    cover_photo_path: string | null;
    status: 'pending_approval' | 'active' | 'inactive' | 'suspended';
    approval_status: 'pending' | 'approved' | 'rejected';
    rating: string;
    total_reviews: number;
    commission_rate: string;
    vat_number: string | null;
    orders_count?: number;
    created_at: string;
    user: RestaurantOwner | null;
    documents?: RestaurantDocument[];
    orders?: RestaurantOrder[];
}

// ─── Food Item ────────────────────────────────────────────────────────────────

export interface FoodItem {
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
