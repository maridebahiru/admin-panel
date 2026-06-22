import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Megaphone, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Image as ImageIcon, 
  Calendar,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Announcements = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImage, setExistingImage] = useState(null);
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Load announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/announcements');
      setAnnouncements(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setTitle('');
    setBody('');
    setDate(new Date().toISOString().split('T')[0]);
    setImageFile(null);
    setImagePreview('');
    setExistingImage(null);
    setStatus('active');
    setShowFormModal(true);
  };

  const openEditModal = (ann) => {
    setIsEditing(true);
    setCurrentId(ann.id);
    setTitle(ann.title);
    setBody(ann.body);
    setDate(ann.date);
    setImageFile(null);
    setImagePreview('');
    setExistingImage(ann.image_url);
    setStatus(ann.status);
    setShowFormModal(true);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Watch for ?new=true query parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      openCreateModal();
      // Clear query param so it doesn't reopen on refresh
      navigate('/announcements', { replace: true });
    }
  }, [location.search, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !date) {
      return toast.error('Please fill in all required fields.');
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('body', body);
    formData.append('date', date);
    formData.append('status', status);
    
    if (imageFile) {
      formData.append('image', imageFile);
    } else if (existingImage) {
      formData.append('existing_image', existingImage);
    }

    try {
      setSaving(true);
      if (isEditing) {
        await api.put(`/announcements/${currentId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Announcement updated successfully!');
      } else {
        await api.post('/announcements', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Announcement posted successfully!');
      }
      setShowFormModal(false);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save announcement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement? This action cannot be undone.')) {
      try {
        await api.delete(`/announcements/${id}`);
        toast.success('Announcement deleted successfully!');
        fetchAnnouncements();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete announcement.');
      }
    }
  };

  const handleToggleStatus = async (ann) => {
    const nextStatus = ann.status === 'active' ? 'inactive' : 'active';
    try {
      // Create a copy of announcement and toggle
      const formData = new FormData();
      formData.append('title', ann.title);
      formData.append('body', ann.body);
      formData.append('date', ann.date);
      formData.append('status', nextStatus);
      if (ann.image_url) {
        formData.append('existing_image', ann.image_url);
      }

      await api.put(`/announcements/${ann.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(`Announcement marked as ${nextStatus}`);
      fetchAnnouncements();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(announcements.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAnnouncements = announcements.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            <Megaphone className="mr-3 text-navy-800" size={28} />
            Announcements
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Broadcast information to the church choir mobile application.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-navy-800 hover:bg-navy-950 text-white rounded-xl font-bold text-sm transition shadow-md focus:outline-none"
        >
          <Plus size={16} className="mr-2" />
          Post Announcement
        </button>
      </div>

      {/* Main content grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-300 border-t-navy-800 rounded-full mb-3" />
            <p>Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            <Megaphone size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-base text-slate-600 font-bold">No announcements posted yet</p>
            <p className="text-xs text-slate-400 mt-1">Post your first choir broadcast announcement above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Banner</th>
                  <th className="px-6 py-4">Announcement Details</th>
                  <th className="px-6 py-4">Publish Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentAnnouncements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      {ann.image_url ? (
                        <img 
                          src={ann.image_url} 
                          alt="Banner" 
                          className="w-16 h-10 object-cover rounded-lg border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200">
                          <ImageIcon size={16} />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <p className="font-bold text-slate-800 text-base">{ann.title}</p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.body}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{new Date(ann.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleStatus(ann)}
                        className={`inline-flex items-center space-x-1.5 focus:outline-none`}
                        title="Click to toggle status"
                      >
                        {ann.status === 'active' ? (
                          <>
                            <ToggleRight size={22} className="text-gold-500" />
                            <span className="text-xs font-bold text-slate-700">Active</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft size={22} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-400">Inactive</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(ann)}
                          className="p-1.5 text-slate-500 hover:text-navy-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit announcement"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete announcement"
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
              Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, announcements.length)} of {announcements.length}
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

      {/* Creation/Editing Modal Dialog */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-zoom-in max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Modify Announcement' : 'Post New Announcement'}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Announcement Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter a descriptive title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Announcement Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write announcement details here..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Broadcast Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                      <Clock size={16} />
                    </span>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* File Upload Slot */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Optional Broadcast Image (Max 2MB)
                </label>
                <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100/30 transition-colors">
                  
                  {imagePreview || existingImage ? (
                    <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <img 
                        src={imagePreview || existingImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setExistingImage(null);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow focus:outline-none"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center space-y-1.5 py-4 w-full h-full">
                      <Upload size={24} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Click to upload photo</span>
                      <span className="text-[10px] text-slate-400">PNG, JPG or GIF up to 2MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageChange} 
                      />
                    </label>
                  )}
                  
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
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
                  <span>{isEditing ? 'Save Changes' : 'Post Announcement'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Announcements;
