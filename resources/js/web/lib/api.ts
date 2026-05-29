interface ApiSuccess<T> {
    success: true;
    message: string;
    data: T;
}

interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * POST JSON to a local API endpoint and return the parsed response envelope.
 * Errors (non-2xx) come back as { success: false, message, errors }; never throws on HTTP status.
 */
export async function postJson<T = unknown>(url: string, body: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(body),
        });

        const payload = await response.json().catch(() => null);

        if (payload && typeof payload === 'object' && 'success' in payload) {
            return payload as ApiResponse<T>;
        }

        return {
            success: response.ok,
            message: response.statusText || 'Request failed',
            data: payload,
        } as ApiResponse<T>;
    } catch (e) {
        return {
            success: false,
            message: e instanceof Error ? e.message : 'Network error',
        };
    }
}
