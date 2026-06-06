

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  file?: File;
}

export const uploadToCloudinary = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // ✅ Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Only JPG, PNG, or WebP images are allowed',
        file
      };
    }

    // ✅ Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Image size must be less than 5MB',
        file
      };
    }

    const cloud_name = "dt6nu9oqs";
    const upload_preset = "nearlook";
    const url = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", upload_preset);
    data.append("cloud_name", cloud_name);
    // ✅ Optional: Add folder for organization
    data.append("folder", "return_proofs");

    const res = await fetch(url, {
      method: "POST",
      body: data,
      // ✅ Optional: Track upload progress (requires xhr)
      // onUploadProgress: (progressEvent) => { ... }
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Upload failed: ${res.status}`);
    }

    const fileData: CloudinaryUploadResponse = await res.json();

    console.log("✅ Image uploaded:", {
      url: fileData.secure_url,
      public_id: fileData.public_id,
      format: fileData.format
    });

    return {
      success: true,
      url: fileData.secure_url,
      file
    };

  } catch (error: any) {
    console.error("❌ Cloudinary upload error:", {
      fileName: file.name,
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message || 'Failed to upload image',
      file
    };
  }
};

// ✅ Helper: Upload multiple files with concurrency limit
export const uploadMultipleToCloudinary = async (
  files: File[],
  onFileProgress?: (fileName: string, progress: number) => void
): Promise<{ successful: string[]; failed: { fileName: string; error: string }[] }> => {

  const results = await Promise.allSettled(
    files.map(file =>
      // ✅ FIX: Wrap callback to match uploadToCloudinary signature
      uploadToCloudinary(file, (progress) => {
        // Forward progress with fileName to the outer callback
        if (onFileProgress) {
          onFileProgress(file.name, progress);
        }
      })
    )
  );

  const successful: string[] = [];
  const failed: { fileName: string; error: string }[] = [];

  results.forEach((result, index) => {
    const fileName = files[index]?.name || `File ${index + 1}`;

    if (result.status === 'fulfilled' && result.value.success && result.value.url) {
      successful.push(result.value.url);
    } else {
      const error = result.status === 'rejected'
        ? result.reason?.message || 'Unknown error'
        : result.value?.error || 'Upload failed';
      failed.push({ fileName, error });
    }
  });

  return { successful, failed };
};
