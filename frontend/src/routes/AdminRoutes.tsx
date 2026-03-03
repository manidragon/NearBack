// D:\Mani\Code with Zosh\Backup\source code\frontend\src\routes\AdminRoutes.tsx
import { Route, Routes } from 'react-router-dom'
import SellersTable from '../admin/pages/sellers/SellersTable'
import Coupon from '../admin/pages/Coupon/Coupon'
import CouponForm from '../admin/pages/Coupon/CreateCouponForm'
import GridTable from '../admin/pages/Home Page/GridTable'
import ShopByCategoryTable from '../admin/pages/Home Page/ShopByCategoryTable'
import Deal from '../admin/pages/Home Page/Deal'
import CategoryManagement from '../admin/components/CategoryManagement/CategoryManagment'
import ElectronicCategoriesTable from '../admin/pages/Home Page/ElectronicCategoriesTable' // ✅ ADD IMPORT
import CategoryAttributeManagement from '../admin/pages/CategoryAttributes/CategoryAttributeManagement';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path='/' element={<SellersTable />} />
      <Route path='/coupon' element={<Coupon />} />
      <Route path='/add-coupon' element={<CouponForm />} />
      <Route path='/home-grid' element={<GridTable />} />
      <Route path='/electronics-category' element={<ElectronicCategoriesTable />} />
      <Route path='/shop-by-category' element={<ShopByCategoryTable />} />
      <Route path='/deals' element={<Deal />} />
      <Route path='/categories' element={<CategoryManagement />} />
      <Route path='/categories/attributes' element={<CategoryAttributeManagement />} />

    </Routes>
  )
}

export default AdminRoutes