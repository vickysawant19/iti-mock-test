import React, { useEffect, useRef, useState } from "react";
import { IKContext, IKUpload, IKImage, IKCore } from "imagekitio-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  LoaderCircle,
  XCircle,
  Upload,
  FolderOpen,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { appwriteService } from "../../../../appwrite/appwriteConfig";

const ImageUploader = ({
  folderName,
  fileName,
  setImages,
  images,
  setValue,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previews, setPreviews] = useState([]);
  const ikUploadRef = useRef(null);

  const resetUploadState = () => {
    setIsUploading(false);
    setProgress(0);
  };

  const onError = (err) => {
    console.log("Error", err);
    toast.error(`Upload failed: ${err.message || "Unknown error"}`);
    resetUploadState();
  };

  const onSuccess = (res) => {
    //   {
    //     "fileId": "67d40f5e432c4764161308df",
    //     "name": "test-image_zzSP41syb",
    //     "size": 56274,
    //     "versionInfo": {
    //         "id": "67d40f5e432c4764161308df",
    //         "name": "Version 1"
    //     },
    //     "filePath": "/iti-mock-test/test-image_zzSP41syb",
    //     "url": "https://ik.imagekit.io/71amgqe4f/iti-mock-test/test-image_zzSP41syb",
    //     "fileType": "image",
    //     "height": 768,
    //     "width": 512,
    //     "thumbnailUrl": "https://ik.imagekit.io/71amgqe4f/tr:n-ik_ml_thumbnail/iti-mock-test/test-image_zzSP41syb",
    //     "AITags": null
    // }
    // console.log("Success", res);
    setValue("images", [...images, { id: res.fileId, url: res.url }]);
    setImages((prev) => [...prev, { id: res.fileId, url: res.url }]);
    toast.success("Image uploaded successfully!");
    resetUploadState();

    // Add the newly uploaded image to previews
    if (res && res.url) {
      setPreviews((prev) => [
        ...prev,
        {
          url: res.url,
          fileId: res.fileId,
          name: res.name || "Uploaded image",
        },
      ]);
    }
  };

  const onUploadProgress = (progress) => {
    // console.log("Progress", progress);
    const percentage =
      progress.loaded && progress.total
        ? Math.round((progress.loaded / progress.total) * 100)
        : 0;
    setProgress(percentage);
  };

  const onUploadStart = () => {
    setIsUploading(true);
    toast.info("Upload started");
  };

  const handleRemovePreview = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const authenticator = async () => {
    try {
      const func = appwriteService.getFunctions();
      const result = await func.createExecution("67d3fa29000adc329a4a");
      return JSON.parse(result.responseBody);
    } catch (error) {
      console.log(error);
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
          {/* Hidden upload input */}
          <IKUpload
            fileName={fileName}
            useUniqueFileName={true}
            folder={`/${folderName}`}
            isPrivateFile={false}
            validateFile={(file) => {
              // Validate file size (2MB) and type
              const validTypes = [
                "image/jpeg",
                "image/png",
                "image/gif",
                "image/webp",
              ];
              const isValidType = validTypes.includes(file.type);
              const isValidSize = file.size < 1000000;

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

          {/* Custom upload button */}
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

          {/* Progress bar */}
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

        {/* Image previews */}
        {previews.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">Uploaded Images</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map((image, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border flex items-center justify-center">
                    <IKImage
                      urlEndpoint="https://ik.imagekit.io/71amgqe4f"
                      path={image.url.split("/").slice(-2).join("/")}
                      transformation={[
                        { height: 300, width: 300, cropMode: "pad_resize" },
                      ]}
                      // loading="lazy"
                      lqip={{ active: true }}
                      className="object-cover w-full h-full"
                      alt={image.name}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePreview(index)}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove from preview"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </button>
                  <p className="text-sm truncate mt-1">{image.name}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No images placeholder */}
        {previews.length === 0 && !isUploading && (
          <div className="mt-6 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
            <ImageIcon className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-center">
              No images uploaded yet. Click the upload button to add images.
            </p>
          </div>
        )}
      </IKContext>
    </div>
  );
};

export default ImageUploader;
