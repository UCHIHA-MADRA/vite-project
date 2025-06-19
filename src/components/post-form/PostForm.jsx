/* eslint-disable no-unused-vars */
import React, { useCallback, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, Select, RTE } from "../index";
import appwriteService from "../../appwrite/config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import conf from "../../conf/conf";

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function PostForm({ post }) {
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      content: post?.content || "",
      status: post?.status || "active",
    },
  });

  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth?.userData);

  // Test connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Check if appwriteService is properly configured
        if (!appwriteService) {
          throw new Error("AppwriteService is not initialized");
        }

        // Check if required configuration exists
        const requiredConfig = ["appwriteDatabaseId", "appwriteCollectionId"];
        const missingConfig = requiredConfig.filter((key) => !conf[key]);
        console.log("Appwrite config:", appwriteService.conf);

        if (missingConfig.length > 0) {
          throw new Error(`Missing configuration: ${missingConfig.join(", ")}`);
        }

        setConnectionError(null);
      } catch (error) {
        console.error("Connection test failed:", error);
        setConnectionError(error.message);
      }
    };

    testConnection();
  }, []);

  const submit = async (data) => {
    if (connectionError) {
      alert("Cannot submit: " + connectionError);
      return;
    }

    setLoading(true);
    try {
      // Strip HTML from content
      data.content = stripHtml(data.content);

      if (post) {
        // Updating existing post
        let fileId = post.featuredImage;

        if (data.image && data.image[0]) {
          const file = await appwriteService.uploadFile(data.image[0]);
          if (file) {
            // Delete old image if exists
            if (post.featuredImage) {
              try {
                await appwriteService.deleteFile(post.featuredImage);
              } catch (error) {
                console.warn("Failed to delete old image:", error);
              }
            }
            fileId = file.$id;
          }
        }

        const dbPost = await appwriteService.updatePost(post.$id, {
          ...data,
          featuredImage: fileId,
        });

        if (dbPost) {
          navigate(`/post/${dbPost.slug}`);
        }
      } else {
        // Creating new post
        let fileId = null;

        if (data.image && data.image[0]) {
          const file = await appwriteService.uploadFile(data.image[0]);
          if (file) {
            fileId = file.$id;
          }
        }

        // Make slug unique by appending timestamp
        const timestamp = Date.now().toString(36);
        const cleanSlug = slugTransform(data.slug || data.title);
        data.slug = `${cleanSlug}-${timestamp}`;

        const dbPost = await appwriteService.createPost({
          ...data,
          featuredImage: fileId,
          userId: userData?.$id,
        });

        if (dbPost) {
          navigate(`/post/${dbPost.slug}`);
        }
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      alert("Failed to submit post: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const slugTransform = useCallback((value) => {
    if (value && typeof value === "string") {
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z\d\s]+/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
    }
    return "";
  }, []);

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "title") {
        setValue("slug", slugTransform(value.title), {
          shouldValidate: true,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, slugTransform, setValue]);

  // Improved image preview effect
  useEffect(() => {
    if (!post?.featuredImage) {
      setImageUrl("");
      setImageError(false);
      return;
    }

    const loadImage = async () => {
      try {
        setImageError(false);

        // Check if appwriteService has the required methods
        if (!appwriteService.getFileView) {
          throw new Error("getFileView method not available");
        }

        // Get the file URL - prioritize getFileView over getFilePreview
        const url = appwriteService.getFileView(post.featuredImage);

        if (!url) {
          throw new Error("No URL returned from getFileView");
        }

        // Handle different URL formats
        const finalUrl =
          typeof url === "string" ? url : url.href || url.toString();

        if (!finalUrl) {
          throw new Error("Invalid URL format");
        }

        setImageUrl(finalUrl);
      } catch (error) {
        console.error("Failed to load image preview:", error);
        setImageError(true);
        setImageUrl("");
      }
    };

    loadImage();
  }, [post?.featuredImage]);

  const handleImageError = () => {
    console.error("Image failed to load:", imageUrl);
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log("Image loaded successfully");
    setImageError(false);
  };

  // Show connection error if exists
  if (connectionError) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold mb-2">
            Configuration Error
          </h3>
          <p className="text-red-700 mb-4">{connectionError}</p>
          <div className="text-sm text-red-600">
            <p>Please check your Appwrite configuration:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Verify your environment variables</li>
              <li>Ensure database ID is set</li>
              <li>Check collection IDs</li>
              <li>Confirm API endpoints are correct</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
      <div className="w-2/3 px-2">
        <Input
          label="Title :"
          placeholder="Title"
          className="mb-4"
          {...register("title", {
            required: "Title is required",
            minLength: {
              value: 3,
              message: "Title must be at least 3 characters",
            },
          })}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mb-2">{errors.title.message}</p>
        )}

        <Input
          label="Slug :"
          placeholder="Slug"
          className="mb-4"
          {...register("slug", {
            required: "Slug is required",
            minLength: {
              value: 3,
              message: "Slug must be at least 3 characters",
            },
          })}
          onInput={(e) => {
            setValue("slug", slugTransform(e.currentTarget.value), {
              shouldValidate: true,
            });
          }}
        />
        {errors.slug && (
          <p className="text-red-500 text-sm mb-2">{errors.slug.message}</p>
        )}

        <RTE
          label="Content :"
          name="content"
          control={control}
          defaultValue={getValues("content")}
        />
      </div>

      <div className="w-1/3 px-2">
        <Input
          label="Featured Image :"
          type="file"
          className="mb-4"
          accept="image/png, image/jpg, image/jpeg, image/gif, image/webp"
          {...register("image", {
            required: !post ? "Featured image is required" : false,
          })}
        />
        {errors.image && (
          <p className="text-red-500 text-sm mb-2">{errors.image.message}</p>
        )}

        {/* Image Preview Section */}
        {post?.featuredImage && (
          <div className="w-full mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Featured Image:
            </label>
            {imageError || !imageUrl ? (
              <div className="p-4 border border-red-300 rounded-lg bg-red-50">
                <p className="text-red-600 text-sm">
                  Failed to load image preview
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Image ID: {post.featuredImage}
                </p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Retry Loading
                </button>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imageUrl}
                  alt={post.title || "Featured image"}
                  className="rounded-lg w-full h-48 object-cover"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  Preview
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show placeholder when no image */}
        {!post?.featuredImage && (
          <div className="w-full mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-gray-500 text-sm mt-2">
                No featured image selected
              </p>
            </div>
          </div>
        )}

        <Select
          options={["active", "inactive"]}
          label="Status"
          className="mb-4"
          {...register("status", { required: "Status is required" })}
        />
        {errors.status && (
          <p className="text-red-500 text-sm mb-2">{errors.status.message}</p>
        )}

        <Button
          type="submit"
          bgColor={post ? "bg-green-500" : "bg-blue-500"}
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {post ? "Updating..." : "Submitting..."}
            </span>
          ) : post ? (
            "Update Post"
          ) : (
            "Create Post"
          )}
        </Button>
      </div>
    </form>
  );
}

export default PostForm;
