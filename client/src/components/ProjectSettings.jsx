import { format } from "date-fns";
import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AddProjectMember from "./AddProjectMember";
import { useDispatch, useSelector } from "react-redux";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/api";
import { updateProject, fetchWorkspaces } from "../features/workspaceSlice";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ProjectSettings({ project }) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const { user } = useUser();
    const currentWorkspace = useSelector((state) => state?.workspace?.currentWorkspace || null);

    const isWorkspaceAdmin = currentWorkspace?.members?.some(
        (m) => m.userId === user?.id && m.role === "ADMIN"
    );
    const isTeamLead = project.team_lead === user?.id;
    const canManageMembers = isWorkspaceAdmin || isTeamLead;

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState(null);

    const handleRemoveMember = async (memberUserId) => {
        toast.loading("Removing member...");
        try {
            const token = await getToken();
            await api.delete(`/api/projects/${project.id}/members/${memberUserId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            dispatch(fetchWorkspaces({ getToken }));
            toast.dismissAll();
            toast.success("Member removed from project successfully");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to remove member");
        }
    };

    const handleDeleteProject = async () => {
        toast.loading("Deleting project...");
        try {
            const token = await getToken();
            await api.delete(`/api/projects/${project.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            toast.dismissAll();
            toast.success("Project deleted successfully!");
            dispatch(fetchWorkspaces({ getToken }));
            navigate("/projects");
        } catch (error) {
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to delete project");
        }
    };

    const [formData, setFormData] = useState({
        name: "New Website Launch",
        description: "Initial launch for new web platform.",
        status: "PLANNING",
        priority: "MEDIUM",
        start_date: "2025-09-10",
        end_date: "2025-10-15",
        progress: 30,
    });

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        toast.loading("Saving...")

        try {
            const token = await getToken();
            const { data } = await api.put(
                "/api/projects",
                {
                    ...formData,
                    workspaceId: project.workspaceId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            dispatch(updateProject(data.project));
            toast.dismissAll();
            toast.success(data.message || "Project updated successfully!");
        } catch (error) {
            console.error(error);
            toast.dismissAll();
            toast.error(error.response?.data?.message || "Failed to update project");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (project) setFormData(project);
    }, [project]);

    const inputClasses = "w-full px-3 py-2 rounded mt-2 border text-sm dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-300";

    const cardClasses = "rounded-lg border p-6 not-dark:bg-white dark:bg-gradient-to-br dark:from-zinc-800/70 dark:to-zinc-900/50 border-zinc-300 dark:border-zinc-800";

    const labelClasses = "text-sm text-zinc-600 dark:text-zinc-400";

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            {/* Project Details */}
            <div className={cardClasses}>
                <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">Project Details</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Project Name</label>
                        <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClasses} required disabled={!canManageMembers} />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Description</label>
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputClasses + " h-24"} disabled={!canManageMembers} />
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelClasses}>Status</label>
                            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={inputClasses} disabled={!canManageMembers} >
                                <option value="PLANNING">Planning</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ON_HOLD">On Hold</option>
                                <option value="COMPLETED">Completed</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className={labelClasses}>Priority</label>
                            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className={inputClasses} disabled={!canManageMembers} >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4 grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className={labelClasses}>Start Date</label>
                            <input type="date" value={formData.start_date ? format(new Date(formData.start_date), "yyyy-MM-dd") : ""} onChange={(e) => setFormData({ ...formData, start_date: e.target.value ? new Date(e.target.value) : null })} className={inputClasses} disabled={!canManageMembers} />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClasses}>End Date</label>
                            <input type="date" value={formData.end_date ? format(new Date(formData.end_date), "yyyy-MM-dd") : ""} onChange={(e) => setFormData({ ...formData, end_date: e.target.value ? new Date(e.target.value) : null })} className={inputClasses} disabled={!canManageMembers} />
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <label className={labelClasses}>Progress: {formData.progress}%</label>
                        <input type="range" min="0" max="100" step="5" value={formData.progress} onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })} className="w-full accent-blue-500 dark:accent-blue-400" disabled={!canManageMembers} />
                    </div>

                    {/* Save Button */}
                    {canManageMembers && (
                        <button type="submit" disabled={isSubmitting} className="ml-auto flex items-center text-sm justify-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded" >
                            <Save className="size-4" /> {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    )}
                </form>
            </div>

            {/* Team Members */}
            <div className="space-y-6">
                <div className={cardClasses}>
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-300 mb-4">
                            Team Members <span className="text-sm text-zinc-600 dark:text-zinc-400">({project.members.length})</span>
                        </h2>
                        {canManageMembers && (
                            <button type="button" onClick={() => setIsDialogOpen(true)} className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800" >
                                <Plus className="size-4 text-zinc-900 dark:text-zinc-300" />
                            </button>
                        )}
                        <AddProjectMember isDialogOpen={isDialogOpen} setIsDialogOpen={setIsDialogOpen} />
                    </div>

                    {/* Member List */}
                    {project.members.length > 0 && (
                        <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                            {project.members.map((member, index) => (
                                <div key={index} className="flex items-center justify-between px-3 py-2 rounded dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-300" >
                                    <span> {member?.user?.email || "Unknown"} </span>
                                    {project.team_lead === member.user.id ? (
                                        <span className="px-2 py-0.5 rounded-xs ring ring-zinc-200 dark:ring-zinc-600 text-xs">Team Lead</span>
                                    ) : (
                                        canManageMembers && (
                                            <button 
                                                type="button" 
                                                onClick={() => setMemberToRemove(member.user.id)}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
                                                title="Remove member"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        )
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                {isWorkspaceAdmin && (
                    <div className="rounded-lg border border-red-300 dark:border-red-900/30 p-6 bg-red-50/10 dark:bg-red-950/5">
                        <h2 className="text-lg font-medium text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            Once you delete a project, there is no going back. All associated tasks, milestones, and project records will be permanently removed.
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-semibold rounded bg-red-600 hover:bg-red-700 text-white transition-colors animate-pulse hover:animate-none"
                        >
                            Delete Project
                        </button>
                    </div>
                )}
            </div>

            {/* Custom Confirmation Modals */}
            <ConfirmationModal
                isOpen={memberToRemove !== null}
                onClose={() => setMemberToRemove(null)}
                onConfirm={() => handleRemoveMember(memberToRemove)}
                title="Remove Team Member"
                message="Are you sure you want to remove this member from the project?"
                confirmText="Remove"
                isDanger={true}
            />

            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDeleteProject}
                title="Delete Project"
                message="Are you sure you want to delete this project? This action is permanent and all associated tasks, comments, and milestones will be lost forever."
                confirmText="Delete Project"
                isDanger={true}
            />
        </div>
    );
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDanger = false }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                <h3 className={`text-lg font-semibold ${isDanger ? 'text-red-600 dark:text-red-400' : 'text-zinc-900 dark:text-white'}`}>
                    {title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                    {message}
                </p>
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition ${isDanger ? 'bg-red-600 hover:bg-red-700 animate-pulse hover:animate-none' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
