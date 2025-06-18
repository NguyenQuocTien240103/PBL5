import React, { useEffect, useState } from "react";

const Video = () => {
  const [videos, setVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/videos`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch video list");
        }
        return response.json();
      })
      .then((data: string[]) => {
        setVideos(data);
        if (data.length > 0) {
          setSelectedVideo(data[0]);
        }
      })
      .catch((error) => {
        console.error("Error fetching video list:", error);
      });
  }, []);

  const handleSelectVideo = (videoName: string) => {
    // Reset the video player to the selected video
    setSelectedVideo(videoName);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md p-6 flex gap-6">
        {/* Left - Video List */}
        <div className="w-1/3 border-r pr-4">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">
            🎞️ Danh sách video
          </h2>
          <ul className="space-y-2">
            {videos.map((video) => (
              <li key={video}>
                <button
                  className={`w-full text-left px-4 py-2 rounded-md hover:bg-blue-100 transition 
                  ${
                    selectedVideo === video
                      ? "bg-blue-200 font-semibold"
                      : "bg-gray-50"
                  }`}
                  onClick={() => handleSelectVideo(video)}
                >
                  {video}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Right - Video Player */}
        <div className="w-2/3">
          {selectedVideo ? (
            <>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                🎬 Đang phát: {selectedVideo}
              </h3>
              <video
                key={selectedVideo}
                width="100%"
                height="auto"
                controls
                className="rounded-lg shadow-md"
              >
                <source
                  src={`${
                    import.meta.env.VITE_API_BASE_URL
                  }/get-video/${selectedVideo}`}
                  type="video/mp4"
                />
                Trình duyệt không hỗ trợ phát video.
              </video>
            </>
          ) : (
            <p className="text-gray-500">Chưa có video nào được chọn.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Video;
