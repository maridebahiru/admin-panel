import React, { useState, useEffect } from 'react';
import { Calendar, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { Youtube } from './icons';
import api from '../utils/api';

const YoutubeHero = ({ welcomeText, logoUrl }) => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);
  const [playlist, setPlaylist] = useState([]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/youtube/latest');
      setVideoData(res.data);
      if (res.data && res.data.videos && res.data.videos.length > 0) {
        setPlaylist(res.data.videos);
        setActiveVideo(res.data.videos[0]);
      } else if (res.data && !res.data.fallback) {
        const single = {
          videoId: res.data.videoId,
          title: res.data.title,
          url: `https://www.youtube.com/watch?v=${res.data.videoId}`,
          addedAt: res.data.publishedAt
        };
        setPlaylist([single]);
        setActiveVideo(single);
      }
    } catch (err) {
      console.warn('Silent failure on YouTube hero render:', err);
      setVideoData({ fallback: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideo();
  }, [welcomeText, logoUrl]);

  if (loading) {
    return (
      <div className="w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex items-center justify-center h-64 animate-pulse">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="animate-spin text-navy-800" size={32} />
          <p className="text-sm text-slate-400 font-medium">Checking YouTube connection...</p>
        </div>
      </div>
    );
  }

  // Fallback: If fallback is true, show the welcome text + logo banner
  if (!videoData || videoData.fallback || !activeVideo) {
    return (
      <div className="relative overflow-hidden w-full bg-gradient-to-r from-navy-800 to-navy-950 text-slate-100 rounded-2xl border border-navy-900 shadow-md p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl transform translate-x-12 -translate-y-12"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-navy-500/20 rounded-full blur-3xl transform -translate-x-12 translate-y-12"></div>
        
        {/* Left Side: Welcome Text */}
        <div className="relative z-10 space-y-3 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 bg-navy-900 border border-navy-700/50 rounded-full px-4 py-1.5 text-xs text-gold-400 font-semibold shadow-sm">
            <span>✨ Welcome Administrator</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight font-ethiopic">
            {welcomeText || 'Welcome to Hyme Managmenr'}
          </h1>
          <p className="text-slate-300 max-w-xl text-sm lg:text-base">
            This dashboard grants full control over category arrangements, mezmurs, announcements, and mobile application properties.
          </p>
        </div>

        {/* Right Side: Choir Logo */}
        <div className="relative z-10 flex-shrink-0">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Logo" 
              className="w-28 h-28 lg:w-36 lg:h-36 rounded-full border-4 border-gold-500/30 object-cover shadow-2xl transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-full bg-navy-900 border-4 border-gold-500/20 flex items-center justify-center font-black text-gold-500 text-4xl shadow-2xl transition-transform duration-300 hover:scale-105 font-ethiopic">
              HM
            </div>
          )}
        </div>
      </div>
    );
  }

  const { videoId, title } = activeVideo;
  const videoUrl = activeVideo.url || `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
      
      {/* Left Column: responsive 16:9 Youtube player embed */}
      <div className="lg:col-span-7 bg-black flex items-center justify-center relative">
        <div className="w-full aspect-video">
          <iframe 
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Choir Featured Video"
            allowFullScreen
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>

      {/* Right Column: Video information */}
      <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between space-y-4 bg-gradient-to-b from-white to-slate-50">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-red-100">
            <Youtube size={14} className="fill-red-700 text-red-700" />
            <span>{playlist.length > 1 ? 'Featured Playlist' : 'Featured Video'}</span>
          </div>

          <h2 className="text-xl font-bold text-slate-800 leading-snug line-clamp-2 hover:text-navy-800 transition-colors font-ethiopic" title={title}>
            {title}
          </h2>

          {/* Playlist Queue Section */}
          {playlist.length > 1 && (
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 border-t border-slate-100 pt-3 custom-scrollbar">
              {playlist.map((video, idx) => {
                const isActive = video.videoId === activeVideo.videoId;
                return (
                  <button
                    key={video.videoId}
                    type="button"
                    onClick={() => setActiveVideo(video)}
                    className={`w-full flex items-center space-x-3 p-2 rounded-xl text-left border transition-all ${
                      isActive 
                        ? 'bg-navy-50 border-navy-200 text-navy-800 shadow-sm' 
                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="relative w-16 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-black">
                      <img 
                        src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      {isActive && (
                        <div className="absolute inset-0 bg-navy-950/40 flex items-center justify-center">
                          <span className="w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white text-[10px] shadow">▶</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold font-ethiopic line-clamp-1 ${isActive ? 'text-navy-900' : 'text-slate-800'}`}>
                        {video.title}
                      </p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Video {idx + 1}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-2">
          <a 
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-2.5 bg-navy-800 text-white rounded-xl font-semibold text-sm hover:bg-navy-950 transition-colors shadow-sm hover:shadow-md focus:outline-none"
          >
            <span>Watch on YouTube</span>
            <ExternalLink size={14} className="ml-2" />
          </a>
        </div>
      </div>

    </div>
  );
};

export default YoutubeHero;
