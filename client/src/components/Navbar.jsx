import { SearchIcon, PanelLeft } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleTheme } from '../features/themeSlice'
import { MoonIcon, SunIcon } from 'lucide-react'
import { assets } from '../assets/assets'
import { UserButton } from '@clerk/clerk-react'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Navbar = ({ setIsSidebarOpen }) => {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { theme } = useSelector(state => state.theme);
    const { currentWorkspace } = useSelector(state => state.workspace);

    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchQuery("");
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const projects = currentWorkspace?.projects || [];
    const allTasks = projects.flatMap((project) => 
        (project.tasks || []).map((task) => ({ ...task, projectName: project.name }))
    );

    const filteredProjects = searchQuery.trim() === "" ? [] : projects.filter((project) => 
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTasks = searchQuery.trim() === "" ? [] : allTasks.filter((task) => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 xl:px-16 py-3 flex-shrink-0">
            <div className="flex items-center justify-between max-w-6xl mx-auto">
                {/* Left section */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Sidebar Trigger */}
                    <button onClick={() => setIsSidebarOpen((prev) => !prev)} className="p-2 rounded-lg transition-colors text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800" >
                        <PanelLeft size={20} />
                    </button>
 
                    {/* Search Input */}
                    <div ref={searchRef} className="relative flex-1 max-w-sm">
                        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-400 size-3.5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search projects, tasks..."
                            className="pl-8 pr-4 py-2 w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 rounded-md text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                        />

                        {searchQuery && (filteredProjects.length > 0 || filteredTasks.length > 0) && (
                            <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto p-2">
                                {filteredProjects.length > 0 && (
                                    <div className="mb-2">
                                        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-2 py-1 uppercase tracking-wider">Projects</div>
                                        {filteredProjects.map((project) => (
                                            <button
                                                key={project.id}
                                                onClick={() => {
                                                    navigate(`/projectsDetail?id=${project.id}`);
                                                    setSearchQuery("");
                                                }}
                                                className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-between text-sm text-zinc-800 dark:text-zinc-200 transition"
                                            >
                                                <span className="font-medium truncate">{project.name}</span>
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 capitalize">{project.status.toLowerCase()}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {filteredTasks.length > 0 && (
                                    <div>
                                        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 px-2 py-1 uppercase tracking-wider">Tasks</div>
                                        {filteredTasks.map((task) => (
                                            <button
                                                key={task.id}
                                                onClick={() => {
                                                    navigate(`/projectsDetail?id=${task.projectId}&tab=tasks&taskId=${task.id}`);
                                                    setSearchQuery("");
                                                }}
                                                className="w-full text-left px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 flex flex-col text-sm text-zinc-800 dark:text-zinc-200 transition"
                                            >
                                                <div className="flex justify-between w-full items-center">
                                                    <span className="font-medium truncate">{task.title}</span>
                                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 capitalize">{task.status.toLowerCase()}</span>
                                                </div>
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">Project: {task.projectName}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {searchQuery && filteredProjects.length === 0 && filteredTasks.length === 0 && (
                            <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 p-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                                No projects or tasks match "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">

                    {/* Theme Toggle */}
                    <button onClick={() => dispatch(toggleTheme())} className="size-8 flex items-center justify-center bg-white dark:bg-zinc-800 shadow rounded-lg transition hover:scale-105 active:scale-95">
                        {
                            theme === "light"
                                ? (<MoonIcon className="size-4 text-gray-800 dark:text-gray-200" />)
                                : (<SunIcon className="size-4 text-yellow-400" />)
                        }
                    </button>

                    {/* User Button */}
                    <UserButton />
                </div>
            </div>
        </div>
    )
}

export default Navbar
