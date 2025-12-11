"use client";
import React, { useState, useRef, useCallback } from "react";
import { Plus, Sparkles, X, Upload } from "lucide-react";

type ImageItem = {
  id: string;
  url: string;
  file: File;
};

const Moodboard = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setImages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            url,
            file,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDelete = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const handleAddMore = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateWithAI = () => {
    // TODO: Implement AI generation
    console.log("Generate with AI clicked");
  };

  return (
    <div className="relative w-full h-full overflow-auto ">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Content / drop zone */}
      <div className="min-h-[50vh] p-6 flex justify-center">
        <div className="relative w-full max-w-5xl">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative w-full min-h-[45vh] rounded-3xl border ${
              isDragging
                ? "border-purple-500/30 ring-2 ring-purple-500/20"
                : "border-white/5"
            } bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15),transparent_50%),radial-gradient(circle_at_20%_80%,rgba(168,85,247,0.1),transparent_40%)] bg-black shadow-[0_30px_70px_-40px_rgba(0,0,0,0.9)] transition-all duration-300 overflow-hidden`}
          >
            <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-white/3 via-transparent to-transparent" />

            {/* Drag overlay indicator (localized to drop zone) */}
            {isDragging && (
              <div className="pointer-events-none absolute inset-0 z-20 bg-black/40 flex items-center justify-center border-4 border-dashed border-white/30 rounded-3xl">
                <div className="text-center px-4">
                  <Upload className="h-16 w-16 mx-auto mb-4 text-white/60" />
                  <p className="text-xl font-medium text-white/80">
                    Drop images here to upload
                  </p>
                </div>
              </div>
            )}

            <div className="relative p-6">
              {images.length === 0 ? (
                // Empty state
                <div className="flex items-center justify-center min-h-[35vh]">
                  <div className="text-center max-w-md">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-white/20 mb-6">
                      <Upload className="h-12 w-12 text-white/40" />
                    </div>
                    <h3 className="text-xl font-semibold text-white/80 mb-2">
                      No images yet
                    </h3>
                    <p className="text-sm text-white/60 mb-6">
                      Drag and drop images here, or click "Add More" to upload
                    </p>
                  </div>
                </div>
              ) : (
                // Scattered image layout
                <div className="relative min-h-[35vh] flex items-center justify-center">
                  <div className="relative w-full max-w-2xl h-[400px]">
                    {images.map((image, index) => {
                      // Create scattered positioning
                      const positions = [
                        { x: "10%", y: "15%", rotate: -6, scale: 0.95 },
                        { x: "45%", y: "5%", rotate: 3, scale: 1 },
                        { x: "25%", y: "40%", rotate: -3, scale: 0.9 },
                        { x: "55%", y: "45%", rotate: 5, scale: 0.95 },
                        { x: "15%", y: "65%", rotate: -4, scale: 0.92 },
                        { x: "60%", y: "25%", rotate: 2, scale: 0.98 },
                      ];
                      const pos = positions[index % positions.length];

                      return (
                        <div
                          key={image.id}
                          className="group absolute"
                          style={{
                            left: pos.x,
                            top: pos.y,
                            transform: `rotate(${pos.rotate}deg) scale(${pos.scale})`,
                            zIndex: index,
                          }}
                        >
                          <div className="relative w-40 h-[200px] rounded-2xl overflow-hidden bg-[#161616] shadow-[0_25px_60px_-20px_rgba(0,0,0,0.65)] hover:scale-110 hover:rotate-0 hover:z-50 transition-all duration-300 cursor-pointer border border-white/10">
                            <img
                              src={image.url}
                              alt="Moodboard"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
                            {/* Delete button overlay */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(image.id);
                              }}
                              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
                            >
                              <X className="h-4 w-4 text-white" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating action buttons (outside drop zone) */}
          <div className="flex justify-end gap-3 mt-4 pr-1">
            {/* Generate with AI button */}
            <button
              onClick={handleGenerateWithAI}
              className="group flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#1a1a1a]/80 backdrop-blur-xl text-white/90 border border-white/10 hover:border-white/20 hover:bg-[#1f1f1f]/90 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl hover:shadow-purple-500/10"
            >
              <Sparkles className="h-4 w-4 text-purple-400 group-hover:text-purple-300" />
              <span>Generate with AI</span>
            </button>
            {/* Add More button */}
            <button
              onClick={handleAddMore}
              className="group flex items-center gap-2.5 px-5 py-3 rounded-full bg-[#1a1a1a]/80 backdrop-blur-xl text-white/90 border border-white/10 hover:border-white/20 hover:bg-[#1f1f1f]/90 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
              <span>Add More</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Moodboard;
