// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Checkout\AddressCard.tsx
import { Radio } from '@mui/material';
import React from 'react';
import type { Address } from '../../../types/addressTypes';

interface AddressCardProps {
    item: Address;
    selectedAddressId: string | null;
    onAddressSelect: (addressId: string) => void;
}

const AddressCard: React.FC<AddressCardProps> = ({ item, selectedAddressId, onAddressSelect }) => {
    return (
        <div 
            className={`p-5 border rounded-md flex cursor-pointer transition-all ${
                selectedAddressId === item._id 
                    ? 'border-primary-color bg-primary-color/5' 
                    : 'hover:border-gray-400'
            }`}
            onClick={() => onAddressSelect(item._id)} // ✅ Click anywhere to select
        >
            <div>
                <Radio
                    checked={selectedAddressId === item._id}
                    onChange={() => onAddressSelect(item._id)}
                    value={item._id} // ✅ Use address ID instead of index
                    name="address-selection"
                    inputProps={{ 'aria-label': item.name }}
                />
            </div>

            <div className='space-y-3 pt-3 flex-1'>
                <h1 className='font-semibold'>{item.name}</h1>
                <p className='text-sm text-gray-600'>
                    {item.address},
                    {item.locality},
                    {item.city},
                    {item.state} - {item.pinCode}
                </p>
                <p className='text-sm'>
                    <strong>Mobile:</strong> {item.mobile}
                </p>
            </div>
        </div>
    );
};

export default AddressCard;