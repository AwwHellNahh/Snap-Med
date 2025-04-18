export interface User {
    $id: string;
    phone: string;
    lastLogin: string;
}

export interface AuthRequest {
    phoneNumber: string;
    password?: string;
}

export interface AuthResponse {
    message: string;
    userId?: string;
    token?: string;
}