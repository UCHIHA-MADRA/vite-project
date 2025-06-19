import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import appwriteService from "../appwrite/config";
import { Button, Container } from "../components";
import parse from "html-react-parser";
import { useSelector } from "react-redux";

export default function Post() {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageUrl, setImageUrl] = useState('');
    const [imageError, setImageError] = useState(false);
    
    const { slug } = useParams();
    const navigate = useNavigate();

    const userData = useSelector((state) => state.auth.userData);
    const isAuthor = post && userData ? post.userId === userData.$id : false;

    useEffect(() => {
        console.log('=== POST COMPONENT DEBUG ===');
        console.log('Parameter from URL:', slug);
        console.log('Parameter type:', typeof slug);
        console.log('Parameter length:', slug?.length);
        
        if (slug) {
            setLoading(true);
            setError(null);
            
            // Determine if this looks like a document ID or a slug
            const isDocumentId = slug.length > 20 && !slug.includes('-');
            console.log('Looks like document ID:', isDocumentId);
            
            appwriteService.getPost(slug)
                .then((fetchedPost) => {
                    console.log('=== POST FETCH RESULT ===');
                    console.log('Fetched post:', fetchedPost);
                    
                    if (fetchedPost) {
                        console.log('Post found successfully');
                        console.log('Post $id:', fetchedPost.$id);
                        console.log('Post slug:', fetchedPost.slug);
                        console.log('Post title:', fetchedPost.title);
                        console.log('Post content:', fetchedPost.content);
                        console.log('Post content type:', typeof fetchedPost.content);
                        console.log('Post featuredImage:', fetchedPost.featuredImage);
                        
                        setPost(fetchedPost);
                        setError(null);
                        
                        // Generate image URL if featured image exists
                        if (fetchedPost.featuredImage) {
                            generateImageUrl(fetchedPost.featuredImage);
                        }
                    } else {
                        console.log('No post found');
                        setError(`Post not found with identifier: ${slug}`);
                        // Don't redirect immediately, show error first
                        setTimeout(() => navigate("/"), 3000);
                    }
                })
                .catch((error) => {
                    console.error('Error fetching post:', error);
                    setError(`Error fetching post: ${error.message}`);
                    setTimeout(() => navigate("/"), 3000);
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            console.log('No identifier provided');
            navigate("/");
        }
    }, [slug, navigate]);

    const generateImageUrl = (fileId) => {
        console.log('=== GENERATE IMAGE URL ===');
        console.log('File ID:', fileId);
        
        if (!fileId) {
            console.log('No file ID provided');
            setImageError(true);
            return;
        }

        try {
            // Use the basic getFilePreview method
            const previewUrl = appwriteService.getFileView(fileId);
            console.log('Generated preview URL:', previewUrl);
            
            if (previewUrl) {
                // Extract the actual URL string
                const urlString = previewUrl.href || previewUrl.toString();
                console.log('URL string:', urlString);
                
                setImageUrl(urlString);
                setImageError(false);
            } else {
                console.error('No preview URL generated');
                setImageError(true);
            }
        } catch (error) {
            console.error('Error generating image URL:', error);
            setImageError(true);
        }
    };

    const deletePost = () => {
        if (!post) return;
        
        console.log('Deleting post:', post.$id);
        appwriteService.deletePost(post.$id).then((status) => {
            console.log('Delete result:', status);
            if (status) {
                if (post.featuredImage) {
                    appwriteService.deleteFile(post.featuredImage);
                }
                navigate("/");
            }
        });
    };

    const handleImageError = () => {
        console.error('Image failed to load:', imageUrl);
        setImageError(true);
    };

    const handleImageLoad = () => {
        console.log('Image loaded successfully');
        setImageError(false);
    };

    // Helper function to safely parse HTML content
    const parseContent = (content) => {
        if (!content) {
            return <div className="text-gray-500 italic">No content available</div>;
        }
        
        if (typeof content !== 'string') {
            console.error('Content is not a string:', typeof content, content);
            return <div className="text-red-500 italic">Invalid content format</div>;
        }
        
        try {
            return parse(content);
        } catch (error) {
            console.error('Error parsing content:', error);
            return <div className="text-red-500 italic">Error displaying content</div>;
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="py-8">
                <Container>
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                        <p className="text-lg">Loading post...</p>
                        <p className="text-sm text-gray-500 mt-2">Identifier: {slug}</p>
                    </div>
                </Container>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="py-8">
                <Container>
                    <div className="text-center">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
                            <h2 className="text-lg font-semibold text-red-800 mb-2">Post Not Found</h2>
                            <p className="text-red-600 mb-2">{error}</p>
                            <p className="text-sm text-gray-600 mb-4">
                                The post you're looking for might have been moved, deleted, or the URL might be incorrect.
                            </p>
                            <div className="text-sm text-gray-500 space-y-1">
                                <p><strong>Identifier:</strong> {slug}</p>
                                <p><strong>Identifier Type:</strong> {slug?.length > 20 ? 'Document ID' : 'Slug'}</p>
                            </div>
                        </div>
                        
                        <div className="space-x-4">
                            <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700">
                                Go Home
                            </Button>
                            <Button onClick={() => window.location.reload()} className="bg-gray-600 hover:bg-gray-700">
                                Retry
                            </Button>
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-4">
                            Auto-redirecting to home in 3 seconds...
                        </p>
                    </div>
                </Container>
            </div>
        );
    }

    // Post not found (shouldn't reach here with proper error handling above)
    if (!post) {
        return (
            <div className="py-8">
                <Container>
                    <div className="text-center">
                        <p className="text-lg mb-4">Post not found</p>
                        <Button onClick={() => navigate("/")} className="bg-blue-600">
                            Go Home
                        </Button>
                    </div>
                </Container>
            </div>
        );
    }

    return (
        <div className="py-8">
            <Container>
                {/* Debug Info - Remove in production */}
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <h3 className="font-bold mb-2 text-gray-800">Debug Information:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-gray-600">
                        <p><strong>URL Parameter:</strong> {slug}</p>
                        <p><strong>Post ID:</strong> {post.$id}</p>
                        <p><strong>Post Slug:</strong> {post.slug}</p>
                        <p><strong>Post Content Type:</strong> {typeof post.content}</p>
                        <p><strong>Post Content Length:</strong> {post.content?.length || 0}</p>
                        <p><strong>Featured Image ID:</strong> {post.featuredImage || 'None'}</p>
                        <p><strong>Image URL Generated:</strong> {imageUrl ? 'Yes' : 'No'}</p>
                        <p><strong>Image Error:</strong> {imageError ? 'Yes' : 'No'}</p>
                        <p><strong>Is Author:</strong> {isAuthor ? 'Yes' : 'No'}</p>
                        <p><strong>User ID:</strong> {userData?.$id || 'Not logged in'}</p>
                    </div>
                </div>

                {/* Featured Image Section */}
                <div className="w-full flex justify-center mb-6 relative">
                    <div className="border rounded-xl p-2 bg-white shadow-sm">
                        {post.featuredImage ? (
                            imageError || !imageUrl ? (
                                <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-center">
                                    <div className="text-red-600 mb-2">
                                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <p className="font-medium">Failed to load image</p>
                                    </div>
                                    <div className="text-xs text-gray-500 space-y-1">
                                        <p><strong>File ID:</strong> {post.featuredImage}</p>
                                        <p><strong>Generated URL:</strong> {imageUrl || 'None'}</p>
                                        <p><strong>URL Length:</strong> {imageUrl?.length || 0} chars</p>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={imageUrl}
                                    alt={post.title}
                                    className="rounded-xl max-w-full h-auto max-h-96 object-cover"
                                    onError={handleImageError}
                                    onLoad={handleImageLoad}
                                />
                            )
                        ) : (
                            <div className="p-8 bg-gray-50 border border-gray-200 rounded-xl text-center">
                                <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-gray-600">No featured image</p>
                            </div>
                        )}

                        {/* Edit/Delete buttons for authors */}
                        {isAuthor && (
                            <div className="absolute right-6 top-6">
                                <Link to={`/edit-post/${post.$id}`}>
                                    <Button bgColor="bg-green-500" className="mr-3 hover:bg-green-600">
                                        Edit
                                    </Button>
                                </Link>
                                <Button 
                                    bgColor="bg-red-500" 
                                    className="hover:bg-red-600"
                                    onClick={deletePost}
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Post Title */}
                <div className="w-full mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                        {post.title}
                    </h1>
                    <div className="mt-2 text-sm text-gray-500">
                        <p>Post ID: {post.$id}</p>
                        {post.slug && <p>Slug: {post.slug}</p>}
                    </div>
                </div>
                
                {/* Post Content - FIXED SECTION */}
                <div className="prose prose-lg max-w-none">
                    <div className="browser-css">
                        {parseContent(post.content)}
                    </div>
                </div>
            </Container>
        </div>
    );
}