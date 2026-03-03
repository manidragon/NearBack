// D:\Mani\Code with Zosh\Backup\source code\frontend\src\types\dealTypes.ts
import type { HomeCategory } from "./homeDataTypes";

// ✅ FIXED: Make Deal interface more flexible
export interface Deal {
    _id?: string;
    discount: number;
    category: HomeCategory | {
        _id: string;
        name?: string;
        categoryId?: string;
        image?: string;
        description?: string;
    };
}

// ✅ FIXED: Add DealItem type for table rendering
export interface DealItem {
    _id: string;
    discount: number;
    category: {
        _id: string;
        name?: string;
        categoryId?: string;
        image?: string;
        description?: string;
    };
}

// ✅ FIXED: ApiResponse interface
export interface ApiResponse {
    message: string;
    status?: boolean; // ✅ Made optional
}

// ✅ FIXED: DealsState interface
export interface DealsState {
    deals: Deal[];
    loading: boolean;
    error: string | null;
    dealCreated: boolean;
    dealUpdated: boolean;
}

// ✅ ADDED: Helper type for API responses
export type DealApiResponse = {
    success: boolean;
    data?: Deal | Deal[];
    message?: string;
};