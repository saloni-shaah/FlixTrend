
"use client";
import React, { useEffect, useState, useRef } from "react";
import { getFirestore, collection, query, onSnapshot, orderBy, doc, getDoc, setDoc, addDoc, serverTimestamp, where, writeBatch, getDocs, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { auth, db } from "@/utils/firebaseClient";
import { Phone, Video, Paperclip, Mic, Send, ArrowLeft, Image as ImageIcon, X, Smile, Trash2, Users, CheckSquare, Square, MoreVertical, UserPlus, UserX, Edit, Shield, EyeOff } from "lucide-react";
import { useAppState } from "@/utils/AppStateContext";
import { createCall } from "@/utils/callService";
import { motion, AnimatePresence } from "framer-motion";

async function uploadToCloudinary(file: File, onProgress?: (percent: number) => void): Promise<string | null> {
  const url = `https://api.cloudinary.com/v1_1/drrzvi2jp/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "flixtrend_unsigned");
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.responseText) {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error(data.error?.message || "Upload failed"));
        }
      } else {
        reject(new Error("Upload failed with empty response"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

const anonymousNames = ["VibeSeeker", "MemeLord", "EchoRider", "SynthWave", "PixelPioneer", "StarSailor", "DreamCaster"];
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
    const [groupType, setGroupType] = useState<'simple' | 'anonymous' | 'pseudonymous'>('simple');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleToggleUser = (uid: string) => {
        setSelectedUids(prev => 
            prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
        );
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
            const memberUids = [...new Set([...selectedUids, currentUser.uid])];
            const memberProfiles = await Promise.all(
                memberUids.map(async uid => {
                    const userDoc = await getDoc(doc(db, "users", uid));
                    return userDoc.exists() ? { uid, ...userDoc.data() } : null;
                })
            );

            const validMembers = memberProfiles.filter(Boolean);

            let pseudonyms: any = {};
            if (groupType === 'pseudonymous') {
                validMembers.forEach(member => {
                    pseudonyms[member!.uid] = generateAnonymousName(member!.uid, groupName); // Use group name as part of seed
                });
            }

            const groupDocRef = await addDoc(collection(db, "groups"), {
                name: groupName,
                members: memberUids,
                memberInfo: validMembers.reduce((acc, user) => ({ ...acc, [user!.uid]: { name: user!.name, avatar_url: user!.avatar_url, username: user!.username } }), {}),
                admins: [currentUser.uid],
                createdAt: serverTimestamp(),
                createdBy: currentUser.uid,
                isGroup: true,
                groupType: groupType,
                pseudonyms: groupType === 'pseudonymous' ? pseudonyms : {},
            });
            
            const groupData = (await getDoc(groupDocRef)).data();

            await addDoc(collection(db, "chats", groupDocRef.id, "messages"), {
                text: `${currentUser.displayName} created the group "${groupName}"`,
                sender: 'system',
                createdAt: serverTimestamp(),
                readBy: [currentUser.uid]
            });
            
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
                
                <input
                    type="text"
                    placeholder="Group Name"
                    className="input-glass w-full mb-4"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                />

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

function GroupInfoPanel({ group, currentUser, mutuals, onClose, onGroupUpdate }: { group: any, currentUser: any, mutuals: any[], onClose: () => void, onGroupUpdate: (updatedGroup:any)=>void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [groupName, setGroupName] = useState(group.name);
    const [groupBio, setGroupBio] = useState(group.bio || "");
    const isAdmin = group.admins?.includes(currentUser.uid);

    const handleUpdateInfo = async () => {
        const groupRef = doc(db, "groups", group.id);
        await updateDoc(groupRef, { name: groupName, bio: groupBio });
        onGroupUpdate({ ...group, name: groupName, bio: groupBio });
        setIsEditing(false);
    };

    const handleAddMember = async (userToAdd: any) => {
        const groupRef = doc(db, "groups", group.id);
        const updatedMemberInfo = { ...group.memberInfo, [userToAdd.uid]: { name: userToAdd.name, avatar_url: userToAdd.avatar_url, username: userToAdd.username } };
        
        let updateData: any = {
            members: arrayUnion(userToAdd.uid),
            memberInfo: updatedMemberInfo
        };
        
        if(group.groupType === 'pseudonymous'){
            updateData.pseudonyms = {
                ...group.pseudonyms,
                [userToAdd.uid]: generateAnonymousName(userToAdd.uid, group.id)
            }
        }
        
        await updateDoc(groupRef, updateData);
        await addDoc(collection(db, "chats", group.id, "messages"), {
                text: `${userToAdd.name} was added to the group.`,
                sender: 'system',
                createdAt: serverTimestamp(),
                readBy: [currentUser.uid]
            });
        onGroupUpdate({ ...group, members: [...group.members, userToAdd.uid], memberInfo: updatedMemberInfo, pseudonyms: updateData.pseudonyms || group.pseudonyms });
    };

    const handleRemoveMember = async (uidToRemove: string) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        const groupRef = doc(db, "groups", group.id);
        const memberName = group.memberInfo[uidToRemove]?.name || 'A user';
        const updatedMemberInfo = { ...group.memberInfo };
        delete updatedMemberInfo[uidToRemove];
        
        const updateData: any = {
            members: arrayRemove(uidToRemove),
            memberInfo: updatedMemberInfo,
        };

        if(group.groupType === 'pseudonymous'){
            const updatedPseudonyms = { ...group.pseudonyms };
            delete updatedPseudonyms[uidToRemove];
            updateData.pseudonyms = updatedPseudonyms;
        }
        
        await updateDoc(groupRef, updateData);

        await addDoc(collection(db, "chats", group.id, "messages"), {
                text: `${memberName} was removed from the group.`,
                sender: 'system',
                createdAt: serverTimestamp(),
                readBy: [currentUser.uid]
            });
         onGroupUpdate({ ...group, members: group.members.filter((m:string) => m !== uidToRemove), memberInfo: updatedMemberInfo, pseudonyms: updateData.pseudonyms || group.pseudonyms });
    };
    
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
                <button onClick={onClose} className="p-2 rounded-full hover:bg-accent-cyan/10"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-5xl mb-4">
                        {group.groupType === 'anonymous' ? <Shield/> : group.groupType === 'pseudonymous' ? <EyeOff/> : <Users />}
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
                    {isAdmin && (
                        isEditing ? (
                            <div className="flex gap-2 mt-2">
                                <button onClick={handleUpdateInfo} className="text-xs px-2 py-1 rounded bg-green-500/80 text-white">Save</button>
                                <button onClick={() => setIsEditing(false)} className="text-xs px-2 py-1 rounded bg-gray-500/80 text-white">Cancel</button>
                            </div>
                        ) : (
                             <button onClick={() => setIsEditing(true)} className="p-2 rounded-full hover:bg-accent-cyan/10 mt-1"><Edit size={16}/></button>
                        )
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
                                        {member.avatar_url ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover"/> : getInitials(member)}
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

function ClientOnlySignalPage({ firebaseUser }: { firebaseUser: any }) {
  const [chats, setChats] = useState<any[]>([]);
  const [joinableGroups, setJoinableGroups] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { useMediaQuery } = require("@uidotdev/usehooks");
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;

    // Fetch user's chats (groups and mutuals)
    const qChats = query(collection(db, "groups"), where("members", "array-contains", firebaseUser.uid));
    const unsubChats = onSnapshot(qChats, async (groupsSnap) => {
        const groupChats = groupsSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), isGroup: true, uid: doc.id }));
        
        const followingRef = collection(db, "users", firebaseUser.uid, "following");
        const followersRef = collection(db, "users", firebaseUser.uid, "followers");
        const [followingSnap, followersSnap] = await Promise.all([getDocs(followingRef), getDocs(followersRef)]);
        
        const following = followingSnap.docs.map(doc => doc.id);
        const followers = followersSnap.docs.map(doc => doc.id);
        const mutualUids = Array.from(new Set([...following, ...followers])).filter(uid => uid !== firebaseUser.uid);
        
        const mutualProfiles = await Promise.all(
          mutualUids.map(async (uid) => {
            const userDoc = await getDoc(doc(db, "users", uid));
            return userDoc.exists() ? { uid, ...userDoc.data(), isGroup: false, id: uid } : null;
          })
        );
        
        const oneOnOneChats = mutualProfiles.filter(Boolean) as any[];
        const allChats = [...groupChats, ...oneOnOneChats].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);
        
        allChats.sort((a,b) => (b.lastMessageAt?.toDate() || b.createdAt?.toDate() || 0) - (a.lastMessageAt?.toDate() || a.createdAt?.toDate() || 0));

        setChats(allChats);
    });

    // Fetch joinable anonymous groups
    const qJoinable = query(collection(db, "groups"), where("groupType", "==", "anonymous"));
    const unsubJoinable = onSnapshot(qJoinable, (snap) => {
        const allAnonGroups = snap.docs.map(doc => ({ id: doc.id, ...doc.data(), isGroup: true }));
        const nonMemberGroups = allAnonGroups.filter(g => !g.members.includes(firebaseUser.uid));
        setJoinableGroups(nonMemberGroups);
    });


    return () => {
        unsubChats();
        unsubJoinable();
    };

  }, [firebaseUser]);


  const handleSelectChat = async (chat: any) => {
    setSelectedChat(chat);
    setShowMenu(null);
    setShowEmojiPicker(null);
    const chatId = chat.isGroup ? chat.id : getChatId(firebaseUser.uid, chat.uid);
    const q = query(
        collection(db, "chats", chatId, "messages"),
        orderBy("createdAt", "asc")
    );
    
    const unsubMessages = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Mark messages as read
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
    const unsub = handleSelectChat(selectedChat);
    return () => {
        if (unsub && typeof unsub === 'function') {
            unsub();
        }
    };
  }, [selectedChat, firebaseUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent, mediaUrl: string | null = null, type: 'text' | 'image' | 'video' | 'audio' = 'text') => {
    e.preventDefault();
    if ((!newMessage.trim() && !mediaUrl) || !firebaseUser || !selectedChat) return;

    const chatId = selectedChat.isGroup ? selectedChat.id : getChatId(firebaseUser.uid, selectedChat.uid);
    const messageData: any = {
        sender: firebaseUser.uid,
        createdAt: serverTimestamp(),
        type: type,
        readBy: [firebaseUser.uid],
        reactions: {},
    };

    if (mediaUrl) {
        messageData.mediaUrl = mediaUrl;
        messageData.text = newMessage; // Caption
    } else {
        messageData.text = newMessage;
    }
    
    if(selectedChat.groupType === 'anonymous' || selectedChat.groupType === 'pseudonymous'){
        // In anonymous/pseudonymous groups, we don't send the real user info with the message
    } else {
        messageData.senderInfo = {
            name: firebaseUser.name,
            avatar_url: firebaseUser.avatar_url
        }
    }


    await addDoc(collection(db, "chats", chatId, "messages"), messageData);
    setNewMessage("");
  };
  
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedChat || !firebaseUser) return;
    const chatId = selectedChat.isGroup ? selectedChat.id : getChatId(firebaseUser.uid, selectedChat.uid);
    const messageRef = doc(db, "chats", chatId, "messages", messageId);
    if(window.confirm("Are you sure you want to delete this message for everyone? This action is irreversible.")) {
      await deleteDoc(messageRef);
    }
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
            // User is removing their reaction
            const newUids = uidsForEmoji.filter((uid: string) => uid !== firebaseUser.uid);
            if (newUids.length > 0) {
                await updateDoc(messageRef, { [`reactions.${emoji}`]: newUids });
            } else {
                // If no one is left, remove the emoji key
                delete currentReactions[emoji];
                await updateDoc(messageRef, { reactions: currentReactions });
            }
        } else {
            // User is adding a reaction
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
        const mediaUrl = await uploadToCloudinary(file);
        if (mediaUrl) {
            handleSend(new Event('submit') as any, mediaUrl, type);
        }
    } catch (error) {
        console.error("Upload failed:", error);
        alert("Sorry, the file upload failed.");
    }

    if (e.target) e.target.value = '';
  };
  
  const handleCall = async (type: 'video' | 'voice') => {
    if (!selectedChat || !firebaseUser || selectedChat.isGroup) {
      alert("Calls can only be made in one-on-one chats for now.");
      return;
    };
    
    if (type === 'video') {
      await createCall(firebaseUser, selectedChat);
    } else {
      alert(`Starting voice call with ${selectedChat.name}... (Feature coming soon!)`);
    }

    const notifRef = collection(db, "notifications", selectedChat.uid, "user_notifications");
    await addDoc(notifRef, {
      type: 'missed_call',
      callType: type,
      fromUserId: firebaseUser.uid,
      fromUsername: firebaseUser.displayName,
      fromAvatarUrl: firebaseUser.photoURL,
      createdAt: serverTimestamp(),
      read: false,
    });
  };
  
  const handleJoinAnonymousGroup = async (group: any) => {
    if (!firebaseUser) return;
    const groupRef = doc(db, "groups", group.id);
    await updateDoc(groupRef, {
        members: arrayUnion(firebaseUser.uid)
    });
    // This will trigger the main chat listener to move it to the top list
    handleSelectChat(group); 
  };
  
  const getInitials = (user: any) => user?.name?.[0] || user?.username?.[0] || "U";
  
  const defaultReactions = ["👍", "❤️", "😂", "😢", "😮", "🙏"];

  return (
    <div className="flex h-screen w-full bg-transparent font-body text-white overflow-hidden">
        {showCreateGroup && <CreateGroupModal mutuals={chats.filter(c => !c.isGroup)} currentUser={firebaseUser} onClose={() => setShowCreateGroup(false)} onGroupCreated={(newGroup) => {
            setChats(prev => [newGroup, ...prev]);
            setSelectedChat(newGroup);
        }} />}
        <div className={`w-full md:w-1/3 md:min-w-[350px] border-r border-accent-cyan/10 bg-black/60 flex flex-col ${isMobile && selectedChat ? "hidden" : ""}`}>
            <div className="p-4 border-b border-accent-cyan/10 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-headline font-bold text-accent-cyan">Signal</h2>
                <button className="btn-glass-icon w-10 h-10" title="Create Group" onClick={() => setShowCreateGroup(true)}>
                    <Users size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                    <div className="text-gray-400 text-center p-8">No contacts or groups yet. Follow some users to start chatting!</div>
                ) : (
                    chats.map((chat) => (
                        <button key={chat.id} className={`w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-accent-cyan/10 transition-colors duration-200 ${selectedChat?.id === chat.id ? "bg-accent-cyan/20" : ""}`} onClick={() => handleSelectChat(chat)}>
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-xl overflow-hidden shrink-0">
                                {chat.isGroup ? 
                                    (chat.groupType === 'anonymous' ? <Shield/> : chat.groupType === 'pseudonymous' ? <EyeOff/> : <Users/>) :
                                    (chat.avatar_url ? <img src={chat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(chat))
                                }
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <span className="font-bold text-white block truncate">{chat.name || chat.username}</span>
                                {!chat.isGroup && <span className="text-xs text-gray-400 block truncate">@{chat.username}</span>}
                            </div>
                            {unreadCounts[chat.id] > 0 && (
                                <span className="bg-accent-pink text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                                    {unreadCounts[chat.id]}
                                </span>
                            )}
                        </button>
                    ))
                )}
                {joinableGroups.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-accent-cyan/10">
                         <h3 className="px-4 text-sm font-bold text-gray-400 mb-2">Join Anonymous Groups</h3>
                         {joinableGroups.map(group => (
                             <button key={group.id} className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-accent-cyan/10 transition-colors" onClick={() => handleJoinAnonymousGroup(group)}>
                                <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center shrink-0"><Shield/></div>
                                 <div className="flex-1 overflow-hidden">
                                     <span className="font-bold text-white block truncate">{group.name}</span>
                                     <span className="text-xs text-green-400 block">{group.members.length} members</span>
                                 </div>
                                 <span className="text-sm font-bold text-accent-cyan">Join</span>
                             </button>
                         ))}
                    </div>
                )}
            </div>
        </div>

        <div className={`flex-1 flex flex-col bg-black/40 relative ${!selectedChat && isMobile ? "hidden" : ""}`}>
            {selectedChat ? (
                <>
                    <div className="flex items-center gap-3 p-3 border-b border-accent-cyan/10 bg-black/60 shadow-md shrink-0">
                        {isMobile && <button onClick={() => setSelectedChat(null)} className="p-2 rounded-full hover:bg-accent-cyan/10"><ArrowLeft size={20}/></button>}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-pink to-accent-cyan flex items-center justify-center text-white font-bold text-lg overflow-hidden shrink-0">
                           {selectedChat.isGroup ? 
                                (selectedChat.groupType === 'anonymous' ? <Shield/> : selectedChat.groupType === 'pseudonymous' ? <EyeOff/> : <Users/>) :
                                (selectedChat.avatar_url ? <img src={selectedChat.avatar_url} alt="avatar" className="w-full h-full object-cover"/> : getInitials(selectedChat))
                           }
                        </div>
                        <button className="flex-1 text-left" disabled={!selectedChat.isGroup} onClick={() => setShowGroupInfo(true)}>
                            <h3 className="font-bold text-white">{selectedChat.name}</h3>
                            <p className="text-xs text-green-400">{selectedChat.isGroup ? `${selectedChat.members.length} members` : 'Online'}</p>
                        </button>
                        <div className="flex items-center gap-2">
                           {!selectedChat.isGroup && <button onClick={() => handleCall('video')} className="p-2 rounded-full hover:bg-accent-cyan/10"><Video size={20}/></button>}
                           {!selectedChat.isGroup && <button onClick={() => handleCall('voice')} className="p-2 rounded-full hover:bg-accent-cyan/10"><Phone size={20}/></button>}
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                        {messages.map(msg => {
                            const senderInfo = selectedChat.isGroup ?
                                (selectedChat.groupType === 'simple' ? selectedChat.memberInfo?.[msg.sender] : null)
                                : selectedChat;
                            
                            const displayName = selectedChat.groupType === 'anonymous' ? generateAnonymousName(msg.sender, selectedChat.id) : 
                                                selectedChat.groupType === 'pseudonymous' ? selectedChat.pseudonyms?.[msg.sender] || 'Anon' : 
                                                senderInfo?.name || "User";
                            
                            const avatarUrl = selectedChat.groupType === 'simple' ? senderInfo?.avatar_url : null;

                             return (
                             <div key={msg.id} className={`group flex items-end gap-2 max-w-[80%] ${msg.sender === firebaseUser.uid ? "self-end flex-row-reverse" : msg.sender === 'system' ? 'self-center' : "self-start"}`}>
                                <div className={`relative px-4 py-2 rounded-2xl ${msg.sender === firebaseUser.uid ? "bg-accent-cyan text-black rounded-br-none" : msg.sender === 'system' ? "bg-gray-800 text-gray-400 text-xs italic" : "bg-gray-700 text-white rounded-bl-none"}`}>
                                    {msg.sender !== firebaseUser.uid && msg.sender !== 'system' && (
                                        <div className="font-bold text-accent-pink text-sm">{displayName}</div>
                                    )}
                                    {msg.type === 'image' && <img src={msg.mediaUrl} alt={msg.text || "image"} className="rounded-lg max-w-xs" />}
                                    {msg.type === 'video' && <video src={msg.mediaUrl} controls className="rounded-lg max-w-xs" />}
                                    {msg.type === 'audio' && <audio src={msg.mediaUrl} controls />}
                                    {msg.text && <p className="mt-1 break-words">{msg.text}</p>}
                                    {msg.sender !== 'system' && <div className="text-xs mt-1 text-right opacity-70">
                                        {msg.createdAt?.toDate?.().toLocaleTimeString() || ""}
                                    </div>}
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
                                <div className={`relative hidden group-hover:flex items-center gap-1 ${msg.sender === firebaseUser.uid ? "flex-row-reverse" : ""}`}>
                                   {msg.sender !== 'system' && 
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
                                   }
                                   {msg.sender === firebaseUser.uid && <button onClick={() => handleDeleteMessage(msg.id)} className="p-1 rounded-full bg-gray-600 hover:bg-red-500"><Trash2 size={16}/></button>}
                                </div>
                            </div>
                             )
                        })}
                         <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSend} className="flex items-center gap-2 p-4 border-t border-accent-cyan/10 bg-black/60 shrink-0">
                         <div className="relative group">
                            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full hover:bg-accent-cyan/20 transition-colors">
                                <Paperclip size={20}/>
                            </button>
                         </div>
                         <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*,audio/*" />
                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-gray-700 rounded-full px-4 py-2 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent-cyan"/>
                        <button type="submit" className="p-3 rounded-full bg-accent-cyan text-black" disabled={!newMessage.trim()}><Send size={20}/></button>
                    </form>
                    
                    {selectedChat.isGroup && showGroupInfo && (
                        <GroupInfoPanel 
                            group={selectedChat}
                            currentUser={firebaseUser}
                            mutuals={chats.filter(c => !c.isGroup)}
                            onClose={() => setShowGroupInfo(false)}
                            onGroupUpdate={(updatedGroup) => setSelectedChat(updatedGroup)}
                        />
                    )}
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center p-4">
                    <div className="text-5xl mb-4">💬</div>
                    <h3 className="text-xl font-bold">Select a chat</h3>
                    <p className="max-w-xs">Start a conversation with your mutuals or create a group to chat with friends.</p>
                </div>
            )}
        </div>
    </div>
  );
}

export default function SignalPage() {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Fetch full user profile from Firestore to get all necessary details
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setFirebaseUser({ ...user, ...userDocSnap.data() });
        } else {
          // Fallback or create a new profile if it doesn't exist
          const newProfile = {
            uid: user.uid,
            name: user.displayName || "",
            username: user.displayName ? user.displayName.replace(/\s+/g, "").toLowerCase() : `user${user.uid.substring(0,5)}`,
            email: user.email || "",
            avatar_url: user.photoURL || `https://api.dicebear.com/8.x/bottts-neutral/svg?seed=${user.uid}`,
            bio: "",
            interests: "",
            createdAt: new Date(),
          };
          await setDoc(userDocRef, newProfile);
          setFirebaseUser({ ...user, ...newProfile });
        }
      } else {
        setFirebaseUser(null);
      }
    });
    return () => unsub();
  }, []);
  
  if (!firebaseUser) {
    return <div className="flex h-screen items-center justify-center text-accent-cyan">Loading Signal...</div>;
  }
  return <ClientOnlySignalPage firebaseUser={firebaseUser} />;
}
