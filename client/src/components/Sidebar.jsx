import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import MyTasksSidebar from './MyTasksSidebar'
import ProjectSidebar from './ProjectsSidebar'
import WorkspaceDropdown from './WorkspaceDropdown'
import { FolderOpenIcon, LayoutDashboardIcon, SettingsIcon, UsersIcon } from 'lucide-react'
import { useClerk } from '@clerk/clerk-react'

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, isHovered, setIsHovered }) => {
    const { openUserProfile } = useClerk();

    const menuItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboardIcon },
        { name: 'Projects', href: '/projects', icon: FolderOpenIcon },
        { name: 'Team', href: '/team', icon: UsersIcon },
    ]

    const sidebarRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [setIsSidebarOpen]);

    return (
        <>
            {/* Hover trigger zone at the left edge of the screen */}
            <div 
                onMouseEnter={() => setIsHovered(true)}
                className="fixed left-0 top-0 bottom-0 w-2 z-20 cursor-pointer"
            />
            <div 
                ref={sidebarRef} 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={`fixed top-0 bottom-0 z-30 backdrop-blur-xl bg-white/95 dark:bg-zinc-900/95 w-[272px] flex flex-col h-screen border-r border-zinc-200/50 dark:border-zinc-800/50 transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
                    isSidebarOpen || isHovered 
                        ? 'left-0 shadow-[8px_0_35px_rgba(0,0,0,0.06)] dark:shadow-[8px_0_40px_rgba(0,0,0,0.35)]' 
                        : 'left-[-272px]'
                } ${isSidebarOpen ? 'rounded-r-none' : 'rounded-r-2xl'}`}
            >
                <WorkspaceDropdown />
                <hr className='border-zinc-200/60 dark:border-zinc-800/60 mx-4 my-1' />
                <div className='flex-1 overflow-y-scroll no-scrollbar flex flex-col'>
                    <div>
                        <div className='p-4 flex flex-col gap-1.5'>
                            {menuItems.map((item) => (
                                <NavLink 
                                    to={item.href} 
                                    key={item.name} 
                                    className={({ isActive }) => `
                                        flex items-center gap-3 py-2.5 px-4 text-sm font-medium transition-all duration-200 rounded-lg group cursor-pointer
                                        ${isActive 
                                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 border-l-[3px] border-indigo-500 rounded-l-none' 
                                            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40'
                                        }
                                    `} 
                                >
                                    <item.icon size={16} className="group-hover:scale-105 transition-transform duration-200" />
                                    <p className='truncate'>{item.name}</p>
                                </NavLink>
                            ))}
                            <button 
                                onClick={openUserProfile} 
                                className='flex w-full items-center gap-3 py-2.5 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40 cursor-pointer rounded-lg transition-all duration-200 group'
                            >
                                <SettingsIcon size={16} className="group-hover:rotate-45 transition-transform duration-300" />
                                <p className='truncate'>Settings</p>
                            </button>
                        </div>
                    <MyTasksSidebar />
                    <ProjectSidebar />
                </div>


            </div>

        </div>
        </>
    )
}

export default Sidebar
