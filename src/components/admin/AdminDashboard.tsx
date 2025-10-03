
"use client";
import React, { useState, useRef, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, setDoc, getDoc, addDoc, serverTimestamp, onSnapshot, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app } from '@/utils/firebaseClient';
import { Trash2, Crown, EyeOff, Radio, UploadCloud, Loader } from 'lucide-react';
import { getFunctions, httpsCallable } from "firebase/functions";
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);

const deletePostCallable = httpsCallable(functions, 'deletePost');

function AddProductForm() {
    const [product, setProduct] = useState({ name: '', category: '', price: '', description: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [formError, setFormError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!product.name || !product.price || !imageFile) {
            setFormError('Name, price, and image are required.');
            return;
        }
        setFormError('');
        setIsUploading(true);

        try {
            // 1. Upload Image to Firebase Storage
            const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
            const snapshot = await uploadBytes(imageRef, imageFile);
            const imageUrl = await getDownloadURL(snapshot.ref);

            // 2. Add product document to Firestore
            await addDoc(collection(db, 'products'), {
                ...product,
                price: parseFloat(product.price),
                imageUrl: imageUrl,
                createdAt: serverTimestamp()
            });

            alert(`${product.name} has been added to the store!`);
            // Reset form
            setProduct({ name: '', category: '', price: '', description: '' });
            setImageFile(null);
            setImagePreview(null);
            if(fileInputRef.current) fileInputRef.current.value = "";

        } catch (error: any) {
             const permissionError = new FirestorePermissionError({
              path: 'products',
              operation: 'create',
              requestResourceData: product,
            });
            errorEmitter.emit('permission-error', permissionError);
            setFormError(`Failed to add product: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <form onSubmit={handleAddProduct} className="glass-card p-6 flex flex-col items-center text-center">
            <UploadCloud className="text-blue-400 mb-2" size={32}/>
            <h3 className="font-bold text-lg text-blue-400">Add New Product</h3>
            <p className="text-xs text-gray-400 mb-4">Add a new item to the store inventory.</p>
            
            <div className="flex flex-col gap-3 w-full">
                 <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 bg-black/20 rounded-lg border-2 border-dashed border-gray-500 flex items-center justify-center cursor-pointer overflow-hidden"
                >
                    {imagePreview ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover"/> : <span className="text-gray-400 text-sm">Upload Image</span>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*"/>

                <input type="text" name="name" placeholder="Product Name" className="input-glass" value={product.name} onChange={handleChange} required/>
                <input type="text" name="category" placeholder="Category (e.g., Apparel)" className="input-glass" value={product.category} onChange={handleChange} />
                <input type="number" name="price" placeholder="Price (INR)" className="input-glass" value={product.price} onChange={handleChange} required/>
                <textarea name="description" placeholder="Product Description" className="input-glass rounded-2xl" value={product.description} onChange={handleChange} rows={3}/>
            </div>
            {formError && <p className="text-red-400 text-xs mt-2">{formError}</p>}
            <button type="submit" disabled={isUploading} className="btn-glass bg-blue-500/20 text-blue-400 w-full mt-4">
                {isUploading ? <Loader className="animate-spin" /> : 'Add Product'}
            </button>
        </form>
    );
}

function ManageProducts() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (err) => {
            setError("Failed to load products. Check permissions.");
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleRemoveProduct = async (product: any) => {
        if (!window.confirm(`Are you sure you want to remove "${product.name}" from the store? This cannot be undone.`)) return;

        try {
            // Delete Firestore document
            const docRef = doc(db, 'products', product.id);
            await deleteDoc(docRef);

            // Delete image from Firebase Storage
            if (product.imageUrl) {
                const imageRef = ref(storage, product.imageUrl);
                await deleteObject(imageRef);
            }
            alert("Product removed successfully.");
        } catch(err: any) {
            const permissionError = new FirestorePermissionError({
              path: `products/${product.id}`,
              operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            alert(`Failed to remove product: ${err.message}`);
        }
    };
    
    if (loading) return <div className="glass-card p-6 text-center"><Loader className="animate-spin mx-auto" /></div>;

    return (
        <div className="glass-card p-6 lg:col-span-3">
             <h3 className="font-bold text-lg text-accent-cyan mb-4">Manage Products</h3>
             {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
             <div className="max-h-96 overflow-y-auto space-y-3">
                {products.map(product => (
                    <div key={product.id} className="flex items-center gap-4 bg-black/20 p-2 rounded-lg">
                        <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-md object-cover"/>
                        <div className="flex-1">
                            <p className="font-bold">{product.name}</p>
                            <p className="text-sm text-gray-400">₹{product.price}</p>
                        </div>
                        <button onClick={() => handleRemoveProduct(product)} className="btn-glass-icon w-10 h-10 bg-red-500/20 text-red-400 hover:bg-red-500/40">
                            <Trash2 size={16}/>
                        </button>
                    </div>
                ))}
             </div>
        </div>
    );
}

export default function AdminDashboard({ userProfile, onLogout }: { userProfile: any, onLogout: () => void }) {

    const handleDeletePost = async () => {
        const postId = prompt("Enter the ID of the post to delete:");
        if (postId) {
            try {
                await deletePostCallable({ postId });
                alert(`Post ${postId} has been successfully deleted.`);
            } catch(error: any) {
                 alert(`Failed to delete post: ${error.message}`);
            }
        }
    };

    const handleGrantPremium = async () => {
        const username = prompt("Enter the username of the user to grant premium to:");
        if (!username) return;

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const userQuerySnap = await getDocs(q);

        if (userQuerySnap.empty) {
            alert("User not found.");
            return;
        }
        
        const userToUpdateDoc = userQuerySnap.docs[0];
        const docRef = doc(db, "users", userToUpdateDoc.id);
        const data = { isPremium: true };

        updateDoc(docRef, data)
          .then(() => {
              alert(`Premium status granted to ${username}.`);
          })
          .catch(async (serverError) => {
            const permissionError = new FirestorePermissionError({
              path: docRef.path,
              operation: 'update',
              requestResourceData: data,
            });
            errorEmitter.emit('permission-error', permissionError);
            alert('Permission denied. You might not have the rights to grant premium status.');
          });
    };

    const handleToggleMaintenance = async () => {
        const maintenanceDocRef = doc(db, 'app_status', 'maintenance');
        try {
            const docSnap = await getDoc(maintenanceDocRef);
            const currentStatus = docSnap.exists() ? docSnap.data()?.isEnabled : false;
            const newStatus = !currentStatus;
            
            const dataToUpdate = { isEnabled: newStatus };

            await setDoc(maintenanceDocRef, dataToUpdate, { merge: true })
            .catch((serverError) => {
                const permissionError = new FirestorePermissionError({
                    path: 'app_status/maintenance',
                    operation: 'write',
                    requestResourceData: dataToUpdate,
                });
                errorEmitter.emit('permission-error', permissionError);
                throw serverError; // re-throw to be caught by outer catch
            });

            alert(`Maintenance mode is now ${newStatus ? 'ON' : 'OFF'}.`);

        } catch (error: any) {
            if (!error.message.includes('permission-denied')) { // Avoid double-alerting for permission errors
                alert(`Failed to toggle maintenance mode: ${error.message}`);
            }
        }
    };
    
    const handleGoLive = () => {
        alert("This would open a special live stream page for admins during maintenance mode.");
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center pt-12 p-4">
            <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
                <div className="text-center">
                     <h1 className="text-3xl font-headline font-bold text-accent-cyan">Admin Dashboard</h1>
                     <p className="text-gray-400">Welcome, {userProfile.name}.</p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AddProductForm />
                    <div className="glass-card p-6 flex flex-col items-center text-center">
                        <Trash2 className="text-red-400 mb-2" size={32}/>
                        <h3 className="font-bold text-lg text-red-400">Content Moderation</h3>
                        <p className="text-xs text-gray-400 mb-4">Permanently delete a post from the database.</p>
                        <button onClick={handleDeletePost} className="btn-glass bg-red-500/20 text-red-400 w-full">Delete Post</button>
                    </div>
                     <div className="glass-card p-6 flex flex-col items-center text-center">
                        <Crown className="text-yellow-400 mb-2" size={32}/>
                        <h3 className="font-bold text-lg text-yellow-400">Grant Premium</h3>
                        <p className="text-xs text-gray-400 mb-4">Give a user premium status for free.</p>
                        <button onClick={handleGrantPremium} className="btn-glass bg-yellow-500/20 text-yellow-400 w-full">Grant Premium</button>
                    </div>
                     <div className="glass-card p-6 flex flex-col items-center text-center">
                        <EyeOff className="text-accent-purple mb-2" size={32}/>
                        <h3 className="font-bold text-lg text-accent-purple">Maintenance Mode</h3>
                        <p className="text-xs text-gray-400 mb-4">Block user access and show a maintenance page.</p>
                        <button onClick={handleToggleMaintenance} className="btn-glass bg-purple-500/20 text-purple-400 w-full mb-2">Toggle Maintenance</button>
                        <button onClick={handleGoLive} className="btn-glass bg-green-500/20 text-green-400 w-full flex items-center justify-center gap-2"><Radio/>Go Live During Maint.</button>
                    </div>
                    <ManageProducts />
                </div>
                 <button onClick={onLogout} className="btn-glass self-center mt-8">Log Out</button>
            </div>
        </div>
    )
}

    