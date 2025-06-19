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

        setError("Failed to load posts");
        setPosts([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      isMounted = false;
    };
  }, []);

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

  // Error state
  if (error) {
    return (
      <div className="w-full py-8 mt-4 text-center">
        <Container>
          <div className="flex flex-wrap">
            <div className="p-2 w-full">
              <h1 className="text-2xl font-bold text-red-600 mb-4">
                Error Loading Posts
              </h1>
              <p className="text-gray-700 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // No posts state
  if (posts.length === 0) {
    return (
      <div className="w-full py-8 mt-4 text-center">
        <Container>
          <div className="flex flex-wrap">
            <div className="p-2 w-full">
              <h1 className="text-2xl font-bold hover:text-gray-500">
                {authStatus ? "No posts available" : "Login to read posts"}
              </h1>
              {!authStatus && (
                <p className="text-gray-600 mt-2">
                  Please sign in to view the latest posts
                </p>
              )}
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
