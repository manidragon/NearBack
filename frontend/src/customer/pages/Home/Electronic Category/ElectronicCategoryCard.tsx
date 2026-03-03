// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Home\Electronic Category\ElectronicCategoryCard.tsx
import { useNavigate } from 'react-router-dom'
import type { ElectronicCategoryItem } from '../../../../types/homeDataTypes'; // ✅ ADD IMPORT

const ElectronicCategoryCard = ({ item }: { item: ElectronicCategoryItem }) => { // ✅ ADD TYPE
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/products/${item.categoryId}`)} 
      className='flex w-20 flex-col items-center gap-3 cursor-pointer'
    >
      <img 
        className='object-contain h-10' 
        src={item.image} 
        alt={item.name} 
      />
      <h2 className='font-semibold text-sm'>{item.name}</h2>
    </div>
  )
}

export default ElectronicCategoryCard