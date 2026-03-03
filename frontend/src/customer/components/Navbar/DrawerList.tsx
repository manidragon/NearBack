// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\components\Navbar\DrawerList.tsx
import { Box, Divider, List, ListItem, ListItemButton, ListItemText, CircularProgress, Typography } from '@mui/material'
import { useState, useEffect, useMemo } from 'react'
import CategorySheet from './CategorySheet';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchCategories } from '../../../Redux Toolkit/Admin/CategorySlice';

interface DrawerListProps {
  // ✅ FIX: Correct type for curried toggleDrawer function
  toggleDrawer: (open: boolean) => () => void;
}

const DrawerList = ({ toggleDrawer }: DrawerListProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  
  const { categories, loading } = useAppSelector((state) => state.category);

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  const levelOneCategories = useMemo(() => {
    return categories
      .filter(cat => cat.level === 1)
      .sort((a, b) => {
        const orderA = a.order || 999999;
        const orderB = b.order || 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [categories]);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  // ✅ FIX: Helper to properly call the curried toggleDrawer
  const closeDrawer = () => {
    toggleDrawer(false)();
  };

  return (
    <Box 
      sx={{ width: 250, minHeight: '100vh' }} 
      role="presentation"
    >
      <List>
        <ListItem>
          <ListItemButton onClick={closeDrawer}>
            <ListItemText 
              primary={
                <h1 
                  onClick={() => {
                    closeDrawer();
                  }} 
                  className='logo text-2xl text-[#00927c] cursor-pointer'
                >
                  Near Look
                </h1>
              } 
            />
          </ListItemButton>
        </ListItem>
        <Divider />
        
        {loading && levelOneCategories.length === 0 ? (
          <ListItem>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          </ListItem>
        ) : (
          levelOneCategories.map((item) => (
            <ListItem key={item._id} disablePadding>
              <ListItemButton 
                onClick={() => handleCategoryClick(item._id)}
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.order !== undefined && (
                        <Box 
                          sx={{ 
                            bgcolor: 'primary.main', 
                            color: 'white', 
                            borderRadius: '50%', 
                            width: 20, 
                            height: 20, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}
                        >
                          {item.order}
                        </Box>
                      )}
                      <span>{item.name || 'Unnamed Category'}</span>
                    </Box>
                  } 
                />
              </ListItemButton>
            </ListItem>
          ))
        )}

        {!loading && levelOneCategories.length === 0 && (
          <ListItem>
            <ListItemText 
              primary={
                <Typography variant="body2" color="text.secondary" align="center">
                  No categories available
                </Typography>
              } 
            />
          </ListItem>
        )}

      </List>

      {selectedCategory && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 250, 
            right: 0, 
            bottom: 0,
            bgcolor: 'white',
            zIndex: 1000,
            overflow: 'auto'
          }}
        >
          {/* ✅ FIX: Wrap toggleDrawer to match CategorySheet's expected prop type */}
          <CategorySheet 
            toggleDrawer={closeDrawer} 
            selectedCategory={selectedCategory}
            setShowSheet={(show) => {
              if (!show) setSelectedCategory(null);
            }}
          />
        </Box>
      )}
    </Box>
  )
}

export default DrawerList