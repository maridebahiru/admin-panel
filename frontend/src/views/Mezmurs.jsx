import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Music, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Calendar, 
  Languages, 
  X,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Mezmurs = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Data State
  const [mezmurs, setMezmurs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Form View State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState('Amharic');
  const [mezmurNumber, setMezmurNumber] = useState('');
  const [author, setAuthor] = useState('');
  const [tune, setTune] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState('');
  const [deleteExistingAudio, setDeleteExistingAudio] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [mezmursRes, categoriesRes] = await Promise.all([
        api.get('/mezmurs'),
        api.get('/categories')
      ]);
      setMezmurs(mezmursRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load hymns/categories data.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateView = () => {
    setIsEditing(false);
    setCurrentId(null);
    setTitle('');
    setCategoryId(categories[0]?.id || '');
    setLanguage('Amharic');
    setMezmurNumber('');
    setAuthor('');
    setTune('');
    setLyrics('');
    setAudioFile(null);
    setCurrentAudioUrl('');
    setDeleteExistingAudio(false);
    setShowForm(true);
  };

  const openEditView = (mez) => {
    setIsEditing(true);
    setCurrentId(mez.id);
    setTitle(mez.title);
    setCategoryId(mez.category_id || '');
    setLanguage(mez.language);
    setMezmurNumber(mez.mezmur_number || '');
    setAuthor(mez.author || '');
    setTune(mez.tune || '');
    setLyrics(mez.lyrics);
    setAudioFile(null);
    setCurrentAudioUrl(mez.audio_url || '');
    setDeleteExistingAudio(false);
    setShowForm(true);
  };

  const closeFormView = () => {
    setShowForm(false);
    setAudioFile(null);
    setCurrentAudioUrl('');
    setDeleteExistingAudio(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Watch for ?new=true query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true' && categories.length > 0) {
      openCreateView();
      navigate('/mezmurs', { replace: true });
    }
  }, [location.search, categories, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !categoryId || !language || !lyrics.trim()) {
      return toast.error('Please fill in all required fields.');
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('category_id', categoryId);
    formData.append('language', language);
    formData.append('mezmur_number', mezmurNumber);
    formData.append('author', author);
    formData.append('tune', tune);
    formData.append('lyrics', lyrics.trim());

    if (audioFile) {
      formData.append('audio', audioFile);
    } else if (isEditing) {
      formData.append('audio_url', deleteExistingAudio ? 'null' : (currentAudioUrl || ''));
    }

    try {
      setSaving(true);
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      if (isEditing) {
        await api.put(`/mezmurs/${currentId}`, formData, config);
        toast.success('Hymn updated successfully!');
      } else {
        await api.post('/mezmurs', formData, config);
        toast.success('Hymn created successfully!');
      }
      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save Mezmur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this Mezmur hymn?')) {
      try {
        await api.delete(`/mezmurs/${id}`);
        toast.success('Mezmur deleted successfully.');
        fetchData();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete Mezmur.');
      }
    }
  };

  // Filter logic
  const filteredMezmurs = mezmurs.filter(mez => {
    const matchesSearch = mez.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (mez.author && mez.author.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory ? mez.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMezmurs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMezmurs = filteredMezmurs.slice(indexOfFirstItem, indexOfLastItem);

  // Get active category name for preview
  const activeCategoryName = categories.find(c => c.id === categoryId)?.name || 'Category';

  return (
    <div className="space-y-6">
      
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            <Music className="mr-3 text-navy-800" size={28} />
            Mezmurs (Hymns)
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage lyrics, languages, tune names, and authors.
          </p>
        </div>

        {!showForm && (
          <button
            onClick={openCreateView}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-navy-800 hover:bg-navy-950 text-white rounded-xl font-bold text-sm transition shadow-md focus:outline-none"
          >
            <Plus size={16} className="mr-2" />
            Add Mezmur
          </button>
        )}
      </div>

      {/* Split view edit/create form */}
      {showForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left panel: Input Forms */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-base font-bold text-slate-800">
                {isEditing ? 'Modify Mezmur Lyrics' : 'Create New Mezmur Lyrics'}
              </h2>
              <button 
                onClick={closeFormView}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Hymn Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter title (Amharic/English)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 font-ethiopic"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>


              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Audio Track (Optional)
                </label>
                
                {currentAudioUrl && !deleteExistingAudio ? (
                  <div className="flex items-center justify-between p-3 bg-navy-50/50 border border-navy-100 rounded-xl">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2 bg-navy-100 text-navy-800 rounded-lg shrink-0">
                        <Music size={18} />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-700 truncate">Current Audio File</p>
                        <a 
                          href={currentAudioUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs text-navy-600 hover:text-navy-800 hover:underline truncate block font-medium"
                        >
                          {currentAudioUrl.split('/').pop()}
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteExistingAudio(true)}
                      className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-navy-500 rounded-xl p-4 bg-slate-50/50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setAudioFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {audioFile ? (
                      <div className="flex flex-col items-center">
                        <div className="p-2 bg-emerald-100 text-emerald-800 rounded-full mb-1">
                          <Music size={18} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 max-w-[250px] truncate">{audioFile.name}</span>
                        <span className="text-[10px] text-slate-400">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAudioFile(null);
                          }}
                          className="mt-1.5 text-[10px] font-bold text-red-500 hover:text-red-700 focus:outline-none"
                        >
                          Clear Selection
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div className="p-1.5 bg-slate-200/60 text-slate-500 rounded-full mb-1">
                          <Plus size={16} />
                        </div>
                        <span className="text-xs font-bold text-slate-600">Select Audio File</span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Click or drag audio track here (Max 50MB)</span>
                      </div>
                    )}
                  </div>
                )}
              </div>


              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Plain Text Lyrics <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={12}
                  placeholder="Write or paste hymn lyrics here. Line breaks are preserved exactly as typed."
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 font-ethiopic resize-y min-h-[200px]"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={closeFormView}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold text-sm transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-navy-800 hover:bg-navy-950 text-white rounded-xl font-bold text-sm transition shadow-md disabled:opacity-50 flex items-center space-x-1.5 focus:outline-none"
                >
                  {saving && <RefreshCw size={14} className="animate-spin" />}
                  <span>{isEditing ? 'Save Changes' : 'Publish Hymn'}</span>
                </button>
              </div>

            </form>
          </div>

          {/* Right panel: Live Lyrics Preview inside a mock app window */}
          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center">
                <Eye size={16} className="mr-1.5 text-gold-500" />
                Live Mobile Preview
              </h3>
              <span className="text-xs text-slate-400 font-semibold">Real-time Rendering</span>
            </div>

            {/* Mock Smartphone Frame */}
            <div className="relative mx-auto w-full max-w-[320px] aspect-[9/18.5] bg-slate-900 rounded-[36px] p-3 shadow-2xl border-4 border-slate-800 ring-8 ring-slate-950/20 ring-offset-2 overflow-hidden flex flex-col">
              
              {/* Phone Speaker & Camera Cutout */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-between px-3">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
                <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800" />
              </div>

              {/* App Screen Container */}
              <div className="w-full h-full bg-navy-950 rounded-[28px] overflow-hidden flex flex-col relative pt-6 text-slate-100 select-none">
                
                {/* App Header Mockup */}
                <div className="px-4 py-3 border-b border-navy-900 bg-navy-900 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gold-500 font-ethiopic tracking-wide">
                    {activeCategoryName}
                  </span>
                  <Bookmark size={12} className="text-gold-500 fill-gold-500" />
                </div>

                {/* Lyrics Display Panel */}
                <div className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar space-y-4">
                  {/* Title & Metadata */}
                  <div className="space-y-1.5 border-b border-navy-900 pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-extrabold text-white leading-tight font-ethiopic">
                        {title || 'Hymn Title'}
                      </h4>
                      {mezmurNumber && (
                        <span className="text-[9px] font-bold bg-gold-500/10 border border-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded">
                          № {mezmurNumber}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 text-[9px] font-semibold text-slate-400">
                      {author && (
                        <span>By: <span className="text-slate-300 font-ethiopic">{author}</span></span>
                      )}
                      {tune && (
                        <span>Tune: <span className="text-slate-300 font-ethiopic">{tune}</span></span>
                      )}
                      <span className="bg-navy-900 px-1.5 py-0.5 rounded text-[8px] text-slate-400">
                        {language}
                      </span>
                    </div>
                  </div>

                  {/* Audio Player Mockup */}
                  {(audioFile || (currentAudioUrl && !deleteExistingAudio)) && (
                    <div className="bg-navy-900 border border-navy-800 rounded-2xl p-2.5 flex items-center space-x-2.5 shadow-md">
                      <button 
                        type="button" 
                        className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-navy-950 shrink-0 shadow"
                      >
                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-slate-200 truncate">
                          {audioFile ? audioFile.name : currentAudioUrl.split('/').pop()}
                        </p>
                        {/* Fake Progress Bar */}
                        <div className="mt-1 flex items-center space-x-1">
                          <span className="text-[7px] text-slate-400">0:00</span>
                          <div className="flex-1 h-0.5 bg-navy-800 rounded-full overflow-hidden">
                            <div className="w-1/4 h-full bg-gold-500 rounded-full animate-pulse" />
                          </div>
                          <span className="text-[7px] text-slate-400">3:12</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lyrics Body */}
                  <div className="text-center font-ethiopic text-sm text-slate-200 leading-relaxed py-2 whitespace-pre-wrap font-medium">
                    {lyrics || (
                      <span className="text-slate-600 italic text-xs">
                        Start typing lyrics in the text editor to see them previewed here dynamically...
                      </span>
                    )}
                  </div>
                </div>

                {/* Mock Bottom App Bar */}
                <div className="h-10 bg-navy-900 border-t border-navy-950/60 flex items-center justify-around text-slate-500 px-4">
                  <div className="w-5 h-1 bg-slate-700 rounded-full" />
                </div>

              </div>

            </div>
          </div>

        </div>
      ) : (
        /* Standard List view of all mezmurs */
        <div className="space-y-4">
          
          {/* Filters and Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search hymn title or author..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); // reset to first page on search
                }}
                className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl pl-9 pr-4 py-2 text-sm font-medium text-slate-800"
              />
            </div>

            {/* Category Dropdown Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center whitespace-nowrap">
                <Filter size={14} className="mr-1" />
                Filter Category:
              </span>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1); // reset to first page on filter
                }}
                className="bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Table container */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            
            {loading ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-300 border-t-navy-800 rounded-full mb-3" />
                <p>Loading hymns...</p>
              </div>
            ) : filteredMezmurs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">
                <Music size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-base text-slate-600 font-bold">No matching hymns found</p>
                <p className="text-xs text-slate-400 mt-1">Refine your search parameters or add a new hymn above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Language</th>
                      <th className="px-6 py-4">Last Edited</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {currentMezmurs.map((mez) => (
                      <tr key={mez.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-base font-ethiopic">{mez.title}</span>
                              {mez.audio_url && (
                                <span 
                                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-navy-50 text-navy-800 border border-navy-100/60"
                                  title="Includes audio track"
                                >
                                  <Music size={9} className="mr-0.5" />
                                  Audio
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {mez.mezmur_number ? `Hymn № ${mez.mezmur_number}` : ''} 
                              {mez.author ? ` • By ${mez.author}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-semibold whitespace-nowrap font-ethiopic">
                          {mez.category_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            mez.language === 'Amharic' 
                              ? 'bg-amber-50 text-amber-800 border-amber-200' 
                              : mez.language === 'English'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            <Languages size={10} className="mr-1" />
                            {mez.language}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          <div className="flex items-center space-x-1.5">
                            <Calendar size={14} className="text-slate-400" />
                            <span>
                              {new Date(mez.last_edited_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditView(mez)}
                              className="p-1.5 text-slate-500 hover:text-navy-800 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Hymn"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(mez.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Hymn"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
                <span className="text-xs font-semibold text-slate-500">
                  Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredMezmurs.length)} of {filteredMezmurs.length}
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-slate-700">{currentPage} / {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};

export default Mezmurs;
