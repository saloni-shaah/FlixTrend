"use client";
import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '@/utils/firebaseClient';
import { PostCard } from '@/components/PostCard';
import { Heart } from 'lucide-react';

const db = getFirestore(app);

interface LikedPostsTabProps {
    userId: string;
}

export default function LikedPostsTab({ userId }: LikedPostsTabProps) {
    const [likedPosts, setLikedPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllLikedPosts = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // 1. Reference the 'likedPosts' subcollection for the given user
                const likedPostsSubcollectionRef = collection(db, 'users', userId, 'likedPosts');
                
                // 2. Get all the yearly documents inside the subcollection
                const yearlyDocsSnapshot = await getDocs(likedPostsSubcollectionRef);

                // 3. Flatten all postIds from all yearly documents into a single array
                const allLikedPostIds = yearlyDocsSnapshot.docs.flatMap(doc => doc.data().postIds || []);
                
                if (allLikedPostIds.length === 0) {
                    setLikedPosts([]);
                    setLoading(false);
                    return;
                }

                // 4. Fetch the actual post documents using the collected IDs
                const postPromises = allLikedPostIds.map(postId => getDoc(doc(db, 'posts', postId)));
                const postDocs = await Promise.all(postPromises);

                const posts = postDocs
                    .filter(postDoc => postDoc.exists())
                    .map(postDoc => ({ id: postDoc.id, ...postDoc.data() }));

                // 5. Sort the fetched posts by creation date, newest first
                posts.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

                setLikedPosts(posts);
            } catch (error) {
                console.error("Error fetching all liked posts:", error);
                setLikedPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAllLikedPosts();
    }, [userId]);

    if (loading) {
        return <p className="text-center mt-8 text-gray-400">Loading liked posts...</p>;
    }

    if (likedPosts.length === 0) {
        return (
            <div className="text-gray-400 text-center mt-16">
                <div className="text-4xl mb-2"><Heart /></div>
                <div className="text-lg font-semibold">No liked posts</div>
                <div className="text-sm">Your liked posts will appear here.</div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl flex flex-col gap-6">
            {likedPosts.map(post => (
                // Assuming PostCard can handle the post object structure
                <PostCard key={post.id} post={post} />
            ))}
        </div>
    );
}
