import React from 'react';
import appwriteService from "../appwrite/config";
import { Link } from 'react-router-dom';

function PostCard({ slug, title, featuredImage, content }) {
  return (
    <Link to={`/post/${slug}`}>  
      <div className='w-full bg-gray-100 rounded-xl p-4'>
        <div className='w-full justify-center mb-4'>
          <img
            src={appwriteService.getFileView(featuredImage)}
            alt={title}
            className='rounded-xl'
          />
        </div>
        <h2 className="text-xl font-bold">{title}</h2>
        
        {/* Render content if it exists */}
        {content && (
          <p className="text-gray-700 mt-2 line-clamp-3">
            {content}
          </p>
        )}
      </div>
    </Link>
  );
}

export default PostCard;
