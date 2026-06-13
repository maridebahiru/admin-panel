import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Music, 
  Megaphone, 
  Clock, 
  Plus, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import api from '../utils/api';
import StatsCard from '../components/StatsCard';
import YoutubeHero from '../components/YoutubeHero';
import toast from 'react-hot-toast';

const Overview = ({ settings }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    categories: 0,
    mezmurs: 0,
    announcements: 0,
    lastUpdated: null
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [catsRes, mezmursRes, annRes] = await Promise.all([
        api.get('/categories'),
        api.get('/mezmurs'),
        api.get('/announcements')
      ]);

      const categories = catsRes.data;
      const mezmurs = mezmursRes.data;
      const announcements = annRes.data;

      // Find the most recent update timestamp
      let latestTime = null;
      const dates = [];

      categories.forEach(c => c.created_at && dates.push(new Date(c.created_at)));
      mezmurs.forEach(m => {
        if (m.last_edited_date) dates.push(new Date(m.last_edited_date));
        if (m.created_at) dates.push(new Date(m.created_at));
      });
      announcements.forEach(a => {
        if (a.created_at) dates.push(new Date(a.created_at));
        if (a.date) dates.push(new Date(a.date));
      });

      if (dates.length > 0) {
        latestTime = new Date(Math.max(...dates.map(d => d.getTime())));
      }

      setStats({
        categories: categories.length,
        mezmurs: mezmurs.length,
        announcements: announcements.length,
        lastUpdated: latestTime
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      toast.error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Monitor and manage your Church Choir application details.
          </p>
        </div>
        
        <button
          onClick={fetchStats}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <RefreshCw size={16} className={`mr-2 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* YouTube Hero Section */}
      <YoutubeHero 
        welcomeText={settings?.welcome_text} 
        logoUrl={settings?.logo_url} 
      />

      {/* Summary Stats Panel */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Sparkles size={18} className="text-gold-500 mr-2" />
          Application Summary
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            title="Total Categories"
            value={loading ? undefined : stats.categories}
            icon={FolderKanban}
            description="Mezmure playlists/groups"
          />
          <StatsCard 
            title="Total Mezmurs"
            value={loading ? undefined : stats.mezmurs}
            icon={Music}
            description="Hymns and lyrics items"
          />
          <StatsCard 
            title="Announcements"
            value={loading ? undefined : stats.announcements}
            icon={Megaphone}
            description="Broadcast alerts on home screen"
          />
          <StatsCard 
            title="Last Activity"
            value={loading ? '...' : (stats.lastUpdated ? stats.lastUpdated.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'None')}
            icon={Clock}
            description={stats.lastUpdated ? stats.lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : 'No updates registered'}
          />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-base font-bold text-navy-800">
          Quick Administrative Actions
        </h3>
        <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
          Need to add content immediately? Use the quick actions below to jump directly to creation wizards with pre-loaded layout panels.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <button
            onClick={() => navigate('/mezmurs?new=true')}
            className="inline-flex items-center justify-center px-5 py-3 bg-navy-800 hover:bg-navy-950 text-white rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg focus:outline-none"
          >
            <Plus size={16} className="mr-2" />
            Add Mezmur
          </button>
          
          <button
            onClick={() => navigate('/categories?new=true')}
            className="inline-flex items-center justify-center px-5 py-3 bg-gold-500 hover:bg-gold-600 text-navy-950 rounded-xl font-bold text-sm transition shadow-md hover:shadow-lg focus:outline-none"
          >
            <Plus size={16} className="mr-2 text-navy-950" />
            Add Category
          </button>

          <button
            onClick={() => navigate('/announcements?new=true')}
            className="inline-flex items-center justify-center px-5 py-3 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition shadow-sm focus:outline-none"
          >
            <Plus size={16} className="mr-2 text-slate-500" />
            Post Announcement
          </button>
        </div>
      </div>

    </div>
  );
};

export default Overview;
