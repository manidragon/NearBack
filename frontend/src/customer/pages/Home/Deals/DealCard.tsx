// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Home\Deals\DealCard.tsx
import { useNavigate } from 'react-router-dom';

const DealCard = ({ deal }: any) => {
  const navigate = useNavigate();

  // ✅ ADD: Null safety check
  if (!deal || !deal.category) {
    return null; // Skip rendering if data is invalid
  }

  const category = deal.category;
  const discount = deal.discount || 0;

  return (
    <div 
      onClick={() => navigate(`/products/${category._id}`)} 
      className='cursor-pointer group'
    >
      <div className='relative overflow-hidden rounded-lg'>
        <img 
          className='w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300' 
          src={category.image || '/placeholder.jpg'} // ✅ Fallback image
          alt={category.description || 'Deal'} 
        />
        <div className='absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded'>
          <span className='font-bold'>{discount}% OFF</span>
        </div>
      </div>
      <div className='mt-2'>
        <h3 className='font-medium text-sm truncate'>{category.description || 'No description'}</h3>
        {discount > 0 && (
          <p className='text-red-500 font-bold text-sm'>Hurry! Limited time offer</p>
        )}
      </div>
    </div>
  );
};

export default DealCard;