import React, { useEffect, useRef, useState } from "react";
import { IKContext, IKUpload, IKImage } from "imagekitio-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  LoaderCircle,
  XCircle,
  Upload,
  X,
} from "lucide-react";
import { appwriteService } from "../../../../appwrite/appwriteConfig";

const ImageUploader = ({
  folderName = "img",
  images, setImages
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDeleting, setIsDeleting] = useState({});
  const ikUploadRef = useRef(null);

  const resetUploadState = () => {
    setIsUploading(false);
    setProgress(0);
  };

  const onError = (err) => {
    console.error("Upload error:", err);
    toast.error(`Upload failed: ${err.message || "Unknown error"}`);
    resetUploadState();
  };

  const onSuccess = async (res) => {
    if (res && res.url) {
      const newImage = {
        id: res.fileId,
        url: res.url,
        name: res.name || "Uploaded image"
      };
      setImages((prev) => {
        const updated = [...prev, newImage];
        return updated;
      });
      toast.success("Image uploaded successfully!");
    }
    resetUploadState();
  };

  const onUploadProgress = (progressEvent) => {
    const { loaded, total } = progressEvent;
    const percentage = loaded && total ? Math.round((loaded / total) * 100) : 0;
    setProgress(percentage);
  };

  const onUploadStart = () => {
    setIsUploading(true);
  };

  const deleteImage = async (fileId) => {
    if (!fileId) {
      toast.error("Invalid file ID");
      return;
    }
    setIsDeleting((prev) => ({ ...prev, [fileId]: true }));
    try {
      const func = appwriteService.getFunctions();
      const res = await func.createExecution(
        "67d3fa29000adc329a4a",
        JSON.stringify({ action: "delete", fileId })
      );
      
      if (!res?.responseBody) throw new Error("Empty response from server");
      const result = JSON.parse(res.responseBody);
      if (result.success) {
        setImages((prevImages) => {
          const updated = prevImages.filter((img) => img.id !== fileId);
          return updated;
        });
        toast.success("Image deleted successfully!");
      } else {
        throw new Error(result.error || "Unknown error");
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(`Delete failed: ${error.message || error}`);
    } finally {
      setIsDeleting((prev) => {
        const updated = { ...prev };
        delete updated[fileId];
        return updated;
      });
    }
  };

  const authenticator = async () => {
    try {
      const func = appwriteService.getFunctions();
      const result = await func.createExecution(
        "67d3fa29000adc329a4a",
        JSON.stringify({ action: "auth" })
      );
      return JSON.parse(result.responseBody);
    } catch (error) {
      console.error("Authentication failed:", error);
      toast.error("Authentication failed");
      return {};
    }
  };

  useEffect(() => {
    authenticator();
  }, []);

  return (
    <div className="w-full">
      <IKContext
        publicKey="public_XRJ+5WkyLqprBrqQrPe5F1cHqoU="
        urlEndpoint="https://ik.imagekit.io/71amgqe4f"
        authenticator={authenticator}
      >
        <div className="mb-6">
          {/* Hidden Upload Input */}
          <IKUpload
            useUniqueFileName={true}
            folder={`/${folderName}`}
            isPrivateFile={false}
            validateFile={(file) => {
              const validTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
              ];
              const isValidType = validTypes.includes(file.type);
              const isValidSize = file.size < 2 * 1024 * 1024; // 2MB limit
              if (!isValidType) {
                toast.error("Only image files are allowed");
                return false;
              }
              if (!isValidSize) {
                toast.error("File size must be less than 2MB");
                return false;
              }
              return true;
            }}
            responseFields={["url", "fileId", "name", "size"]}
            onError={onError}
            onSuccess={onSuccess}
            onUploadProgress={onUploadProgress}
            onUploadStart={onUploadStart}
            ref={ikUploadRef}
            style={{ display: "none" }}
          />

          {/* Custom Upload Button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => ikUploadRef.current?.click()}
              disabled={isUploading}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
            >
              <Upload className="mr-2 h-5 w-5" />
              {isUploading ? "Uploading..." : "Upload Images"}
            </button>

            {isUploading && (
              <button
                type="button"
                onClick={() => {
                  if (ikUploadRef.current) {
                    ikUploadRef.current.abort();
                    toast.info("Upload cancelled");
                    resetUploadState();
                  }
                }}
                className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Cancel
              </button>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="mt-4">
              <div className="flex items-center mb-1">
                <LoaderCircle className="animate-spin mr-2 h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">
                  Uploading: {progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Image Previews */}
        <div className="mt-6">
          {images && images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative group">
                  
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                    <IKImage           
                      path={image.url.split("/").slice(4).join("/")}
                      transformation={[
                        { height: 300, width: 300, cropMode: "pad_resize" },
                      ]}
                      lqip={{ active: true }}
                      className="object-cover w-full h-full"
                      alt={image.name}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteImage(image.id)}
                    disabled={isDeleting[image.id]}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Image"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                  <p className="text-sm truncate mt-1">{image.name}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <p className="text-gray-500 text-center">
                No images uploaded yet. Click the upload button to add images.
              </p>
            </div>
          )}
        </div>
      </IKContext>
    </div>
  );
};

export default ImageUploader;
