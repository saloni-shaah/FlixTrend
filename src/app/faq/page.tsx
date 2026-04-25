
import React from 'react';
import Link from 'next/link';

const FAQPage = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-gray-900 dark:text-white">Frequently Asked Questions</h1>
      
      <div className="space-y-10">
        
        {/* General Questions */}
        <section>
          <h2 className="text-2xl font-bold mb-4 border-b pb-2 border-gray-300 dark:border-gray-700">General</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">What is FlixTrend?</h3>
              <p>FlixTrend is a dynamic, community-driven platform where users can discover, create, and share content related to music, movies, and TV shows. It's a place for enthusiasts to connect, discuss, and stay up-to-date with the latest trends in entertainment.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Is FlixTrend free to use?</h3>
              <p>Yes, FlixTrend is completely free to use. You can browse content, create posts, and interact with the community without any cost.</p>
            </div>
          </div>
        </section>

        {/* Content & Posting */}
        <section>
          <h2 className="text-2xl font-bold mb-4 border-b pb-2 border-gray-300 dark:border-gray-700">Content & Posting</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">How do I create a post?</h3>
              <p>To create a post, you must be a registered user and logged in. Click on the "Create" or "Upload" button, which is typically found in the navigation bar. From there, you can choose the type of content you want to share, such as a song, a movie review, or a discussion topic.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">What kind of content can I post?</h3>
              <p>You can post a variety of content, including:</p>
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Original music or remixes</li>
                <li>Reviews and ratings for movies and TV shows</li>
                <li>Discussion threads about your favorite entertainment topics</li>
                <li>Custom playlists of songs from the platform</li>
              </ul>
              <p className="mt-2">Please ensure your content adheres to our <Link href="/community-guidelines" className="text-blue-500 hover:underline">Community Guidelines</Link>.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">How can I upload a song or audio file?</h3>
              <p>When creating a post, select the "Upload Song" option. You will be prompted to choose an audio file from your device (e.g., MP3, WAV). You can also add details like a title, artist, album art, and lyrics to make your post more engaging.</p>
            </div>
          </div>
        </section>

        {/* Account & Profile */}
        <section>
          <h2 className="text-2xl font-bold mb-4 border-b pb-2 border-gray-300 dark:border-gray-700">Account & Profile</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">How do I create an account?</h3>
              <p>You can sign up using your email address or by connecting a social media account like Google. Just click the "Sign Up" button on the homepage.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">How can I customize my profile?</h3>
              <p>Visit your "Profile" page to update your username, bio, and profile picture. A complete profile helps other users get to know you.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold">What if I forget my password?</h3>
              <p>If you forget your password, click the "Forgot Password" link on the login page. You'll receive an email with instructions on how to reset it.</p>
            </div>
          </div>
        </section>
        
      </div>
    </div>
  );
};

export default FAQPage;
