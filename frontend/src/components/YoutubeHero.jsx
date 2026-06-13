import React, { useState, useEffect } from 'react';
import { Calendar, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { Youtube } from './icons';
import api from '../utils/api';

const YoutubeHero = ({ welcomeText, logoUrl }) => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/youtube/latest');
      setVideoData(res.data);
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
  if (!videoData || videoData.fallback) {
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
            {welcomeText || 'Welcome to Zion Choir'}
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
              ZC
            </div>
          )}
        </div>
      </div>
    );
  }

  const { videoId, title, publishedAt, viewCount } = videoData;
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
      
      {/* Left Column: responsive 16:9 Youtube player embed */}
      <div className="lg:col-span-7 bg-black flex items-center justify-center relative">
        <div className="w-full aspect-video">
          <iframe 
            src={`https://www.youtube.com/embed/${videoId}`}
            title="Latest Choir Video"
            allowFullScreen
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>

      {/* Right Column: Video information */}
      <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between space-y-6 bg-gradient-to-b from-white to-slate-50">
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border border-red-100">
            <Youtube size={14} className="fill-red-700 text-red-700" />
            <span>Latest Upload</span>
          </div>

          <h2 className="text-xl font-bold text-slate-800 leading-snug line-clamp-3 hover:text-navy-800 transition-colors">
            {title}
          </h2>

          <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium pt-2">
            <div className="flex items-center space-x-1">
              <Calendar size={14} className="text-slate-400" />
              <span>{new Date(publishedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Eye size={14} className="text-slate-400" />
              <span>{viewCount.toLocaleString()} views</span>
            </div>
          </div>
        </div>

        <div>
          <a 
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-full sm:w-auto px-5 py-3 bg-navy-800 text-white rounded-xl font-semibold text-sm hover:bg-navy-950 transition-colors shadow-md hover:shadow-lg hover:shadow-navy-900/10 focus:outline-none focus:ring-2 focus:ring-navy-800/40"
          >
            <span>Watch on YouTube</span>
            <ExternalLink size={16} className="ml-2" />
          </a>
        </div>
      </div>

    </div>
  );
};

export default YoutubeHero;
