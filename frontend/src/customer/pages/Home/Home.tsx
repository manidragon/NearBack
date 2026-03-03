// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Home\Home.tsx
import { useState, useEffect } from 'react'
import HomeCategory from './HomeCategory/HomeCategory'
import TopBrand from './TopBrands/Grid'
import ElectronicCategory from './Electronic Category/ElectronicCategory'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { Backdrop, Button, CircularProgress } from '@mui/material'
import ChatBot from '../ChatBot/ChatBot'
import { useNavigate } from 'react-router-dom'
import StorefrontIcon from '@mui/icons-material/Storefront';
import { useAppSelector, useAppDispatch } from '../../../Redux Toolkit/Store'
import DealSlider from './Deals/DealSlider'
import { fetchCategories } from '../../../Redux Toolkit/Admin/CategorySlice';

const Home = () => {
    const [showChatBot, setShowChatBot] = useState(false)
    const homePage = useAppSelector(state => state.homePage);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(fetchCategories());
    }, [dispatch]);

    const handleShowChatBot = () => {
        setShowChatBot(!showChatBot)
    }
    const handleCloseChatBot = () => {
        setShowChatBot(false)
    }
    const becomeSellerClick = () => {
        navigate("/become-seller")
    }
    return (
        <>
            {(!homePage.loading) ? <div className='space-y-5 lg:space-y-10 relative'>
                {homePage.homePageData?.electricCategories && <ElectronicCategory />}

                {/* ✅ FIX: Only render grid if data exists */}
                {homePage.homePageData?.grid && homePage.homePageData.grid.length > 0 && (
                  <section>
                    <TopBrand />
                  </section>
                )}

                {homePage.homePageData?.deals && <section className='pt-10'>
                    <h1 className='text-center text-lg lg:text-4xl font-bold text-[#00927c] pb-5 lg:pb-10'>Today's Deals</h1>
                    <DealSlider />
                </section>}
                
                {homePage.homePageData?.shopByCategories && <section className='flex flex-col justify-center items-center py-20 px-5 lg:px-20'>
                    <h1 className='text-lg lg:text-4xl font-bold text-[#00927c] pb-5 lg:pb-20'>SHOP BY CATEGORY</h1>
                    <HomeCategory />
                </section>}

                <section className='lg:px-20 relative h-[200px] lg:h-[450px] object-cover'>
                    <img className='w-full h-full' src={"/seller_banner_image.jpg"} alt="" />
                    <div className='absolute top-1/2 left-4 lg:left-[15rem] transform -translate-y-1/2 font-semibold lg:text-4xl space-y-3'>
                        <h1>
                            Sell Your Product
                        </h1>
                        <p className='text-lg md:text-2xl'>With <strong className='logo text-3xl md:text-5xl pl-2'>Near Look</strong></p>
                        <div className='pt-6 flex justify-center'>
                            <Button
                                onClick={becomeSellerClick}
                                startIcon={<StorefrontIcon />}
                                variant="contained"
                            >
                                Become Seller
                            </Button>
                        </div>
                    </div>
                </section>

                <section className='fixed bottom-10 right-10'>
                    {showChatBot ? <ChatBot handleClose={handleCloseChatBot} /> : <Button onClick={handleShowChatBot} sx={{ borderRadius: "2rem" }} variant='contained' className='h-16 w-16 flex justify-center items-center rounded-full'>
                        <ChatBubbleIcon sx={{ color: "white", fontSize: "2rem" }} />
                    </Button>}
                </section>
            </div> : <Backdrop open={true}>
                <CircularProgress color="inherit" />
            </Backdrop>}
        </>
    )
}

export default Home;