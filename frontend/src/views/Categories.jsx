import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FolderKanban, 
  Plus, 
  Edit, 
  Trash2, 
  Image as ImageIcon, 
  X,
  Upload,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Categories = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // State
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState('');
  const [existingIcon, setExistingIcon] = useState(null);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setName('');
    // Auto-fill order as max order + 1
    const maxOrder = categories.reduce((max, cat) => cat.display_order > max ? cat.display_order : max, -1);
    setDisplayOrder((maxOrder + 1).toString());
    setIconFile(null);
    setIconPreview('');
    setExistingIcon(null);
    setShowFormModal(true);
  };

  const openEditModal = (cat) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setName(cat.name);
    setDisplayOrder(cat.display_order.toString());
    setIconFile(null);
    setIconPreview('');
    setExistingIcon(cat.icon_url);
    setShowFormModal(true);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Watch for ?new=true query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('new') === 'true') {
      openCreateModal();
      navigate('/categories', { replace: true });
    }
  }, [location.search, navigate]);

  const handleIconChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Icon file size must be less than 2MB.');
        return;
      }
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error('Please enter a category name.');
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('display_order', displayOrder);
    
    if (iconFile) {
      formData.append('icon', iconFile);
    } else if (existingIcon) {
      formData.append('existing_icon', existingIcon);
    }

    try {
      setSaving(true);
      if (isEditing) {
        await api.put(`/categories/${currentId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Category updated successfully!');
      } else {
        await api.post('/categories', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Category created successfully!');
      }
      setShowFormModal(false);
      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmMessage = "⚠️ WARNING:\nThis will also remove all mezmurs in this category.\n\nAre you sure you want to delete this category?";
    if (window.confirm(confirmMessage)) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success('Category and related mezmurs deleted.');
        fetchCategories();
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete category.');
      }
    }
  };

  // Reordering action (Move Category Up / Down)
  const handleMove = async (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= categories.length) return;

    const itemA = categories[index];
    const itemB = categories[nextIndex];

    try {
      // Swap display orders
      const tempOrder = itemA.display_order;
      
      const formDataA = new FormData();
      formDataA.append('name', itemA.name);
      formDataA.append('display_order', itemB.display_order);
      if (itemA.icon_url) formDataA.append('existing_icon', itemA.icon_url);

      const formDataB = new FormData();
      formDataB.append('name', itemB.name);
      formDataB.append('display_order', tempOrder);
      if (itemB.icon_url) formDataB.append('existing_icon', itemB.icon_url);

      // Perform updates
      await Promise.all([
        api.put(`/categories/${itemA.id}`, formDataA, { headers: { 'Content-Type': 'multipart/form-data' } }),
        api.put(`/categories/${itemB.id}`, formDataB, { headers: { 'Content-Type': 'multipart/form-data' } })
      ]);

      fetchCategories();
    } catch (err) {
      console.error(err);
      toast.error('Failed to swap display orders');
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(categories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCategories = categories.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
            <FolderKanban className="mr-3 text-navy-800" size={28} />
            Categories
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage choir categories and display ordering.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-navy-800 hover:bg-navy-950 text-white rounded-xl font-bold text-sm transition shadow-md focus:outline-none"
        >
          <Plus size={16} className="mr-2" />
          Create Category
        </button>
      </div>

      {/* Main content grid */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-300 border-t-navy-800 rounded-full mb-3" />
            <p>Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            <FolderKanban size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-base text-slate-600 font-bold">No categories exist yet</p>
            <p className="text-xs text-slate-400 mt-1">Create your first category grouping above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4 w-20">Icon</th>
                  <th className="px-6 py-4">Category Name</th>
                  <th className="px-6 py-4">Mezmurs Count</th>
                  <th className="px-6 py-4">Display Order</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {currentCategories.map((cat, idx) => {
                  const absoluteIndex = indexOfFirstItem + idx;
                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        {cat.icon_url ? (
                          <img 
                            src={cat.icon_url} 
                            alt={cat.name} 
                            className="w-10 h-10 object-cover rounded-xl border border-slate-200 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-200">
                            <ImageIcon size={18} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 text-base font-ethiopic">{cat.name}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-bold whitespace-nowrap">
                        <span className="bg-navy-50 text-navy-800 px-3 py-1 rounded-full text-xs border border-navy-100">
                          {cat.mezmurCount || 0} hymns
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200">
                            {cat.display_order}
                          </span>
                          
                          {/* Ordering Switcher */}
                          <div className="flex flex-col">
                            <button
                              disabled={absoluteIndex === 0}
                              onClick={() => handleMove(absoluteIndex, -1)}
                              className="text-slate-400 hover:text-navy-800 disabled:opacity-30 disabled:hover:text-slate-400"
                              title="Move Up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              disabled={absoluteIndex === categories.length - 1}
                              onClick={() => handleMove(absoluteIndex, 1)}
                              className="text-slate-400 hover:text-navy-800 disabled:opacity-30 disabled:hover:text-slate-400"
                              title="Move Down"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 text-slate-500 hover:text-navy-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-500">
              Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, categories.length)} of {categories.length}
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

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-zoom-in">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Modify Category' : 'Create New Category'}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category Name (Amharic or English) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ጾምና ጸሎት / Fasting & Prayer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 font-ethiopic"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Display Order / Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Category Icon File (Max 2MB)
                </label>
                <div className="mt-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100/30 transition-colors">
                  
                  {iconPreview || existingIcon ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      <img 
                        src={iconPreview || existingIcon} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setIconFile(null);
                          setIconPreview('');
                          setExistingIcon(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow focus:outline-none"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center space-y-1.5 py-4 w-full h-full">
                      <Upload size={24} className="text-slate-400" />
                      <span className="text-xs font-semibold text-slate-600">Click to upload icon</span>
                      <span className="text-[10px] text-slate-400 font-medium">PNG or JPG up to 2MB</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleIconChange} 
                      />
                    </label>
                  )}
                  
                </div>
              </div>

              {isEditing && (
                <div className="flex items-start space-x-2 p-3 bg-gold-500/10 border border-gold-500/20 rounded-xl text-xs text-gold-800 leading-relaxed font-semibold">
                  <AlertTriangle size={16} className="flex-shrink-0 text-gold-600" />
                  <span>Modifying this category reflects immediately on all corresponding hymns inside.</span>
                </div>
              )}

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
                  <span>{isEditing ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Categories;
