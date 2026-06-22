import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Upload, 
  Share2, 
  RefreshCw, 
  CheckCircle, 
  Save, 
  Eye
} from 'lucide-react';
import { Youtube } from '../components/icons';
import api from '../utils/api';
import toast from 'react-hot-toast';

const extractVideoId = (url) => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/live\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const Settings = ({ settings, refreshSettings }) => {
  // Local states for inputs
  const [welcomeText, setWelcomeText] = useState('');
  const [choirName, setChoirName] = useState('');
  const [featuredVideoUrl, setFeaturedVideoUrl] = useState('');
  const [featuredVideoTitle, setFeaturedVideoTitle] = useState('');
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [facebookUrl, setFacebookUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');

  // Logo upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);

  // States
  const [saving, setSaving] = useState(false);
  const [previewVideoId, setPreviewVideoId] = useState('');

  // Sync settings parameters when prop loads
  useEffect(() => {
    if (settings) {
      setWelcomeText(settings.welcome_text || '');
      setChoirName(settings.choir_name || '');
      setFeaturedVideoUrl('');
      setFeaturedVideoTitle('');
      setFacebookUrl(settings.facebook_url || '');
      setTelegramUrl(settings.telegram_url || '');
      setYoutubeUrl(settings.youtube_url || '');
      setInstagramUrl(settings.instagram_url || '');
      setTiktokUrl(settings.tiktok_url || '');
      setLogoPreview(settings.logo_url || '');

      // Parse featured videos
      let list = [];
      if (settings.featured_videos) {
        try {
          list = typeof settings.featured_videos === 'string' 
            ? JSON.parse(settings.featured_videos) 
            : settings.featured_videos;
        } catch (e) {
          console.warn('Error parsing settings.featured_videos:', e);
        }
      }

      // Backward compatibility: if list is empty but single video exists
      if ((!list || list.length === 0) && settings.featured_video_url) {
        const id = extractVideoId(settings.featured_video_url);
        if (id) {
          list = [{
            videoId: id,
            url: settings.featured_video_url,
            title: settings.featured_video_title || 'Featured Video',
            addedAt: settings.updated_at || new Date().toISOString()
          }];
        }
      }

      setFeaturedVideos(list || []);
    }
  }, [settings]);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        return toast.error('Logo file must be less than 2MB.');
      }
      if (!file.type.includes('png')) {
        return toast.warn('PNG is recommended for splash screen branding.');
      }

      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));

      // Auto-upload logo immediately
      const formData = new FormData();
      formData.append('logo', file);
      try {
        setLogoUploading(true);
        await api.post('/settings/logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Branding logo uploaded successfully!');
        refreshSettings(); // refresh parent states
      } catch (err) {
        console.error(err);
        toast.error('Failed to upload logo.');
      } finally {
        setLogoUploading(false);
      }
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    if (!choirName.trim()) {
      return toast.error('Choir / Church Name is required.');
    }

    // Auto-add currently typed video if present but not added yet
    let finalVideos = [...featuredVideos];
    if (featuredVideoUrl.trim()) {
      const id = extractVideoId(featuredVideoUrl);
      if (id) {
        const alreadyExists = finalVideos.some(v => v.videoId === id);
        if (!alreadyExists) {
          finalVideos.push({
            videoId: id,
            url: featuredVideoUrl.trim(),
            title: featuredVideoTitle.trim() || 'Featured Video',
            addedAt: new Date().toISOString()
          });
        }
      }
    }

    const payload = {
      welcome_text: welcomeText,
      choir_name: choirName,
      // Preserve old settings if present
      youtube_channel_id: settings?.youtube_channel_id || '',
      youtube_api_key: settings?.youtube_api_key || '',
      featured_video_url: finalVideos[0]?.url || '',
      featured_video_title: finalVideos[0]?.title || '',
      featured_videos: JSON.stringify(finalVideos),
      facebook_url: facebookUrl,
      telegram_url: telegramUrl,
      youtube_url: youtubeUrl,
      instagram_url: instagramUrl,
      tiktok_url: tiktokUrl
    };

    try {
      setSaving(true);
      await api.put('/settings', payload);
      toast.success('App settings updated successfully!');
      refreshSettings(); // sync UI elements
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewVideo = () => {
    if (!featuredVideoUrl.trim()) {
      setPreviewVideoId('');
      return toast.error('Please enter a YouTube video URL first.');
    }
    const id = extractVideoId(featuredVideoUrl);
    if (id) {
      setPreviewVideoId(id);
      toast.success('Preview loaded successfully!');
    } else {
      setPreviewVideoId('');
      toast.error('Invalid YouTube URL format.');
    }
  };

  const saveFeaturedVideosList = async (updatedList) => {
    const payload = {
      welcome_text: welcomeText,
      choir_name: choirName,
      youtube_channel_id: settings?.youtube_channel_id || '',
      youtube_api_key: settings?.youtube_api_key || '',
      featured_video_url: updatedList[0]?.url || '',
      featured_video_title: updatedList[0]?.title || '',
      featured_videos: JSON.stringify(updatedList),
      facebook_url: facebookUrl,
      telegram_url: telegramUrl,
      youtube_url: youtubeUrl,
      instagram_url: instagramUrl,
      tiktok_url: tiktokUrl
    };

    try {
      setSaving(true);
      await api.put('/settings', payload);
      refreshSettings();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to auto-save video playlist changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAddVideo = () => {
    if (!featuredVideoUrl.trim()) {
      return toast.error('Please enter a YouTube video URL first.');
    }
    const id = extractVideoId(featuredVideoUrl);
    if (!id) {
      return toast.error('Invalid YouTube URL format.');
    }
    if (featuredVideos.some(v => v.videoId === id)) {
      return toast.error('This video is already in the playlist.');
    }

    const newVideo = {
      videoId: id,
      url: featuredVideoUrl.trim(),
      title: featuredVideoTitle.trim() || 'Featured Video',
      addedAt: new Date().toISOString()
    };

    const updated = [...featuredVideos, newVideo];
    setFeaturedVideos(updated);
    setFeaturedVideoUrl('');
    setFeaturedVideoTitle('');
    setPreviewVideoId('');
    saveFeaturedVideosList(updated);
    toast.success('Video added and settings saved successfully!');
  };

  const handleRemoveVideo = (index) => {
    const updated = featuredVideos.filter((_, idx) => idx !== index);
    setFeaturedVideos(updated);
    saveFeaturedVideosList(updated);
    toast.success('Video removed and settings saved successfully!');
  };

  const handleMoveVideo = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= featuredVideos.length) return;
    const updated = [...featuredVideos];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setFeaturedVideos(updated);
    saveFeaturedVideosList(updated);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
          <SettingsIcon className="mr-3 text-navy-800" size={28} />
          App Settings
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Configure church branding, YouTube integration parameters, and social links.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Settings */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Branding */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-navy-800 border-b border-slate-100 pb-3 flex items-center">
              <CheckCircle size={18} className="text-gold-500 mr-2" />
              Choir & Splash Branding
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Choir / Church Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyme Managmenr"
                  value={choirName}
                  onChange={(e) => setChoirName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 font-ethiopic"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Welcome Subtext
                </label>
                <input
                  type="text"
                  placeholder="e.g. Welcome to Hyme Managmenr"
                  value={welcomeText}
                  onChange={(e) => setWelcomeText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 font-ethiopic"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Featured Videos Playlist */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
            <h2 className="text-base font-bold text-navy-800 border-b border-slate-100 pb-3 flex items-center">
              <Youtube size={18} className="text-red-600 mr-2" />
              🎬 Featured Video Playlist
            </h2>

            {/* Video Input Form */}
            <div className="space-y-4 bg-slate-50/50 p-4 border border-slate-200/60 rounded-2xl">
              <p className="text-xs font-bold text-slate-700">Add Video to Featured Playlist</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    YouTube URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://youtube.com/watch?v=xxxx"
                    value={featuredVideoUrl}
                    onChange={(e) => setFeaturedVideoUrl(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Video Title (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Zion Choir Live Worship 2026"
                    value={featuredVideoTitle}
                    onChange={(e) => setFeaturedVideoTitle(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 font-ethiopic"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handlePreviewVideo}
                  className="inline-flex items-center justify-center px-4 py-2 bg-navy-800 hover:bg-navy-950 text-white rounded-xl text-xs font-bold transition shadow-md focus:outline-none"
                >
                  Preview Video
                </button>
                <button
                  type="button"
                  onClick={handleAddVideo}
                  className="inline-flex items-center justify-center px-4 py-2 bg-gold-500 hover:bg-gold-600 text-navy-955 rounded-xl text-xs font-bold transition shadow-md focus:outline-none"
                >
                  Add to List
                </button>
              </div>

              {/* Preview Section */}
              {previewVideoId && (
                <div className="space-y-2 pt-4 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-700 flex items-center">
                    <span className="text-emerald-600 mr-1.5">✅</span> Preview:
                  </p>
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-black group max-w-md">
                    <img
                      src={`https://img.youtube.com/vi/${previewVideoId}/hqdefault.jpg`}
                      alt="YouTube Thumbnail Preview"
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                      <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6 fill-current ml-0.5" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    {featuredVideoTitle && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3">
                        <p className="text-xs font-bold text-white line-clamp-1 font-ethiopic">{featuredVideoTitle}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Configured Videos Playlist */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Playlist Order ({featuredVideos.length} videos)
              </h3>
              
              {featuredVideos.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400 text-xs font-medium">
                  <p>No featured videos configured.</p>
                  <p className="mt-1 text-[10px] text-slate-400">Add a video using the form above to get started.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  {featuredVideos.map((video, index) => (
                    <div key={video.videoId} className="flex items-center justify-between p-4 hover:bg-slate-50/30 transition-colors group">
                      
                      {/* Left: Thumbnail & Title */}
                      <div className="flex items-center space-x-4">
                        <div className="relative w-20 aspect-video rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 bg-black">
                          <img 
                            src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`} 
                            alt="Thumbnail" 
                            className="w-full h-full object-cover"
                          />
                          {index === 0 && (
                            <span className="absolute top-1 left-1 bg-gold-500 text-navy-950 px-1 py-0.5 rounded text-[8px] font-bold shadow-sm">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 line-clamp-1 font-ethiopic">{video.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono line-clamp-1 truncate mt-0.5">{video.url}</p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center space-x-3">
                        {/* Ordering Actions */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => handleMoveVideo(index, -1)}
                            className="p-1 text-slate-400 hover:text-navy-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                            title="Move Up"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5H7z"/></svg>
                          </button>
                          <button
                            type="button"
                            disabled={index === featuredVideos.length - 1}
                            onClick={() => handleMoveVideo(index, 1)}
                            className="p-1 text-slate-400 hover:text-navy-800 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                            title="Move Down"
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>
                          </button>
                        </div>

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(index)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove video from featured list"
                        >
                          <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Social Links */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-navy-800 border-b border-slate-100 pb-3 flex items-center">
              <Share2 size={18} className="text-blue-500 mr-2" />
              Social Media Connections
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Facebook URL
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/hymemanagmenr"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Telegram Link / Username
                </label>
                <input
                  type="text"
                  placeholder="https://t.me/hymemanagmenr"
                  value={telegramUrl}
                  onChange={(e) => setTelegramUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  YouTube Channel URL
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/c/hymemanagmenr"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Instagram URL
                </label>
                <input
                  type="url"
                  placeholder="https://instagram.com/hymemanagmenr"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  TikTok URL
                </label>
                <input
                  type="url"
                  placeholder="https://tiktok.com/@hymemanagmenr"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center px-6 py-3 bg-navy-800 hover:bg-navy-950 text-white rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg disabled:opacity-50 focus:outline-none"
            >
              <Save size={16} className="mr-2" />
              {saving ? 'Saving Settings...' : 'Save Settings'}
            </button>
          </div>

        </form>

        {/* Right Column: Branding Logo preview */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-navy-800 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center">
              <Eye size={16} className="mr-1.5 text-gold-500" />
              Splash Screen Logo
            </h3>
            
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              This logo will be displayed on the application launch splash screen. A transparent 1:1 PNG is highly recommended (Max 2MB).
            </p>

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/50">
              {logoPreview ? (
                <div className="relative group">
                  <img 
                    src={logoPreview} 
                    alt="Logo Preview" 
                    className="w-32 h-32 rounded-full border-4 border-gold-500/30 object-cover shadow-md"
                  />
                  <div className="absolute inset-0 bg-navy-950/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer text-white text-[10px] font-bold bg-navy-800/80 px-2.5 py-1.5 rounded-lg border border-navy-700/50 hover:bg-navy-900 transition-all">
                      Change Logo
                      <input 
                        type="file" 
                        accept="image/png" 
                        className="hidden" 
                        onChange={handleLogoChange}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center space-y-2 py-6">
                  <Upload size={32} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-600">Upload Logo</span>
                  <span className="text-[9px] text-slate-400 font-semibold">PNG up to 2MB</span>
                  <input 
                    type="file" 
                    accept="image/png" 
                    className="hidden" 
                    onChange={handleLogoChange} 
                  />
                </label>
              )}

              {logoUploading && (
                <div className="mt-3 flex items-center space-x-1.5 text-xs text-navy-800 font-bold">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Uploading logo...</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;
