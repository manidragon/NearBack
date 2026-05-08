// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Account\UserAddressCard.tsx
import type { Address } from '../../../types/addressTypes'

const UserAddressCard = ({item, onEdit, onDelete}:{item: Address, onEdit: (address: Address) => void, onDelete: (addressId: string) => void}) => {
  return (
    <div className='p-5 border rounded-md relative'>
      <div className='space-y-3'>
        <h1 className='font-semibold'>{item.name}</h1>
        <p className='w-[320px]'>
            {item.address},
            {item.locality},
            {item.city},
 {item.state} - {item.pinCode}</p>
        <p><strong>Mobile : </strong> {item.mobile}</p>
      </div>
      
      <div className="absolute top-4 right-4 flex gap-2">
        <button 
          onClick={() => onEdit(item)}
          className="text-blue-500 hover:text-blue-700"
        >
          Edit
        </button>
        <button 
          onClick={() => onDelete(item._id)}
          className="text-red-500 hover700"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default UserAddressCard