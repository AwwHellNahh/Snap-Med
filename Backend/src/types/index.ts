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

export interface DrugInfo {
    generic_name: string;
    dosage_form: string;
    product_type: string;
    route: string[];
}

export interface MedicationHistory {
    id?: string;
    userId: string;
    lines: string[];
    drugInfo: DrugInfo;
    createdAt: string;
}

export interface HistoryRequest {
    lines: string[];
    drugInfo: DrugInfo;
}

export interface HistoryResponse {
    message: string;
    historyId?: string;
}

export interface HistoriesResponse {
    message: string;
    histories: MedicationHistory[];
}