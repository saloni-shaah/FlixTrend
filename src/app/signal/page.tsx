
"use client";
import React, { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { getFirestore, collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, writeBatch, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove, deleteField, limit } from "firebase/firestore";
import { auth, db, app } from "@/utils/firebaseClient";
import { Phone, Video, Paperclip, Mic, Send, ArrowLeft, Image as ImageIcon, X, Smile, Trash2, Users, CheckSquare, Square, MoreVertical, UserPlus, UserX, Edit, Shield, EyeOff, LogOut, UploadCloud, UserCircle, Cake, MapPin, AtSign, User, Bot, Search, Check } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { createCall } from "@/utils/callService";
import { motion, AnimatePresence } from "framer-motion";
import { uploadFileToFirebaseStorage } from '@/app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { getFunctions, httpsCallable } from "firebase/functions";


const functions = getFunctions(app);
const deleteMessageCallable = httpsCallable(functions, 'deleteMessage');


const anonymousNames = ["Ram", "Shyam", "Sita", "Mohan", "Krishna", "Radha", "Anchal", "Anaya", "Advik", "Diya", "Rohan", "Priya", "Arjun", "Saanvi", "Kabir"];
const generateAnonymousName = (userId: string, chatId: string) => {
    // Simple hash function to get a somewhat consistent but random-looking name
    const hash = (str: string) => {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        }
        return h;
    };
    const nameIndex = Math.abs(hash(userId + chatId)) % anonymousNames.length;
    const num = Math.abs(hash(chatId + userId)) % 900 + 100; // 3-digit number
    return `${anonymousNames[nameIndex]}${num}`;
};


function CreateGroupModal({ mutuals, currentUser, onClose, onGroupCreated }: { mutuals: any[], currentUser: any, onClose: () => void, onGroupCreated: (group:any) => void }) {
    const [selectedUids, setSelectedUids] = useState<string[]>([]);
    const [groupName, setGroupName] = useState('');
    const [groupBio, setGroupBio] = useState('');
    const [groupPictureFile, setGroupPictureFile] = useState<File | null>(null);
    const [groupPicturePreview, setGroupPicturePreview] = useState<string | null>(null);
    const [groupType, setGroupType] = useState<'simple' | 'anonymous' | 'pseudonymous'>('simple');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleToggleUser = (uid: string) => {
        setSelectedUids(prev => 
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
    };
    
    const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setGroupPictureFile(file);
            setGroupPicturePreview(URL.createObjectURL(file));
        }
    };

    const handleCreateGroup = async () => {
        if (selectedUids.length < 1 && groupType !== 'anonymous') {
            setError("You must select at least one other member for this group type.");
            return;
        }
        if (!groupName.trim()) {
            setError("Please give your group a name.");
            return;
        }
        setLoading(true);
        setError('');

        try {
            let groupPictureUrl = `https://api.dicebear.com/8.x/identicon/svg?seed=${groupName}`;
            if(groupPictureFile){
                const formData = new FormData();
                formData.append('file', groupPictureFile);
                formData.append('userId', currentUser.uid);
                const result = await uploadFileToFirebaseStorage(formData);
                if(result.success?.url) groupPictureUrl = result.success.url;
            }

            const memberUids = [...new Set([...selectedUids, currentUser.uid])];
            const memberProfiles = await Promise.all(
                memberUids.map(async uid => {
                    const userDoc = await getDoc(doc(db, "users", uid));
                    return userDoc.exists() ? { uid, ...userDoc.data() } : null;
                })
            );

            const validMembers = memberProfiles.filter(Boolean) as {uid: string, name: string, avatar_url: string, username: string}[];

            let pseudonyms: any = {};
            if (groupType === 'pseudonymous') {
                validMembers.forEach(member => {
                    pseudonyms[member!.uid] = generateAnonymousName(member!.uid, groupName); // Use group name as part of seed
                });
            }

            const groupDocRef = await addDoc(collection(db, "groups"), {
                name: groupName,
                bio: groupBio,
                avatar_url: groupPictureUrl,
                members: memberUids,
                memberInfo: validMembers.reduce((acc, user) => ({ ...acc, [user!.uid]: { name: user!.name, avatar_url: user!.avatar_url, username: user!.username } }), {}),
                admins: [currentUser.uid],
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                isGroup: true,
                groupType: groupType,
                pseudonyms: groupType === 'pseudonymous' ? pseudonyms : {},
                typing: [],
            });
            
            const groupData = (await getDoc(groupDocRef)).data();

            if (groupType === 'simple') {
                await addDoc(collection(db, "chats", groupDocRef.id, "messages"), {
                    text: `${currentUser.displayName} created the group "${groupName}"`,
                    sender: 'system',
                    createdAt: serverTimestamp(),
                    readBy: [currentUser.uid]
                });
            }
            
            onGroupCreated({ id: groupDocRef.id, ...groupData });
            onClose();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };
    
    const getInitials = (user: any) => user?.name?.[0] || user?.username?.[0] || "U";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-6 w-full max-w-md relative flex flex-col max-h-[90vh]"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">&times;</button>
                <h2 className="text-xl font-headline font-bold mb-4 text-accent-cyan">Create a New Group</h2>
                
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-24 h-24 rounded-full bg-black/20 flex items-center justify-center cursor-pointer relative overflow-hidden shrink-0">
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePictureChange} accept="image/*"/>
                        {groupPicturePreview ? <img src={groupPicturePreview} alt="group" className="w-full h-full object-cover"/> : <UploadCloud className="text-gray-400"/>}
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <input
                            type="text"
                            placeholder="Group Name"
                            className="input-glass w-full"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                        />
                        <textarea placeholder="Group Bio (optional)" value={groupBio} onChange={(e) => setGroupBio(e.target.value)} className="input-glass w-full text-sm" rows={2}/>
                    </div>
                </div>

                <div className="flex gap-2 mb-4">
                    <button onClick={() => setGroupType('simple')} className={`flex-1 btn-glass text-xs ${groupType === 'simple' ? 'bg-accent-cyan text-black' : ''}`}>Simple</button>
                    <button onClick={() => setGroupType('pseudonymous')} className={`flex-1 btn-glass text-xs ${groupType === 'pseudonymous' ? 'bg-accent-cyan text-black' : ''}`}>Pseudonymous</button>
                    <button onClick={() => setGroupType('anonymous')} className={`flex-1 btn-glass text-xs ${groupType === 'anonymous' ? 'bg-accent-cyan text-black' : ''}`}>Anonymous</button>
                </div>
                 <p className="text-xs text-gray-400 mb-4 -mt-2 text-center">
                    {groupType === 'simple' && 'Standard group chat with your mutuals.'}
                    {groupType === 'pseudonymous' && 'Members are known, but names are hidden behind pseudonyms.'}
                    {groupType === 'anonymous' && 'Publicly joinable group where all members are anonymous.'}
                </p>


                {groupType !== 'anonymous' && <>
                    <h3 className="font-bold mb-2 text-accent-cyan">Select Members</h3>
                    <div className="flex-1 overflow-y-auto mb-4 border-y border-accent-cyan/10 max-h-60">
                        {mutuals.map(user => (
                            <div key={user.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent-cyan/10 cursor-pointer" onClick={() => handleToggleUser(user.uid)}>
                                {selectedUids.includes(user.uid) ? <CheckSquare className="text-accent-cyan"/> : <Square className="text-gray-500"/>}
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                                    {user.avatar_url ? <img src={user.avatar_url} alt={user.name || user.username} className="w-full h-full object-cover"/> : getInitials(user)}
                                </div>
                                <div>
                                    <div className="font-bold">{user.name || user.username}</div>
                                    <div className="text-xs text-gray-400">@{user.username}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>}


                {error && <p className="text-red-400 text-center mb-2">{error}</p>}
                
                <button className="btn-glass bg-accent-cyan text-black" onClick={handleCreateGroup} disabled={loading}>
                    {loading ? "Creating..." : "Create Group"}
                </button>
            </motion.div>
        </div>
    );
}

function GroupInfoPanel({ group, currentUser, mutuals, onClose, onGroupUpdate, onGroupDeleted, onLeaveGroup }: { group: any, currentUser: any, mutuals: any[], onClose: () => void, onGroupUpdate: (updatedGroup:any)=>void, onGroupDeleted: (groupId:string) => void, onLeaveGroup: (groupId: string) => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [groupName, setGroupName] = useState(group.name);
    const [groupBio, setGroupBio] = useState(group.bio || "");
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const isAdmin = group.admins?.includes(currentUser.uid);

    const handleUpdateInfo = async () => {
        const groupRef = doc(db, "groups", group.id);
        await updateDoc(groupRef, { name: groupName, bio: groupBio });
        onGroupUpdate({ ...group, name: groupName, bio: groupBio });
        setIsEditing(false);
    };

    const handleAddMember = async (userToAdd: any) => {
        const groupRef = doc(db, "groups", group.id);
        
        let updateData: any = {
            members: arrayUnion(userToAdd.uid),
            [`memberInfo.${userToAdd.uid}`]: { name: userToAdd.name, avatar_url: userToAdd.avatar_url, username: userToAdd.username }
        };
        
        if(group.groupType === 'pseudonymous'){
             updateData[`pseudonyms.${userToAdd.uid}`] = generateAnonymousName(userToAdd.uid, group.id);
        }
        
        await updateDoc(groupRef, updateData);
        if (group.groupType === 'simple') {
            await addDoc(collection(db, "chats", group.id, "messages"), {
                    text: `${userToAdd.name} was added to the group.`,
                    sender: 'system',
                    createdAt: serverTimestamp(),
                    readBy: [currentUser.uid]
                });
        }
        
        const updatedGroupDoc = await getDoc(groupRef);
        onGroupUpdate({ id: updatedGroupDoc.id, ...updatedGroupDoc.data() });
    };

    const handleRemoveMember = async (uidToRemove: string) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        const groupRef = doc(db, "groups", group.id);
        const memberName = group.memberInfo[uidToRemove]?.name || 'A user';

        const updateData: any = {
            members: arrayRemove(uidToRemove),
            [`memberInfo.${uidToRemove}`]: deleteField(),
        };

        if(group.groupType === 'pseudonymous'){
             updateData[`pseudonyms.${uidToRemove}`] = deleteField();
        }
        
        await updateDoc(groupRef, updateData);

        if (group.groupType === 'simple') {
            await addDoc(collection(db, "chats", group.id, "messages"), {
                    text: `${memberName} was removed from the group.`,
                    sender: 'system',
                    createdAt: serverTimestamp(),
                    readBy: [currentUser.uid]
                });
        }
         const updatedGroupDoc = await getDoc(groupRef);
         onGroupUpdate({ id: updatedGroupDoc.id, ...updatedGroupDoc.data() });
    };

    const handleLeave = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) return;
        onLeaveGroup(group.id);
    };

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to PERMANENTLY DELETE this group and all its messages? This cannot be undone.")) return;
        onGroupDeleted(group.id);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const getInitials = (user: any) => user?.name?.[0] || user?.username?.[0] || "U";
    
    const usersToAdd = mutuals.filter(m => !group.members.includes(m.uid));
    const memberInfo = group.memberInfo || {};


    return (
        <AnimatePresence>
        <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 z-20 w-full md:w-2/5 md:min-w-[380px] h-full bg-black/80 backdrop-blur-lg border-l border-accent-cyan/20 flex flex-col"
        >
            <div className="p-4 border-b border-accent-cyan/10 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-headline font-bold text-accent-cyan">Group Info</h2>
                 <div className="flex items-center gap-2">
                    <div className="relative" ref={menuRef}>
                        <button onClick={() => setShowMenu(v => !v)} className="p-2 rounded-full hover:bg-accent-cyan/10"><MoreVertical size={20}/></button>
                        {showMenu && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute top-full right-0 mt-2 w-48 bg-gray-800 border border-accent-cyan/20 rounded-lg shadow-lg z-10">
                                {isAdmin && <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-accent-cyan/10 flex items-center gap-2"><Edit size={16}/> Edit Info</button>}
                                <button onClick={handleLeave} className="w-full text-left px-4 py-2 hover:bg-accent-pink/10 text-accent-pink flex items-center gap-2"><LogOut size={16}/> Leave Group</button>
                                {isAdmin && <button onClick={handleDelete} className="w-full text-left px-4 py-2 hover:bg-red-500/20 text-red-500 flex items-center gap-2"><Trash2 size={16}/> Delete Group</button>}
                            </motion.div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-accent-cyan/10"><X size={20}/></button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-5xl mb-4 overflow-hidden">
                       {group.avatar_url ? <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover"/> : <Users/>}
                    </div>
                    {isEditing ? (
                        <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} className="input-glass text-xl font-bold text-center w-full"/>
                    ) : (
                        <h3 className="text-2xl font-bold text-white">{group.name}</h3>
                    )}
                     {isEditing ? (
                        <textarea value={groupBio} onChange={e => setGroupBio(e.target.value)} className="input-glass text-sm text-center w-full mt-2" placeholder="Group bio..."/>
                    ) : (
                        <p className="text-sm text-gray-400 mt-1">{group.bio || "No bio set."}</p>
                    )}
                    {isAdmin && isEditing && (
                        <div className="flex gap-2 mt-2">
                            <button onClick={handleUpdateInfo} className="text-xs px-2 py-1 rounded bg-green-500/80 text-white">Save</button>
                            <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-1 rounded bg-gray-500/80 text-white">Cancel</button>
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <h4 className="font-bold text-accent-cyan mb-2">{group.members.length} Members</h4>
                    <div className="flex flex-col gap-2">
                        {group.members.map((uid: string) => {
                            const member = memberInfo[uid];
                            if (!member) return null;
                            const displayName = group.groupType === 'pseudonymous' ? group.pseudonyms?.[uid] || 'Anon' : member.name;
                            const displayUsername = group.groupType === 'pseudonymous' ? '???' : member.username;
                            
                            return (
                                <div key={uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent-cyan/10">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                                        {group.groupType === 'simple' && member.avatar_url ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover"/> : 
                                         group.groupType === 'pseudonymous' ? <EyeOff size={20}/> : 
                                         group.groupType === 'anonymous' ? <Shield size={20} /> :
                                         getInitials(member)}
                                    </div>
                                    <div>
                                        <p className="font-bold">{displayName}</p>
                                        <p className="text-xs text-gray-400">@{displayUsername}</p>
                                    </div>
                                    {isAdmin && uid !== currentUser.uid && (
                                        <button onClick={() => handleRemoveMember(uid)} className="ml-auto p-2 rounded-full hover:bg-red-500/20 text-red-400"><UserX size={16}/></button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {isAdmin && group.groupType !== 'anonymous' && (
                    <div>
                        <button onClick={() => setIsAdding(!isAdding)} className="w-full btn-glass flex items-center justify-center gap-2">
                            <UserPlus size={16}/> {isAdding ? "Cancel" : "Add Members"}
                        </button>
                         {isAdding && (
                            <div className="mt-4 flex flex-col gap-2">
                                <h4 className="font-bold text-accent-cyan">Select users to add</h4>
                                {usersToAdd.length > 0 ? usersToAdd.map((user:any) => (
                                     <div key={user.uid} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent-cyan/10">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                                            {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover"/> : getInitials(user)}
                                        </div>
                                        <div>
                                            <p className="font-bold">{user.name}</p>
                                            <p className="text-xs text-gray-400">@{user.username}</p>
                                        </div>
                                        <button onClick={() => handleAddMember(user)} className="ml-auto p-2 rounded-full hover:bg-green-500/20 text-green-400"><UserPlus size={16}/></button>
                                    </div>
                                )) : <p className="text-sm text-gray-400 text-center">No more mutuals to add.</p>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
        </AnimatePresence>
    )
}

function UserInfoPanel({ user, onClose }: { user: any, onClose: () => void }) {
    if (!user) return null;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute top-0 right-0 z-20 w-full md:w-2/5 md:min-w-[380px] h-full bg-black/80 backdrop-blur-lg border-l border-accent-cyan/20 flex flex-col"
            >
                <div className="p-4 border-b border-accent-cyan/10 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-headline font-bold text-accent-cyan">Profile Info</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-accent-cyan/10"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-5xl mb-4 overflow-hidden">
                            {user.avatar_url ? <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" /> : <UserCircle />}
                        </div>
                        <h3 className="text-2xl font-bold text-white">{user.name}</h3>
                        <p className="text-accent-cyan font-semibold mb-1 text-center">@{user.username}</p>
                    </div>

                    <div className="flex flex-col gap-3 text-sm">
                         <div className="glass-card p-3 rounded-lg">
                            <h4 className="text-xs text-gray-400 mb-1">Bio</h4>
                            <p className="text-white">{user.bio || 'No bio provided.'}</p>
                        </div>
                        <div className="glass-card p-3 rounded-lg">
                            <h4 className="text-xs text-gray-400 mb-1 flex items-center gap-2"><Phone size={14}/> Phone</h4>
                            <p className="text-white">{user.phoneNumber || 'Not specified'}</p>
                        </div>
                         <div className="glass-card p-3 rounded-lg">
                            <h4 className="text-xs text-gray-400 mb-1 flex items-center gap-2"><MapPin size={14}/> Location</h4>
                            <p className="text-white">{user.location || 'Not specified'}</p>
                        </div>
                         <div className="glass-card p-3 rounded-lg">
                            <h4 className="text-xs text-gray-400 mb-1 flex items-center gap-2"><Cake size={14}/> Date of Birth</h4>
                            <p className="text-white">{user.dob || 'Not specified'}</p>
                        </div>
                         <div className="glass-card p-3 rounded-lg">
                            <h4 className="text-xs text-gray-400 mb-1 flex items-center gap-2"><User size={14}/> Gender</h4>
                            <p className="text-white capitalize">{user.gender || 'Not specified'}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}

function timeSince(date: Date) {
    if (!date) return "";
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
}

// Custom hook for long press
const useLongPress = (callback: () => void, ms = 300) => {
    const timerRef = useRef<NodeJS.Timeout>();

    const onTouchStart = () => {
        timerRef.current = setTimeout(callback, ms);
    };
    const onTouchEnd = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };

    return {
        onTouchStart,
        onTouchEnd,
        onMouseDown: onTouchStart,
        onMouseUp: onTouchEnd,
        onMouseLeave: onTouchEnd,
    };
};

function ClientOnlySignalPage({ firebaseUser, userProfile }: { firebaseUser: any, userProfile: any }) {
    const [chats, setChats] = useState<any[]>([]);
    const [joinableGroups, setJoinableGroups] = useState<any[]>([]);
    const { selectedChat, setSelectedChat, drafts, setDraft } = useAppState();
    const [messages, setMessages] = useState<any[]>([]);
    const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);
        return () => window.removeEventListener('resize', checkIsMobile);
    }, []);
    const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [showUserInfo, setShowUserInfo] = useState(false);
    const [onlineStatus, setOnlineStatus] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typingStatus, setTypingStatus] = useState<string[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // --- SELECTION & DELETION STATE ---
    const [selectionMode, setSelectionMode] = useState<'chats' | 'messages' | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    
    useEffect(() => {
        if (selectedChat?.id && drafts[selectedChat.id]) {
            setNewMessage(drafts[selectedChat.id]);
        } else {
            setNewMessage('');
        }
    }, [selectedChat, drafts]);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if(!selectedChat) return;
        setDraft(selectedChat.id, e.target.value);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        
        updateDoc(doc(db, selectedChat.isGroup ? "groups" : "users", selectedChat.id), {
            typing: arrayUnion(firebaseUser.uid)
        }).catch(() => {});

        typingTimeoutRef.current = setTimeout(() => {
            updateDoc(doc(db, selectedChat.isGroup ? "groups" : "users", selectedChat.id), {
                typing: arrayRemove(firebaseUser.uid)
            }).catch(() => {});
        }, 3000);
    };


    useEffect(() => {
        if (!firebaseUser) return;

        // Fetch user's chats (groups and DMs)
        const qGroups = query(collection(db, "groups"), where("members", "array-contains", firebaseUser.uid));
        const unsubGroups = onSnapshot(qGroups, async (groupsSnap) => {
            const groupChats = await Promise.all(groupsSnap.docs.map(async (d) => {
                const groupData = { id: d.id, ...d.data(), isGroup: true };
                const lastMsgQuery = query(collection(db, "chats", d.id, "messages"), orderBy("createdAt", "desc"), limit(1));
                const lastMsgSnap = await getDocs(lastMsgQuery);
                const lastMessage = lastMsgSnap.empty ? null : lastMsgSnap.docs[0].data();
                return { ...groupData, lastMessage };
            }));

            const followingRef = collection(db, "users", firebaseUser.uid, "following");
            const followersRef = collection(db, "users", firebaseUser.uid, "followers");
            const [followingSnap, followersSnap] = await Promise.all([getDocs(followingRef), getDocs(followersRef)]);
            
            const followingIds = followingSnap.docs.map(doc => doc.id);
            const followerIds = followersSnap.docs.map(doc => doc.id);
            const allConnections = Array.from(new Set([...followingIds, ...followerIds]));
            
            const userProfiles = await Promise.all(
              allConnections.map(async (uid) => {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (!userDoc.exists()) return null;
                
                const chatId = getChatId(firebaseUser.uid, uid);
                const lastMsgQuery = query(collection(db, "chats", chatId, "messages"), orderBy("createdAt", "desc"), limit(1));
                const lastMsgSnap = await getDocs(lastMsgQuery);
                const lastMessage = lastMsgSnap.empty ? null : lastMsgSnap.docs[0].data();

                return { uid, ...userDoc.data(), isGroup: false, id: uid, lastMessage };
              })
            );
            
            const oneOnOneChats = userProfiles.filter(Boolean) as any[];
            const allUserChats = [...groupChats, ...oneOnOneChats].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
            
            allUserChats.sort((a,b) => (b.lastMessage?.createdAt?.toDate() || b.createdAt?.toDate() || 0) - (a.lastMessage?.createdAt?.toDate() || a.createdAt?.toDate() || 0));

            setChats(allUserChats);
        });

        const qJoinable = query(collection(db, "groups"), where("groupType", "==", "anonymous"));
        const unsubJoinable = onSnapshot(qJoinable, (snap) => {
            const allAnonGroups = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), isGroup: true }));
            const nonMemberGroups = allAnonGroups.filter(g => !(g.members as any[])?.includes(firebaseUser.uid));
            setJoinableGroups(nonMemberGroups);
        });

        return () => {
            unsubGroups();
            if (unsubJoinable) unsubJoinable();
        };

    }, [firebaseUser]);

   useEffect(() => {
        if (!selectedChat) return;

        let unsub: any;
        if (selectedChat.isGroup) {
            unsub = onSnapshot(doc(db, 'groups', selectedChat.id), (doc) => {
                const data = doc.data();
                if (data?.typing) {
                    setTypingStatus(data.typing.filter((uid: string) => uid !== firebaseUser.uid));
                }
            });
        } else {
             unsub = onSnapshot(doc(db, 'users', selectedChat.uid), (doc) => {
                const data = doc.data();
                if (data) {
                    setOnlineStatus({ status: data.status, lastSeen: data.lastSeen?.toDate() });
                    if(data.typing?.includes(firebaseUser.uid)) {
                        setTypingStatus([selectedChat.uid]);
                    } else {
                        setTypingStatus([]);
                    }
                }
            });
        }
       
        return () => unsub();
   }, [selectedChat, firebaseUser.uid]);


  const handleSelectChat = async (chat: any) => {
    setSelectedChat(chat);
    setShowGroupInfo(false);
    setShowUserInfo(false);
    setShowEmojiPicker(null);
    setNewMessage(drafts[chat.id] || '');
    
    let chatId: string;
    chatId = chat.isGroup ? chat.id : getChatId(firebaseUser.uid, chat.uid);
    
    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "asc")
    );
    
    const unsubMessages = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unreadQuery = query(
        collection(db, "chats", chatId, "messages"), 
        where("readBy", "not-in", [[firebaseUser.uid]])
    );
    const unreadDocs = await getDocs(unreadQuery);
    const batch = writeBatch(db);
    let hasUnread = false;
    unreadDocs.forEach(doc => {
      const data = doc.data();
      if(!data.readBy || !data.readBy.includes(firebaseUser.uid)){
        hasUnread = true;
        batch.update(doc.ref, { readBy: arrayUnion(firebaseUser.uid) });
      }
    });
    if(hasUnread) await batch.commit();

    return () => unsubMessages();
  };
  
  const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join("_");
  
  useEffect(() => {
    if (!selectedChat) return;
    // When a new chat is selected, clear any active message selection
    setSelectionMode(null);
    setSelectedItems(new Set());
    const unsub = handleSelectChat(selectedChat);
    return () => {
        if (typeof unsub === 'function') {
            unsub();
        }
    };
  }, [selectedChat?.id, firebaseUser.uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const [newMessage, setNewMessage] = useState("");
  const handleSend = async (e: React.FormEvent, mediaUrl: string | null = null, type: 'text' | 'image' | 'video' | 'audio' = 'text') => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaUrl) || !firebaseUser || !selectedChat) return;
    
    const textToSend = newMessage;
    setNewMessage("");
    setDraft(selectedChat.id, '');
    updateDoc(doc(db, selectedChat.isGroup ? "groups" : "users", selectedChat.id), {
        typing: arrayRemove(firebaseUser.uid)
    }).catch(() => {});
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const chatId = selectedChat.isGroup ? selectedChat.id : getChatId(firebaseUser.uid, selectedChat.uid);
    const messageData: any = {
        sender: firebaseUser.uid,
        createdAt: serverTimestamp(),
        type: type,
        readBy: [firebaseUser.uid],
        reactions: {},
        deletedFor: []
    };

    if (mediaUrl) {
        messageData.mediaUrl = mediaUrl;
        messageData.text = textToSend; // Caption
    } else {
        messageData.text = textToSend;
    }
    
    if(selectedChat.groupType === 'anonymous' || selectedChat.groupType === 'pseudonymous'){
        // In anonymous/pseudonymous groups, we don't send the real user info with the message
    } else {
        messageData.senderInfo = {
            name: userProfile?.name || firebaseUser.displayName,
            avatar_url: userProfile?.avatar_url || firebaseUser.photoURL
        }
    }


    await addDoc(collection(db, "chats", chatId, "messages"), messageData);
  };
  
    const handleDeleteMessages = async (mode: 'me' | 'everyone') => {
        if (!selectedChat || selectedItems.size === 0) return;
    
        const itemsToDelete = Array.from(selectedItems);
    
        for (const messageId of itemsToDelete) {
            try {
                await deleteMessageCallable({
                    chatId: selectedChat.isGroup ? selectedChat.id : getChatId(firebaseUser.uid, selectedChat.uid),
                    messageId: messageId,
                    mode: mode
                });
            } catch (error) {
                console.error(`Failed to delete message ${messageId}:`, error);
                // Optionally show a toast to the user
            }
        }
    
        setSelectedItems(new Set());
        setSelectionMode(null);
        setShowDeleteConfirm(false);
    };

    const handleDeleteChats = async () => {
        if (selectedItems.size === 0) return;
        const batch = writeBatch(db);
        selectedItems.forEach(chatId => {
            const userDeletedChatRef = doc(db, 'users', firebaseUser.uid, 'deletedChats', chatId);
            batch.set(userDeletedChatRef, {
                deletedAt: serverTimestamp()
            });
        });
        await batch.commit();
        // Optimistically remove from UI
        setChats(prev => prev.filter(c => !selectedItems.has(c.id)));
        setSelectedItems(new Set());
        setSelectionMode(null);
    };


  const handleReact = async (messageId: string, emoji: string) => {
    if (!selectedChat || !firebaseUser) return;
    const chatId = selectedChat.isGroup ? selectedChat.id : getChatId(firebaseUser.uid, selectedChat.uid);
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    const messageSnap = await getDoc(messageRef);
    const messageData = messageSnap.data();

    if (messageData) {
        const currentReactions = messageData.reactions || {};
        const uidsForEmoji = currentReactions[emoji] || [];

        if (uidsForEmoji.includes(firebaseUser.uid)) {
            const newUids = uidsForEmoji.filter((uid: string) => uid !== firebaseUser.uid);
            if (newUids.length > 0) {
                await updateDoc(messageRef, { [`reactions.${emoji}`]: newUids });
            } else {
                delete currentReactions[emoji];
                await updateDoc(messageRef, { reactions: currentReactions });
            }
        } else {
            await updateDoc(messageRef, {
              [`reactions.${emoji}`]: arrayUnion(firebaseUser.uid)
            });
        }
    }
    setShowEmojiPicker(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let type: 'image' | 'video' | 'audio' = 'image';
    if (file.type.startsWith('video/')) type = 'video';
    if (file.type.startsWith('audio/')) type = 'audio';
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', firebaseUser.uid);
        const result = await uploadFileToFirebaseStorage(formData);
        if (result.success?.url) {
            handleSend(new Event('submit') as any, result.success.url, type);
        } else {
          throw new Error(result.failure || "Upload failed");
        }
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Sorry, the file upload failed.");
    }

    if (e.target) e.target.value = '';
  };
  
  const handleCall = async (type: 'video' | 'voice') => {
    if (!selectedChat || selectedChat.isGroup) {
      alert("Calls can only be made in one-on-one chats for now.");
      return;
    };
    
    const callId = await createCall(firebaseUser, selectedChat);
    if (!callId) {
      alert("Failed to initiate call. Please try again.");
    }
  };

  const handleMicPress = async () => {
    if (isRecording) return;
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Error starting recording:", err);
    }
  };

  const handleMicRelease = async () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

    mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });

        try {
            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('userId', firebaseUser.uid);
            const result = await uploadFileToFirebaseStorage(formData);
            if (result.success?.url) {
                handleSend(new Event('submit') as any, result.success.url, 'audio');
            } else {
                throw new Error(result.failure || "Voice note upload failed.");
            }
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Sorry, the voice note upload failed.");
        }
    };
    setIsRecording(false);
  };
  
  const handleJoinAnonymousGroup = async (group: any) => {
    if (!firebaseUser) return;
    const groupRef = doc(db, "groups", group.id);
    await updateDoc(groupRef, {
        members: arrayUnion(firebaseUser.uid),
        [`memberInfo.${firebaseUser.uid}`]: { name: userProfile.name, avatar_url: userProfile.avatar_url, username: userProfile.username }
    });
    handleSelectChat({ ...group, members: [...group.members, firebaseUser.uid] }); 
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!firebaseUser) return;
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    if (!groupSnap.exists()) return;

    const groupData = groupSnap.data();
    const remainingMembers = groupData.members.filter((uid:string) => uid !== firebaseUser.uid);
    
    const batch = writeBatch(db);

    const updateData: any = {
        members: arrayRemove(firebaseUser.uid),
        [`memberInfo.${firebaseUser.uid}`]: deleteField(),
    };

    if (groupData.admins?.includes(firebaseUser.uid)) {
        updateData.admins = arrayRemove(firebaseUser.uid);
        if (updateData.admins.length === 0 && remainingMembers.length > 0) {
            updateData.admins = [remainingMembers[0]];
        }
    }
    
    if (groupData.pseudonyms?.[firebaseUser.uid]) {
        updateData[`pseudonyms.${firebaseUser.uid}`] = deleteField();
    }
    
    batch.update(groupRef, updateData);

    if (groupData.groupType === 'simple') {
        const messageRef = doc(collection(db, "chats", groupId, "messages"));
        batch.set(messageRef, {
            text: `${userProfile?.name || firebaseUser.displayName} left the group.`,
            sender: 'system',
            createdAt: serverTimestamp(),
            readBy: []
        });
    }
    
    await batch.commit();
    setSelectedChat(null);
  };
  
  const handleDeleteGroup = async (groupId: string) => {
      if (!window.confirm("Are you sure you want to PERMANENTLY DELETE this group and all its messages? This cannot be undone.")) return;

      try {
        const chatMessagesRef = collection(db, 'chats', groupId, 'messages');
        const messagesSnap = await getDocs(chatMessagesRef);
        const batch = writeBatch(db);
        messagesSnap.forEach(doc => batch.delete(doc.ref));
        
        const groupRef = doc(db, 'groups', groupId);
        batch.delete(groupRef);
        
        await batch.commit();
        
        setSelectedChat(null);
      } catch (error) {
        console.error("Error deleting group:", error);
        alert("Failed to delete group.");
      }
  }
  
  const getInitials = (user: any) => user?.name?.[0] || user?.username?.[0] || "U";
  
  const defaultReactions = ["👍", "❤️", "😂", "😢", "😮", "🙏"];

  const renderStatus = () => {
        if (!selectedChat) return null;
        if (typingStatus.length > 0) {
             const typingNames = selectedChat.isGroup 
                ? typingStatus.map(uid => selectedChat.memberInfo?.[uid]?.name.split(' ')[0] || 'Someone').slice(0, 2)
                : [];
             const text = selectedChat.isGroup ? `${typingNames.join(', ')} ${typingNames.length > 1 ? 'are' : 'is'} typing...` : 'typing...';
            return <p className="text-xs text-accent-cyan animate-pulse">{text}</p>;
        }
        if (onlineStatus?.status === 'online') {
            return <p className="text-xs text-green-400">Online</p>;
        }
        if (onlineStatus?.lastSeen) {
            return <p className="text-xs text-gray-400">Last seen {timeSince(onlineStatus.lastSeen)}</p>;
        }
        return <p className="text-xs text-gray-400">{selectedChat.isGroup ? `${selectedChat.members.length} members` : 'Offline'}</p>;
    }


  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    chat.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
    // --- SELECTION & DELETION LOGIC ---
    const handleLongPress = (type: 'chats' | 'messages', id: string) => {
        setSelectionMode(type);
        setSelectedItems(new Set([id]));
    };

    const handleItemClick = (type: 'chats' | 'messages', id: string) => {
        if (selectionMode === type) {
            const newSelection = new Set(selectedItems);
            if (newSelection.has(id)) {
                newSelection.delete(id);
            } else {
                newSelection.add(id);
            }
            setSelectedItems(newSelection);
            if (newSelection.size === 0) {
                setSelectionMode(null);
            }
        } else {
            handleSelectChat(chats.find(c => c.id === id));
        }
    };
    
    const cancelSelectionMode = () => {
        setSelectionMode(null);
        setSelectedItems(new Set());
    };
    
  return (
    <div className="flex h-screen w-full bg-transparent font-body text-white overflow-hidden">
        {showCreateGroup && <CreateGroupModal mutuals={chats.filter(c => !c.isGroup)} currentUser={userProfile} onClose={() => setShowCreateGroup(false)} onGroupCreated={(newGroup) => {
            setChats(prev => [newGroup, ...prev]);
            setSelectedChat(newGroup);
        }} />}

        {/* --- CHAT LIST VIEW --- */}
        <div className={`w-full md:w-1/3 md:min-w-[350px] border-r border-accent-cyan/10 bg-black/60 flex flex-col ${isMobile && selectedChat && !selectionMode ? "hidden" : ""}`}>
            {/* --- SELECTION HEADER FOR CHATS --- */}
            {selectionMode === 'chats' ? (
                <div className="p-4 border-b border-accent-cyan/10 flex items-center justify-between shrink-0 bg-accent-cyan/10">
                    <button onClick={cancelSelectionMode}><X size={24} /></button>
                    <span className="font-bold">{selectedItems.size} selected</span>
                    <button onClick={() => { if (window.confirm(`Hide ${selectedItems.size} chat(s) from your list?`)) handleDeleteChats(); }}><Trash2 size={24} /></button>
                </div>
            ) : (
                <div className="p-4 border-b border-accent-cyan/10 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-headline font-bold text-accent-cyan">Signal</h2>
                    <button className="btn-glass-icon w-10 h-10" title="Create Group" onClick={() => setShowCreateGroup(true)}>
                        <Users size={20} />
                    </button>
                </div>
            )}
            
            <div className="p-2">
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Search chats..."
                        className="input-glass w-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredChats.map((chat) => {
                    const longPressProps = useLongPress(() => handleLongPress('chats', chat.id));
                    const isSelected = selectedItems.has(chat.id);
                    return (
                        <div 
                            key={chat.id}
                            className={cn("w-full flex items-center gap-4 px-4 py-3 text-left transition-colors duration-200 group relative", isSelected ? "bg-accent-cyan/30" : "hover:bg-accent-cyan/10")} 
                            onClick={() => selectionMode === 'chats' ? handleItemClick('chats', chat.id) : handleSelectChat(chat)}
                            {...longPressProps}
                        >
                            {selectionMode === 'chats' && (
                                <div className="absolute left-2 top-1/2 -translate-y-1/2">
                                    {isSelected ? <CheckSquare className="text-accent-cyan"/> : <Square className="text-gray-500"/>}
                                </div>
                            )}
                            <div className={cn("w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0", selectionMode === 'chats' && "ml-8")}>
                                {chat.isGroup ? 
                                    (chat.avatar_url ? <img src={chat.avatar_url} alt={chat.name} className="w-full h-full object-cover"/> : (chat.groupType === 'anonymous' ? <Shield/> : chat.groupType === 'pseudonymous' ? <EyeOff/> : <Users/>)) :
                                    (chat.avatar_url ? <img src={chat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(chat))
                                }
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <span className="font-bold text-white block truncate">{chat.name || chat.username}</span>
                                <span className="text-xs text-gray-400 block truncate italic">
                                    {drafts[chat.id] ? <span className="text-red-400">[Draft] {drafts[chat.id]}</span> : chat.lastMessage?.text || "No messages yet"}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* --- MESSAGE VIEW --- */}
        <div className={`flex-1 flex flex-col bg-black/40 relative ${!selectedChat && isMobile ? "hidden" : ""}`}>
            {selectedChat ? (
                <>
                    {/* --- SELECTION HEADER FOR MESSAGES --- */}
                     {selectionMode === 'messages' ? (
                        <div className="flex items-center gap-3 p-3 border-b border-accent-cyan/10 bg-accent-cyan/10 shadow-md shrink-0">
                            <button onClick={cancelSelectionMode}><X size={24} /></button>
                            <span className="font-bold flex-1">{selectedItems.size} selected</span>
                            <button onClick={() => setShowDeleteConfirm(true)}><Trash2 size={24} /></button>
                        </div>
                     ) : (
                        <div className="flex items-center gap-3 p-3 border-b border-accent-cyan/10 bg-black/60 shadow-md shrink-0">
                            {isMobile && <button onClick={() => { setSelectedChat(null); cancelSelectionMode(); }} className="p-2 rounded-full hover:bg-accent-cyan/10"><ArrowLeft size={20}/></button>}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                            {selectedChat.isGroup ? 
                                    (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt={selectedChat.name} className="w-full h-full object-cover"/> : (selectedChat.groupType === 'anonymous' ? <Shield/> : selectedChat.groupType === 'pseudonymous' ? <EyeOff/> : <Users/>)) :
                                    (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(selectedChat))
                            }
                            </div>
                            <button className="flex-1 text-left" disabled={selectedChat.groupType === 'anonymous'} onClick={() => selectedChat.isGroup ? setShowGroupInfo(true) : setShowUserInfo(true)}>
                                <h3 className="font-bold text-white">{selectedChat.name || selectedChat.username}</h3>
                                {renderStatus()}
                            </button>
                            <div className="flex items-center gap-2">
                            {!selectedChat.isGroup && <button onClick={() => handleCall('video')} className="p-2 rounded-full hover:bg-accent-cyan/10"><Video size={20}/></button>}
                            {!selectedChat.isGroup && <button onClick={() => handleCall('voice')} className="p-2 rounded-full hover:bg-accent-cyan/10"><Phone size={20}/></button>}
                            </div>
                        </div>
                     )}
                    
                     <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                        {messages.filter(msg => !(msg.deletedFor || []).includes(firebaseUser.uid)).map(msg => {
                            const isUser = msg.sender === firebaseUser.uid;
                            const longPressProps = useLongPress(() => handleLongPress('messages', msg.id));
                            const isSelected = selectedItems.has(msg.id);
                            
                            const senderInfo = selectedChat.isGroup ?
                                (selectedChat.groupType === 'simple' ? selectedChat.memberInfo?.[msg.sender] : null)
                                : selectedChat;
                            
                            const displayName = selectedChat.groupType === 'anonymous' ? generateAnonymousName(msg.sender, selectedChat.id) : 
                                                selectedChat.groupType === 'pseudonymous' ? selectedChat.pseudonyms?.[msg.sender] || 'Anon' : 
                                                senderInfo?.name || "User";
                            
                            return (
                              <div 
                                key={msg.id} 
                                onClick={() => selectionMode === 'messages' && handleItemClick('messages', msg.id)}
                                {...longPressProps}
                                className={cn("group flex w-full items-end gap-2", isUser ? "justify-end" : msg.sender === 'system' ? 'justify-center' : "justify-start", selectionMode === 'messages' && "cursor-pointer")}
                              >
                                <div className={cn("flex items-end gap-2 max-w-[80%] md:max-w-[70%]", isSelected && "bg-accent-cyan/20 rounded-xl")}>
                                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                      <div className={`relative px-4 py-2 rounded-2xl transition-all duration-300 ${isUser ? "bg-accent-cyan text-white rounded-br-none" : msg.sender === 'system' ? "bg-gray-800 text-gray-400 text-xs italic" : "bg-gray-700 text-white rounded-bl-none"}`}>
                                          {!isUser && msg.sender !== 'system' && (
                                              <div className="font-bold text-sm text-accent-pink">{displayName}</div>
                                          )}
                                          {msg.type === 'image' && <img src={msg.mediaUrl} alt={msg.text || "image"} className="rounded-lg max-w-xs" />}
                                          {msg.type === 'video' && <video src={msg.mediaUrl} controls className="rounded-lg max-w-xs" />}
                                          {msg.type === 'audio' && <audio src={msg.mediaUrl} controls />}
                                          {msg.text && <p className="mt-1 break-words">{msg.text}</p>}
                                          
                                          {msg.sender !== 'system' && (
                                            <div className={`text-xs mt-1 flex items-center gap-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                <span>{msg.createdAt?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ""}</span>
                                            </div>
                                          )}
                                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                              <div className="absolute -bottom-4 -right-1 flex gap-1">
                                                  {Object.entries(msg.reactions).map(([emoji, uids]: [string, any]) => (
                                                      <div key={emoji} className="bg-gray-600 px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                                                          <span>{emoji}</span>
                                                          <span className="font-bold text-xs">{Array.isArray(uids) ? uids.length : 0}</span>
                                                      </div>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                      <div className={`relative hidden group-hover:flex items-center gap-1 mt-1 ${isUser ? "flex-row-reverse" : ""}`}>
                                      {msg.sender !== 'system' && 
                                          <>
                                              <div className="relative">
                                              <button onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-500"><Smile size={16}/></button>
                                                  <AnimatePresence>
                                                  {showEmojiPicker === msg.id && (
                                                      <motion.div 
                                                          initial={{ opacity: 0, y: 10 }}
                                                          animate={{ opacity: 1, y: 0 }}
                                                          exit={{ opacity: 0, y: 10 }}
                                                          className="absolute z-10 -top-10 bg-gray-800 rounded-full p-2 flex gap-1 shadow-lg"
                                                      >
                                                          {defaultReactions.map(emoji => (
                                                              <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                                                          ))}
                                                      </motion.div>
                                                  )}
                                                  </AnimatePresence>
                                              </div>
                                          </>
                                      }
                                      {isUser && <button onClick={() => setShowDeleteConfirm(true)} className="p-1 rounded-full bg-gray-600 hover:bg-red-500"><Trash2 size={16}/></button>}
                                      </div>
                                    </div>
                                  </div>
                              </div>
                              )
                          })}
                         <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="flex items-center gap-2 p-2 border-t border-accent-cyan/10 bg-black/60 shrink-0">
                         <button type="button" onClick={() to fileInputRef.current?.click()} className="p-3 rounded-full hover:bg-accent-cyan/20 transition-colors">
                            <Paperclip size={20}/>
                         </button>
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*" />
                        <AnimatePresence mode="wait">
                        {newMessage.trim() === "" ? (
                             <motion.button 
                                key="mic"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                type="button" 
                                className={`p-3 rounded-full transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-accent-pink text-white'}`}
                                onMouseDown={handleMicPress}
                                onMouseUp={handleMicRelease}
                                onTouchStart={handleMicPress}
                                onTouchEnd={handleMicRelease}
                             >
                                <Mic size={20}/>
                             </motion.button>
                        ) : (
                             <motion.button 
                                key="send"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                type="submit" 
                                className="p-3 rounded-full bg-accent-cyan text-white"
                             >
                                <Send size={20}/>
                             </motion.button>
                        )}
                        </AnimatePresence>
                        <input type="text" value={newMessage} onChange={handleInputChange} placeholder={isRecording ? "Recording..." : "Type a message..."} className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-cyan"/>
                    </form>
                    
                    {selectedChat.isGroup && showGroupInfo && (
                        <GroupInfoPanel 
                            group={selectedChat}
                            currentUser={firebaseUser}
                            mutuals={chats.filter(c => !c.isGroup)}
                            onClose={() => setShowGroupInfo(false)}
                            onGroupUpdate={(updatedGroup) => setSelectedChat(updatedGroup)}
                            onGroupDeleted={handleDeleteGroup}
                            onLeaveGroup={handleLeaveGroup}
                        />
                    )}
                     {!selectedChat.isGroup && showUserInfo && (
                        <UserInfoPanel
                            user={selectedChat}
                            onClose={() => setShowUserInfo(false)}
                        />
                    )}
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center p-4">
                    <div className="text-5xl mb-4 animate-bounce">💬</div>
                    <h3 className="text-xl font-bold">Select a chat</h3>
                    <p className="max-w-xs">Start a conversation with your mutuals or create a group to chat with friends.</p>
                </div>
            )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Message(s)?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete {selectedItems.size} message(s).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="grid grid-cols-1 md:flex">
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-800 hover:bg-red-700" onClick={() => handleDeleteMessages('me')}>Delete for Me</AlertDialogAction>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-500" onClick={() => handleDeleteMessages('everyone')}>Delete for Everyone</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}

function ChatMessageLoading() {
  return (
    <div className="flex items-start gap-3 animate-fade-in p-2">
      <div className="h-8 w-8 border rounded-full bg-gray-700 flex items-center justify-center">
        <Bot className="h-5 w-5 text-accent-purple" />
      </div>
      <div className="max-w-sm md:max-w-md rounded-lg bg-gray-700 p-3 text-white shadow-md">
        <div className="flex items-center justify-center space-x-1">
            <span className="sr-only">Loading...</span>
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent-cyan [animation-delay:-0.3s]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent-cyan [animation-delay:-0.15s]" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent-cyan" />
        </div>
      </div>
    </div>
  );
}

function Avatar({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={className}>{children}</div>;
}
function AvatarFallback({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={className}>{children}</div>;
}


function SignalPage() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setFirebaseUser(user);
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserProfile({ ...user, ...userDocSnap.data() });
        } else {
          // This case should ideally not happen if signup process is correct
          const newProfile = {
            uid: user.uid,
            name: user.displayName || "",
            username: user.displayName ? user.displayName.replace(/\s+/g, "").toLowerCase() : `user${user.uid.substring(0,5)}`,
            email: user.email || "",
            avatar_url: `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.uid}`,
          };
          setUserProfile({ ...user, ...newProfile });
        }
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
    });
    return () => unsub();
  }, []);
  
  if (!firebaseUser || !userProfile) {
    return <div className="flex h-screen items-center justify-center text-accent-cyan">Loading Signal...</div>;
  }
  return <ClientOnlySignalPage firebaseUser={firebaseUser} userProfile={userProfile} />;
}

export default function SignalPageWrapper() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center text-accent-cyan">Loading Signal...</div>}>
            <SignalPage />
        </Suspense>
    )
}

