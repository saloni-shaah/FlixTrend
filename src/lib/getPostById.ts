import { getFirestore } from "@/utils/firebaseAdmin";

const db = getFirestore();

export async function getPostById(postId: string) {
  try {
    const postDoc = await db.collection("posts").doc(postId).get();

    if (!postDoc.exists) {
      return null;
    }

    const postData = postDoc.data();

    return {
        id: postDoc.id,
        ...postData,
        createdAt: postData?.createdAt?.toMillis() || null,
        updatedAt: postData?.updatedAt?.toMillis() || null,
        publishAt: postData?.publishAt?.toMillis() || null,
    };
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    return null;
  }
}
