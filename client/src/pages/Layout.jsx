import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import { Outlet, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadTheme } from '../features/themeSlice'
import { Loader2Icon } from 'lucide-react'
// import {useUser, SignIn} from '@clerk/clerk-react'
import { useUser, SignIn, useAuth, CreateOrganization } from '@clerk/clerk-react'
import { fetchWorkspaces } from '../features/workspaceSlice'

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const { loading, workspaces } = useSelector((state) => state.workspace)
    const dispatch = useDispatch()
    const { user, isLoaded } = useUser()
    const { getToken } = useAuth()
    const location = useLocation()

    // Initial load of theme
    useEffect(() => {
        dispatch(loadTheme())
    }, [])

    // Initial load of workspaces
    useEffect(() => {
        if (isLoaded && user && workspaces.length === 0) {
            dispatch(fetchWorkspaces({ getToken }))
        }
    }, [user, isLoaded])

    if (!user) {
        return (
            <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
                <SignIn />
            </div>
        )
    }

    if (loading) return (
        <div className='flex items-center justify-center h-screen bg-white dark:bg-zinc-950'>
            <Loader2Icon className="size-7 text-blue-500 animate-spin" />
        </div>
    )

    if (user && workspaces.length === 0) {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <CreateOrganization />
            </div>
        );
    }

    const isSidebarVisible = isSidebarOpen || isHovered;

    return (
        <div className="flex bg-white dark:bg-zinc-950 text-gray-900 dark:text-slate-100">
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} isHovered={isHovered} setIsHovered={setIsHovered} />
            <div className={`flex-1 flex flex-col h-screen transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${isSidebarVisible ? 'md:pl-[272px]' : 'pl-0'}`}>
                <Navbar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
                <div key={location.pathname} className="flex-1 h-full p-6 xl:p-10 xl:px-16 overflow-y-scroll animate-page">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout
