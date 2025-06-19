import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import appwriteService from "../appwrite/config";
import { Container, PostCard } from "../components";

function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get authentication status from Redux store
  const authStatus = useSelector((state) => state.auth.status);

  useEffect(() => {
    let isMounted = true;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const postsData = await appwriteService.getPosts();

        if (!isMounted) return;

        if (postsData && postsData.documents) {
          setPosts(postsData.documents);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("Error fetching posts:", error);

        if (!isMounted) return;

        // Check if error is due to authentication
        const isAuthError =
          error.code === 401 ||
          error.message.includes("log in") ||
          error.message.includes("authentication") ||
          error.message.includes("unauthorized");

        if (isAuthError && !authStatus) {
          // Don't set error for unauthenticated users, just show empty posts
          setPosts([]);
        } else {
          // Set error for other issues
          setError("Failed to load posts. Please try again.");
          setPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Only fetch posts if user is authenticated
    if (authStatus) {
      fetchPosts();
    } else {
      // If not authenticated, just stop loading
      setLoading(false);
      setPosts([]);
      setError(null);
    }

    return () => {
      isMounted = false;
    };
  }, [authStatus]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full py-8 mt-4 text-center">
        <Container>
          <div className="flex flex-wrap">
            <div className="p-2 w-full">
              <div className="text-xl mb-4">Loading posts...</div>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto"></div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Show login message if not authenticated
  if (!authStatus) {
    return (
      <div className="w-full py-8 mt-4 text-center">
        <Container>
          <div className="flex flex-wrap">
            <div className="p-2 w-full">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">📝</div>
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                  Welcome to Our Blog
                </h1>
                <p className="text-lg text-gray-600 mb-6">
                  Please sign in to read the latest posts and join our community
                </p>
                <div className="space-y-3">
                  <a
                    href="/login"
                    className="inline-block px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Sign In
                  </a>
                  <div className="text-sm text-gray-500">
                    Don't have an account?{" "}
                    <a
                      href="/signup"
                      className="text-blue-500 hover:text-blue-600 font-medium"
                    >
                      Sign up here
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Error state (only for authenticated users)
  if (error) {
    return (
      <div className="w-full py-8 mt-4 text-center">
        <Container>
          <div className="flex flex-wrap">
            <div className="p-2 w-full">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">⚠️</div>
                <h1 className="text-2xl font-bold text-red-600 mb-4">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-700 mb-6">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // No posts state (for authenticated users)
  if (posts.length === 0) {
    return (
      <div className="w-full py-8 mt-4 text-center">
        <Container>
          <div className="flex flex-wrap">
            <div className="p-2 w-full">
              <div className="max-w-md mx-auto">
                <div className="text-6xl mb-6">📖</div>
                <h1 className="text-2xl font-bold text-gray-800 mb-4">
                  No posts available yet
                </h1>
                <p className="text-gray-600 mb-6">
                  Be the first to create a post and start sharing your thoughts!
                </p>
                <a
                  href="/add-post"
                  className="inline-block px-6 py-3 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  Create First Post
                </a>
              </div>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // Posts display
  return (
    <div className="w-full py-8">
      <Container>
        <div className="flex flex-wrap">
          {posts.map((post) => (
            <div
              key={post.$id}
              className="p-2 w-full sm:w-1/2 lg:w-1/3 xl:w-1/4"
            >
              <PostCard {...post} />
            </div>
          ))}
        </div>

        {/* Show total count */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Showing {posts.length} post{posts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </Container>
    </div>
  );
}

export default Home;
