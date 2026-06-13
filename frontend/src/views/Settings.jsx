import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Upload, 
  Share2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Save, 
  HelpCircle,
  Eye
} from 'lucide-react';
import { Youtube } from '../components/icons';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Settings = ({ settings, refreshSettings }) => {
  // Local states for inputs
  const [welcomeText, setWelcomeText] = useState('');
  const [choirName, setChoirName] = useState('');
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
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
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null); // { success: boolean, title?: string, error?: string }

  // Sync settings parameters when prop loads
  useEffect(() => {
    if (settings) {
      setWelcomeText(settings.welcome_text || '');
      setChoirName(settings.choir_name || '');
      setYoutubeChannelId(settings.youtube_channel_id || '');
      setYoutubeApiKey(settings.youtube_api_key || '');
      setFacebookUrl(settings.facebook_url || '');
      setTelegramUrl(settings.telegram_url || '');
      setYoutubeUrl(settings.youtube_url || '');
      setInstagramUrl(settings.instagram_url || '');
      setTiktokUrl(settings.tiktok_url || '');
      setLogoPreview(settings.logo_url || '');
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
    e.preventDefault();
    if (!choirName.trim()) {
      return toast.error('Choir / Church Name is required.');
    }

    const payload = {
      welcome_text: welcomeText,
      choir_name: choirName,
      youtube_channel_id: youtubeChannelId,
      youtube_api_key: youtubeApiKey,
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

  const handleTestYoutube = async () => {
    if (!youtubeChannelId || !youtubeApiKey) {
      return toast.error('Please input Channel ID and API Key first to test.');
    }

    try {
      setTestingConnection(true);
      setTestResult(null);
      const res = await api.get('/youtube/test', {
        params: {
          channelId: youtubeChannelId,
          apiKey: youtubeApiKey
        }
      });
      setTestResult({
        success: true,
        title: res.data.title
      });
      toast.success('YouTube Connection Test Succeeded!');
    } catch (err) {
      console.error(err);
      setTestResult({
        success: false,
        error: err.response?.data?.error || 'Failed to authenticate connection.'
      });
      toast.error('YouTube Connection Test Failed.');
    } finally {
      setTestingConnection(false);
    }
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
                  placeholder="e.g. Zion Choir"
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
                  placeholder="e.g. Welcome to Zion Choir"
                  value={welcomeText}
                  onChange={(e) => setWelcomeText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 font-ethiopic"
                />
              </div>
            </div>
          </div>

          {/* Section 2: YouTube Integration */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="text-base font-bold text-navy-800 border-b border-slate-100 pb-3 flex items-center">
              <Youtube size={18} className="text-red-600 mr-2" />
              YouTube API Integration
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  YouTube Channel ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UCxxxxxxxxxxxxxx"
                  value={youtubeChannelId}
                  onChange={(e) => setYoutubeChannelId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  YouTube API Key (Stored securely on backend)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••••••••"
                  value={youtubeApiKey}
                  onChange={(e) => setYoutubeApiKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800"
                />
              </div>

              {/* YouTube Testing block */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200/60">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">Verify Credentials</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-sm">
                    Test connection queries YouTube APIs directly and reports the latest uploaded video.
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={handleTestYoutube}
                  disabled={testingConnection}
                  className="inline-flex items-center justify-center px-4 py-2 bg-navy-900 hover:bg-navy-950 text-white rounded-xl text-xs font-bold transition shadow-md disabled:opacity-50"
                >
                  {testingConnection && <RefreshCw size={12} className="animate-spin mr-1.5" />}
                  Test Connection
                </button>
              </div>

              {/* Test Result Card */}
              {testResult && (
                <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                  testResult.success 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <div className="flex items-start space-x-2">
                    {testResult.success ? (
                      <CheckCircle size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-bold">{testResult.success ? 'Success!' : 'Connection Failed'}</p>
                      {testResult.success ? (
                        <p className="mt-1 font-medium">
                          Connected successfully. Latest Video Title: <span className="font-semibold underline">"{testResult.title}"</span>
                        </p>
                      ) : (
                        <p className="mt-1 font-semibold">{testResult.error}</p>
                      )}
                    </div>
                  </div>
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
                  placeholder="https://facebook.com/zionchoir"
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
                  placeholder="https://t.me/zionchoir"
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
                  placeholder="https://youtube.com/c/zionchoir"
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
                  placeholder="https://instagram.com/zionchoir"
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
                  placeholder="https://tiktok.com/@zionchoir"
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
