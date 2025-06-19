import conf from "../conf/conf.js";
import { Client, ID, Databases, Storage, Query, Account } from "appwrite";

export class Service {
  client = new Client();
  databases;
  account;
  bucket;

  constructor() {
    // Debug configuration on initialization
    console.log("=== Service Constructor Debug ===");
    console.log("Config imported:", !!conf);
    console.log("Config keys:", Object.keys(conf || {}));
    console.log("Database ID:", conf.appwriteDatabaseId);
    console.log("Collection ID:", conf.appwriteCollectionId);
    console.log("URL:", conf?.appwriteURL);

    this.client
      .setEndpoint(conf.appwriteURL)
      .setProject(conf.appwriteProjectId);
    this.databases = new Databases(this.client);
    this.account = new Account(this.client);
    this.bucket = new Storage(this.client);
  }

  // Method to check configuration - useful for debugging
  getConfig() {
    return {
      hasConfig: !!(conf.appwriteDatabaseId && conf.appwriteCollectionId),
      databaseId: conf.appwriteDatabaseId,
      collectionId: conf.appwriteCollectionId,
      bucketId: conf.appwriteBucketId,
      url: conf.appwriteURL,
      projectId: conf.appwriteProjectId,
    };
  }

  // Validate configuration before operations
  validateConfig() {
    if (!conf) {
      throw new Error("Configuration not imported properly");
    }
    if (!conf.appwriteDatabaseId) {
      throw new Error("Database ID is missing from configuration");
    }
    if (!conf.appwriteCollectionId) {
      throw new Error("Collection ID is missing from configuration");
    }
    if (!conf.appwriteURL) {
      throw new Error("Appwrite URL is missing from configuration");
    }
    if (!conf.appwriteProjectId) {
      throw new Error("Project ID is missing from configuration");
    }
  }

  async createPost({ title, slug, content, featuredImage, status, userId }) {
    try {
      this.validateConfig();

      return await this.databases.createDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        ID.unique(),
        {
          title,
          slug,
          content,
          featuredImage,
          status,
          userId,
        }
      );
    } catch (error) {
      console.error("Appwrite service :: createPost :: error", error);
      throw error;
    }
  }

  async updatePost(
    documentId,
    { title, content, featuredImage, status, slug }
  ) {
    try {
      this.validateConfig();

      if (!documentId) {
        throw new Error("Document ID is required for update");
      }

      return await this.databases.updateDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        documentId,
        {
          title,
          content,
          featuredImage,
          status,
          slug,
        }
      );
    } catch (error) {
      console.error("Appwrite service :: updatePost :: error", error);
      throw error;
    }
  }

  async deletePost(documentId) {
    try {
      this.validateConfig();

      if (!documentId) {
        throw new Error("Document ID is required for deletion");
      }

      await this.databases.deleteDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        documentId
      );
      return true;
    } catch (error) {
      console.error("Appwrite service :: deletePost :: error", error);
      return false;
    }
  }
async getPost(identifier) {
  try {
    this.validateConfig();
    
    // Auth check (optional based on your needs)
    try {
      await this.account.get();
    } catch (authError) {
      // Only throw if you require authentication for all posts
      if (this.requiresAuth) {
        throw new Error("Please log in to view this post.");
      }
    }

    console.log("=== getPost Debug Info ===");
    console.log("Identifier received:", identifier);
    console.log("Identifier type:", typeof identifier);
    console.log("Identifier length:", identifier?.length);
    console.log("Using Database ID:", conf.appwriteDatabaseId);
    console.log("Using Collection ID:", conf.appwriteCollectionId);

    if (!identifier || identifier.trim() === '') {
      throw new Error("Valid identifier parameter is required");
    }

    const cleanIdentifier = identifier.trim();

    // Try by ID first (Appwrite document IDs are exactly 20 characters)
    if (cleanIdentifier.length === 20) {
      try {
        console.log("Attempting to get document by ID:", cleanIdentifier);
        const document = await this.databases.getDocument(
          conf.appwriteDatabaseId,
          conf.appwriteCollectionId,
          cleanIdentifier
        );
        console.log("✓ Document found by ID:", document.$id);
        return document;
      } catch (idError) {
        console.log("Failed to get by ID:", idError.message);
        
        // Check for specific error types
        if (idError.code === 404 || idError.type === "document_not_found") {
          console.log("Document not found by ID, trying slug...");
        } else if (idError.code === 401) {
          throw new Error("Authentication required to access this post");
        } else {
          // For other errors, might still want to try slug
          console.log("Other error occurred, trying slug...");
        }
      }
    }

    // Try by slug field
    console.log("Attempting to get document by slug field:", cleanIdentifier);
    
    try {
      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        [Query.equal("slug", cleanIdentifier)]
      );

      console.log("Slug search - Total documents:", response?.total);
      console.log("Slug search - Documents array length:", response?.documents?.length);

      if (response?.documents?.length > 0) {
        console.log("✓ Document found by slug:", response.documents[0].$id);
        return response.documents[0];
      }
      
      console.warn("❌ No post found for identifier:", cleanIdentifier);
      return null;
      
    } catch (slugError) {
      console.error("Error searching by slug:", slugError.message);
      
      if (slugError.code === 401) {
        throw new Error("Authentication required to search posts");
      }
      
      throw slugError;
    }

  } catch (error) {
    console.error("=== getPost Error ===");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error type:", error.type);
    console.error("Full error:", error);

    // Don't wrap already meaningful errors
    if (error.message.includes("Please log in") || 
        error.message.includes("Authentication required") ||
        error.message.includes("Valid identifier parameter")) {
      throw error;
    }

    // Re-throw with context for other errors
    throw new Error(`Failed to get post with identifier "${identifier}": ${error.message}`);
  }
}
  async getPostById(documentId) {
    try {
      this.validateConfig();

      if (!documentId) {
        throw new Error("Document ID is required");
      }

      console.log("Getting post by document ID:", documentId);
      return await this.databases.getDocument(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        documentId
      );
    } catch (error) {
      console.error("getPostById error:", error);
      if (error.code === 404 || error.type === "document_not_found") {
        return null;
      }
      throw error;
    }
  }

  async getPostBySlug(slug) {
    try {
      this.validateConfig();

      if (!slug) {
        throw new Error("Slug is required");
      }

      console.log("Getting post by slug field:", slug);
      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        [Query.equal("slug", slug)]
      );

      if (response.documents.length > 0) {
        return response.documents[0];
      }
      return null;
    } catch (error) {
      console.error("getPostBySlug error:", error);
      throw error;
    }
  }

  async getPosts(queries = [Query.equal("status", "active")]) {
    try {
      this.validateConfig();
      await this.account.get().catch(() => {
        throw new Error("Please log in to view this post.");
      });
      return await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        queries
      );
    } catch (error) {
      console.error("Appwrite service :: getPosts :: error", error);
      throw error;
    }
  }

  async uploadFile(file) {
    try {
      this.validateConfig();

      if (!file) {
        throw new Error("File is required for upload");
      }

      if (!conf.appwriteBucketId) {
        throw new Error("Bucket ID is missing from configuration");
      }

      return await this.bucket.createFile(
        conf.appwriteBucketId,
        ID.unique(),
        file
      );
    } catch (error) {
      console.error("Appwrite service :: uploadFile :: error", error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      this.validateConfig();

      if (!fileId) {
        throw new Error("File ID is required for deletion");
      }

      if (!conf.appwriteBucketId) {
        throw new Error("Bucket ID is missing from configuration");
      }

      await this.bucket.deleteFile(conf.appwriteBucketId, fileId);
      return true;
    } catch (error) {
      console.error("Appwrite service :: deleteFile :: error", error);
      return false;
    }
  }

  getFileView(fileId) {
    try {
      this.validateConfig();

      if (!fileId) {
        throw new Error("File ID is required");
      }

      if (!conf.appwriteBucketId) {
        throw new Error("Bucket ID is missing from configuration");
      }

      console.log("Getting file view for:", fileId);
      return this.bucket.getFileView(conf.appwriteBucketId, fileId);
    } catch (error) {
      console.error("Error getting file view:", error);
      throw error;
    }
  }

  getFileDownload(fileId) {
    try {
      this.validateConfig();

      if (!fileId) {
        throw new Error("File ID is required");
      }

      if (!conf.appwriteBucketId) {
        throw new Error("Bucket ID is missing from configuration");
      }

      console.log("Getting file download for:", fileId);
      return this.bucket.getFileDownload(conf.appwriteBucketId, fileId);
    } catch (error) {
      console.error("Error getting file download:", error);
      throw error;
    }
  }

  async debugListPosts(limit = 10) {
    try {
      this.validateConfig();

      console.log("=== Debug: Listing posts ===");
      const response = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        [Query.limit(limit)]
      );

      console.log("Total posts:", response.total);
      console.log("Posts found:", response.documents.length);

      response.documents.forEach((doc, index) => {
        console.log(`Post ${index + 1}:`, {
          id: doc.$id,
          slug: doc.slug,
          title: doc.title,
          status: doc.status,
        });
      });

      return response;
    } catch (error) {
      console.error("debugListPosts error:", error);
      throw error;
    }
  }

  // Test connection method for debugging
  async testConnection() {
    try {
      console.log("=== Testing Appwrite Connection ===");

      // Test configuration
      const configCheck = this.getConfig();
      console.log("Configuration check:", configCheck);

      if (!configCheck.hasConfig) {
        throw new Error("Configuration is invalid");
      }

      // Test database connection by listing documents
      const testResponse = await this.databases.listDocuments(
        conf.appwriteDatabaseId,
        conf.appwriteCollectionId,
        [Query.limit(1)]
      );

      console.log("✓ Database connection successful");
      console.log("✓ Collection accessible");
      console.log("✓ Total documents in collection:", testResponse.total);

      return {
        success: true,
        message: "Connection test passed",
        config: configCheck,
        totalDocuments: testResponse.total,
      };
    } catch (error) {
      console.error("❌ Connection test failed:", error);
      return {
        success: false,
        message: error.message,
        config: this.getConfig(),
        error: error,
      };
    }
  }

  // Enhanced debugging methods for configuration issues
  async debugConfiguration() {
    console.log("=== COMPREHENSIVE CONFIGURATION DEBUG ===");

    // Check if conf object exists
    console.log("1. Configuration object exists:", !!conf);
    console.log("2. Configuration object:", conf);

    // Check each environment variable
    console.log("3. Environment Variables Check:");
    console.log("   - VITE_APPWRITE_URL:", import.meta.env.VITE_APPWRITE_URL);
    console.log(
      "   - VITE_APPWRITE_PROJECT_ID:",
      import.meta.env.VITE_APPWRITE_PROJECT_ID
    );
    console.log(
      "   - VITE_APPWRITE_DATABASE_ID:",
      import.meta.env.VITE_APPWRITE_DATABASE_ID
    );
    console.log(
      "   - VITE_APPWRITE_COLLECTION_ID:",
      import.meta.env.VITE_APPWRITE_COLLECTION_ID
    );
    console.log(
      "   - VITE_APPWRITE_BUCKET_ID:",
      import.meta.env.VITE_APPWRITE_BUCKET_ID
    );

    // Check processed config values
    console.log("4. Processed Config Values (what the service actually uses):");
    console.log("   - URL:", conf.appwriteURL);
    console.log("   - Project ID:", conf.appwriteProjectId);
    console.log("   - Database ID:", conf.appwriteDatabaseId);
    console.log("   - Collection ID:", conf.appwriteCollectionId);
    console.log("   - Bucket ID:", conf.appwriteBucketId);

    // Check for common issues
    console.log("5. Common Issues Check:");
    console.log(
      "   - URL contains 'undefined':",
      conf.appwriteURL?.includes("undefined")
    );
    console.log(
      "   - Project ID contains 'undefined':",
      conf.appwriteProjectId?.includes("undefined")
    );
    console.log(
      "   - Database ID contains 'undefined':",
      conf.appwriteDatabaseId?.includes("undefined")
    );
    console.log(
      "   - Collection ID contains 'undefined':",
      conf.appwriteCollectionId?.includes("undefined")
    );

    // Test actual connection
    try {
      console.log("6. Testing actual connection...");
      const testResult = await this.testConnection();
      console.log("   Connection test result:", testResult);
    } catch (error) {
      console.error("   Connection test failed:", error);
    }

    return {
      configExists: !!conf,
      envVars: {
        url: import.meta.env.VITE_APPWRITE_URL,
        projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
        databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
        collectionId: import.meta.env.VITE_APPWRITE_COLLECTION_ID,
        bucketId: import.meta.env.VITE_APPWRITE_BUCKET_ID,
      },
      processedConfig: {
        url: conf.appwriteURL,
        projectId: conf.appwriteProjectId,
        databaseId: conf.appwriteDatabaseId,
        collectionId: conf.appwriteCollectionId,
        bucketId: conf.appwriteBucketId,
      },
    };
  }

  // Enhanced validation with specific error messages
  validateConfigEnhanced() {
    console.log("=== ENHANCED VALIDATION DEBUG ===");

    if (!conf) {
      console.error("❌ Configuration object is null/undefined");
      throw new Error(
        "Configuration not imported properly - check your import statement"
      );
    }

    // Check each required field with specific error messages
    const requiredFields = [
      { key: "appwriteURL", name: "Appwrite URL" },
      { key: "appwriteProjectId", name: "Project ID" },
      { key: "appwriteDatabaseId", name: "Database ID" },
      { key: "appwriteCollectionId", name: "Collection ID" },
    ];

    requiredFields.forEach((field) => {
      const value = conf[field.key];
      console.log(`Checking ${field.name}:`, value);

      if (!value) {
        console.error(`❌ ${field.name} is missing or empty`);
        throw new Error(
          `${
            field.name
          } is missing from configuration. Check your .env file for VITE_${field.key
            .replace(/([A-Z])/g, "_$1")
            .toUpperCase()}`
        );
      }

      if (value.includes("undefined")) {
        console.error(`❌ ${field.name} contains 'undefined'`);
        throw new Error(
          `${field.name} is not properly loaded from environment variables. Check your .env file.`
        );
      }

      console.log(`✅ ${field.name} is valid`);
    });

    console.log("✅ All configuration fields validated successfully");
  }

  // Step-by-step diagnostics
  async performDiagnostics() {
    console.log("=== PERFORMING FULL DIAGNOSTICS ===");

    const steps = [
      {
        name: "Environment Variables",
        test: () => {
          const envVars = {
            url: import.meta.env.VITE_APPWRITE_URL,
            projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
            databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
            collectionId: import.meta.env.VITE_APPWRITE_COLLECTION_ID,
          };

          const missing = Object.entries(envVars)
            .filter(([key, value]) => !value || value === "undefined")
            .map(([key]) => key);

          if (missing.length > 0) {
            throw new Error(
              `Missing environment variables: ${missing.join(", ")}`
            );
          }

          return envVars;
        },
      },
      {
        name: "Configuration Loading",
        test: () => {
          if (!conf) throw new Error("Configuration object not loaded");
          return this.getConfig();
        },
      },
      {
        name: "Client Initialization",
        test: () => {
          if (!this.client) throw new Error("Appwrite client not initialized");
          if (!this.databases)
            throw new Error("Databases service not initialized");
          return { client: !!this.client, databases: !!this.databases };
        },
      },
      {
        name: "Database Connection",
        test: async () => {
          const response = await this.databases.listDocuments(
            conf.appwriteDatabaseId,
            conf.appwriteCollectionId,
            [Query.limit(1)]
          );
          return { connected: true, totalDocs: response.total };
        },
      },
    ];

    const results = {};

    for (const step of steps) {
      try {
        console.log(`Testing: ${step.name}...`);
        const result = await step.test();
        console.log(`✅ ${step.name}: PASSED`, result);
        results[step.name] = { status: "PASSED", data: result };
      } catch (error) {
        console.error(`❌ ${step.name}: FAILED`, error.message);
        results[step.name] = { status: "FAILED", error: error.message };
        // Stop on first failure for easier debugging
        break;
      }
    }

    return results;
  }
}

const service = new Service();
export default service;
