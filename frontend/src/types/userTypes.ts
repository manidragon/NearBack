// src/types/addressTypes.ts
import { type Address } from './addressTypes';
export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN' | 'ROLE_SELLER';

export interface User {
    _id?:    string;
    password?: string;
    email: string;
    fullName: string;
    mobile?: string;
    profilePicture?: string;
    role: UserRole;
    addresses?: Address[];
}

export interface UserState {
    user: User | null;
    loading: boolean;
    error: string | null;
    profileUpdated: boolean;
}

export interface UserWithAddresses extends User {
    addresses: Address[]; 
}