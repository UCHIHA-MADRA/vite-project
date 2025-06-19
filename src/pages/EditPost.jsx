import React, { useEffect, useState } from "react";
import { Container, PostForm } from "../components";
import appwriteService from "../appwrite/config";
import { useNavigate, useParams } from "react-router-dom";

function EditPost() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) {
        setError("No slug provided in URL parameters");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log("=== EditPost Debug ===");
        console.log("Fetching post for slug:", slug);
        console.log("Slug type:", typeof slug);
        console.log("Slug length:", slug.length);

        // Additional debug: Check appwriteService configuration
        console.log("AppwriteService config:", {
          hasGetPost: typeof appwriteService.getPost === "function",
          hasDatabases: !!appwriteService?.databases,
          hasConfig: !!appwriteService?.conf,
          databaseId: appwriteService.conf?.appwriteDatabaseId,
          collectionId: appwriteService.conf?.appwriteCollectionId,
        });

        const response = await appwriteService.getPost(slug);

        console.log("EditPost received response:", response);
        console.log("Response is null/undefined:", response == null);
        console.log("Response strict null:", response === null);
        console.log("Response strict undefined:", response === undefined);

        // Store comprehensive debug info
        setDebugInfo({
          slug: slug,
          responseReceived: response !== null && response !== undefined,
          responseType: typeof response,
          responseKeys: response ? Object.keys(response) : [],
          hasDocuments: response?.documents ? true : false,
          documentsLength: response?.documents?.length || 0,
          totalCount: response?.total || 0,
          hasId: response?.$id ? true : false,
          rawResponse: response,
          serviceConfig: {
            hasGetPost: typeof appwriteService.getPost === "function",
            hasDatabases: !!appwriteService.databases,
            hasConfig: !!appwriteService.conf,
            databaseId: appwriteService.conf?.appwriteDatabaseId,
            collectionId: appwriteService.conf?.appwriteCollectionId,
          },
        });

        if (!response) {
          setError(
            "No response received from server - check your appwriteService.getPost() method"
          );
          return;
        }

        // Handle the response based on its structure
        if (response.documents) {
          if (response.documents.length > 0) {
            console.log(
              "Post found in documents array:",
              response.documents[0]
            );
            setPost(response.documents[0]);
          } else {
            console.log("No documents found for slug:", slug);
            setError(`Post not found. No documents match the slug "${slug}"`);
          }
        } else if (response.$id) {
          // Direct document response
          console.log("Direct document found:", response);
          setPost(response);
        } else {
          console.log("Unexpected response structure:", response);
          setError("Unexpected response structure from server");
        }
      } catch (err) {
        console.error("=== EditPost Catch Block ===");
        console.error("Error caught:", err);
        console.error("Error type:", typeof err);
        console.error("Error message:", err.message);
        console.error("Error code:", err.code);
        console.error("Full error object:", JSON.stringify(err, null, 2));

        let errorMessage = "Unknown error occurred";

        if (err.message) {
          errorMessage = err.message;
        } else if (typeof err === "string") {
          errorMessage = err;
        }

        // Handle specific Appwrite errors
        if (err.code === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (err.code === 404) {
          errorMessage = "Post not found or has been deleted.";
        } else if (err.code === 403) {
          errorMessage =
            "Access denied. You don't have permission to view this post.";
        }

        setError(`Error: ${errorMessage}`);
        setDebugInfo({
          error: err.message || err,
          errorCode: err.code,
          errorType: err.type,
          fullError: JSON.stringify(err, null, 2),
          slug: slug,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  // Enhanced test connection with multiple methods
  const testConnection = async () => {
    try {
      console.log("Testing database connection...");

      // Test 1: Basic database connection
      const testResponse = await appwriteService.databases.listDocuments(
        appwriteService.conf.appwriteDatabaseId,
        appwriteService.conf.appwriteCollectionId
      );
      console.log("Connection test result:", testResponse);

      // Test 2: Try to get the specific document by ID if slug looks like an ID
      if (slug && slug.length > 10) {
        try {
          console.log("Attempting to get document by ID:", slug);
          const docById = await appwriteService.databases.getDocument(
            appwriteService.conf.appwriteDatabaseId,
            appwriteService.conf.appwriteCollectionId,
            slug
          );
          console.log("Document found by ID:", docById);
          alert("Document found by ID! Check console for details.");
          return;
        } catch (idError) {
          console.log("Failed to get by ID:", idError.message);
        }
      }

      // Test 3: List some documents to see what's available
      console.log("Available documents:", testResponse.documents.slice(0, 3));

      alert(
        `Connection successful! Found ${testResponse.total} total documents. Check console for details.`
      );
    } catch (err) {
      console.error("Connection test failed:", err);
      alert(`Connection failed: ${err.message}`);
    }
  };

  // Test the getPost method directly
  const testGetPost = async () => {
    try {
      console.log("Testing getPost method with slug:", slug);

      // Check if method exists
      if (typeof appwriteService.getPost !== "function") {
        alert("getPost method is not defined in appwriteService!");
        return;
      }

      const result = await appwriteService.getPost(slug);
      console.log("getPost result:", result);

      if (result) {
        alert("getPost returned data! Check console for details.");
      } else {
        alert(
          "getPost returned null/undefined. Check your getPost implementation."
        );
      }
    } catch (err) {
      console.error("getPost test failed:", err);
      alert(`getPost failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <Container>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div>Loading post...</div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Container>
        {/* Enhanced Debug Information Panel */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg border">
          <h3 className="font-bold mb-2 text-lg">
            🔍 Enhanced Debug Information
          </h3>
          <div className="text-sm space-y-1">
            <p>
              <strong>Slug from URL:</strong>{" "}
              <code className="bg-white px-1 rounded">{slug}</code>
            </p>
            <p>
              <strong>Post Status:</strong>{" "}
              <span className={post ? "text-green-600" : "text-red-600"}>
                {post ? "Found ✓" : "Not Found ✗"}
              </span>
            </p>
            <p>
              <strong>Error Status:</strong>{" "}
              <span className={error ? "text-red-600" : "text-green-600"}>
                {error || "None ✓"}
              </span>
            </p>

            {debugInfo && (
              <div className="mt-3 p-3 bg-white rounded border">
                <h4 className="font-semibold mb-2">API Response Details:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <p>
                    <strong>Response Received:</strong>{" "}
                    {debugInfo.responseReceived ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Response Type:</strong> {debugInfo.responseType}
                  </p>
                  <p>
                    <strong>Has Documents Array:</strong>{" "}
                    {debugInfo.hasDocuments ? "Yes" : "No"}
                  </p>
                  <p>
                    <strong>Documents Count:</strong>{" "}
                    {debugInfo.documentsLength}
                  </p>
                  <p>
                    <strong>Total Count:</strong> {debugInfo.totalCount}
                  </p>
                  <p>
                    <strong>Has $id:</strong> {debugInfo.hasId ? "Yes" : "No"}
                  </p>
                </div>

                {debugInfo.serviceConfig && (
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <h5 className="font-semibold mb-1">
                      Service Configuration:
                    </h5>
                    <div className="text-xs space-y-1">
                      <p>
                        <strong>Has getPost method:</strong>{" "}
                        {debugInfo.serviceConfig.hasGetPost ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Has databases:</strong>{" "}
                        {debugInfo.serviceConfig.hasDatabases ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Has config:</strong>{" "}
                        {debugInfo.serviceConfig.hasConfig ? "Yes" : "No"}
                      </p>
                      <p>
                        <strong>Database ID:</strong>{" "}
                        {debugInfo.serviceConfig.databaseId || "Not set"}
                      </p>
                      <p>
                        <strong>Collection ID:</strong>{" "}
                        {debugInfo.serviceConfig.collectionId || "Not set"}
                      </p>
                    </div>
                  </div>
                )}

                <details className="mt-2">
                  <summary className="cursor-pointer font-semibold text-blue-600 hover:text-blue-800">
                    View Raw Response Data
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40 border">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            <div className="mt-3 pt-3 border-t space-x-2">
              <button
                onClick={testConnection}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded"
              >
                Test Database Connection
              </button>
              <button
                onClick={testGetPost}
                className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1 rounded"
              >
                Test getPost Method
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {error ? (
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <svg
                  className="w-6 h-6 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <strong className="font-bold">Error Occurred</strong>
              </div>
              <p className="mb-4">{error}</p>
              <div className="space-x-2">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        ) : post ? (
          <div>
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded">
              ✓ Post loaded successfully! You can now edit it below.
            </div>
            <PostForm post={post} />
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                  clipRule="evenodd"
                />
              </svg>
              <p>No post data available</p>
              <p className="text-xs mt-2">
                The getPost method returned null/undefined
              </p>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export default EditPost;

// import React, { useEffect, useState } from "react";
// import { Container, PostForm } from "../components";
// import appwriteService from "../appwrite/config";
// import { useNavigate, useParams } from "react-router-dom";

// function EditPost() {
//   const [post, setPosts] = useState(null);
//   const { slug } = useParams();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (slug) {
//       appwriteService.getPost(slug).then((post) => {
//         if (post) {
//           setPosts(post);
//         }
//       });
//     } else {
//       navigate("/");
//     }
//   }, [slug, navigate]);
//   return post ? (
//     <div className="py-8">
//       <Container>
//         <PostForm post={post} />
//       </Container>
//     </div>
//   ) : null;
// }

// export default EditPost;
