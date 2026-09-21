import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Trash2, 
  Eye, 
  X, 
  RefreshCw, 
  Upload, 
  Camera, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Compass, 
  Layers, 
  ChevronRight,
  Info,
  Fish,
  FolderPlus,
  Settings
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Mammals',
  'Fish',
  'Reptiles',
  'Corals',
  'Crustaceans',
  'Microorganisms',
  'Plants',
  'Coastal Birds'
];

const CONSERVATION_STATUSES = [
  'Critically Endangered',
  'Endangered',
  'Vulnerable',
  'Near Threatened',
  'Least Concern',
  'Stable'
];

const SENSITIVITY_LEVELS = [
  'Critical',
  'High',
  'Medium',
  'Low'
];

const SpeciesManagement = () => {
  const { user, authFetch } = useAuth();
  
  const [speciesList, setSpeciesList] = useState([]);
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Category Management Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  // Species Form state
  const [formData, setFormData] = useState({
    name: '',
    scientific_name: '',
    category: 'Reptiles',
    status: 'Endangered',
    sensitivity: 'High',
    habitat: '',
    threats: '',
    notes: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Auto-dismiss notifications
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  useEffect(() => {
    if (actionError) {
      const timer = setTimeout(() => setActionError(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [actionError]);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await authFetch('/species/categories');
      if (res.ok) {
        const data = await res.json();
        if (data.categories && data.categories.length > 0) {
          setCategoriesList(data.categories.map(c => c.name));
        }
      }
    } catch (err) {
      console.warn('Error fetching species categories:', err);
    }
  };

  // Fetch species catalog
  const fetchSpecies = async () => {
    setRefreshing(true);
    try {
      const [spRes, catRes] = await Promise.all([
        authFetch('/species'),
        authFetch('/species/categories')
      ]);

      if (spRes.ok) {
        const data = await spRes.json();
        setSpeciesList(data.species || []);
      } else {
        throw new Error('Failed to load species catalog.');
      }

      if (catRes.ok) {
        const cData = await catRes.json();
        if (cData.categories && cData.categories.length > 0) {
          setCategoriesList(cData.categories.map(c => c.name));
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setActionError('Could not load marine species from server.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSpecies();
  }, []);

  // Handle image file change with live preview
  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (file.size > 15 * 1024 * 1024) {
        setActionError('Image size exceeds 15MB limit.');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form reset
  const resetForm = () => {
    setFormData({
      name: '',
      scientific_name: '',
      category: categoriesList[0] || 'Reptiles',
      status: 'Endangered',
      sensitivity: 'High',
      habitat: '',
      threats: '',
      notes: ''
    });
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle Add Category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      return setActionError('Please enter a category name.');
    }

    setCategorySubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const res = await authFetch('/species/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to add category.');
      }

      setActionSuccess(`New category "${newCategoryName.trim()}" added successfully!`);
      const addedName = newCategoryName.trim();
      setNewCategoryName('');
      
      // Refresh categories list
      await fetchCategories();
      
      // Auto-select the newly added category in the form
      setFormData(prev => ({ ...prev, category: addedName }));
    } catch (err) {
      console.error('Error adding category:', err);
      setActionError(err.message || 'Server error adding category.');
    } finally {
      setCategorySubmitting(false);
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (categoryName) => {
    if (!window.confirm(`Are you sure you want to remove category "${categoryName}"?`)) {
      return;
    }

    try {
      // Find category id or delete by querying categories
      const catRes = await authFetch('/species/categories');
      if (catRes.ok) {
        const data = await catRes.json();
        const target = (data.categories || []).find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        if (!target) {
          throw new Error('Category not found.');
        }

        const delRes = await authFetch(`/species/categories/${target.category_id || target.id}`, {
          method: 'DELETE'
        });
        const delJson = await delRes.json();
        if (!delRes.ok) {
          throw new Error(delJson.error || 'Failed to delete category.');
        }

        setActionSuccess(`Category "${categoryName}" removed.`);
        await fetchCategories();
        if (selectedCategory === categoryName) {
          setSelectedCategory('All');
        }
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      setActionError(err.message || 'Error removing category.');
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return setActionError('Species common name is required.');
    }
    if (!formData.scientific_name.trim()) {
      return setActionError('Scientific name is required.');
    }

    setSubmitting(true);
    setActionError('');
    setActionSuccess('');

    try {
      const data = new FormData();
      data.append('name', formData.name.trim());
      data.append('scientific_name', formData.scientific_name.trim());
      data.append('category', formData.category);
      data.append('status', formData.status);
      data.append('sensitivity', formData.sensitivity);
      data.append('habitat', formData.habitat.trim());
      data.append('threats', formData.threats.trim());
      data.append('notes', formData.notes.trim());

      if (imageFile) {
        data.append('image', imageFile);
      }

      const res = await authFetch('/species', {
        method: 'POST',
        body: data
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error || 'Failed to register species.');
      }

      setActionSuccess(`"${formData.name}" added to catalog! Researchers can now view this species in their Species Explorer.`);
      resetForm();
      setShowAddModal(false);
      fetchSpecies();
    } catch (err) {
      console.error('Error adding species:', err);
      setActionError(err.message || 'Server error occurred while adding species.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Species
  const handleDeleteSpecies = async (speciesId, speciesName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to remove "${speciesName}" from the catalog?`)) {
      return;
    }

    try {
      const res = await authFetch(`/species/${speciesId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete species.');
      }
      setActionSuccess(`"${speciesName}" removed from catalog.`);
      fetchSpecies();
    } catch (err) {
      setActionError(err.message || 'Error deleting species.');
    }
  };

  // Helper for resolving image URL
  const resolveImage = (img) => {
    if (!img) return '/images/whale_shark.png';
    if (img.startsWith('http') || img.startsWith('/images/')) return img;
    const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    return `${serverUrl}${img}`;
  };

  // Combined Category Filter Options: 'All' + dynamic categories
  const filterCategories = useMemo(() => {
    return ['All', ...categoriesList];
  }, [categoriesList]);

  // Filtered Species
  const filteredSpecies = useMemo(() => {
    return speciesList.filter(sp => {
      const name = sp.name || '';
      const sciName = sp.scientificName || sp.scientific_name || '';
      const notes = sp.notes || '';
      const threats = sp.threats || '';
      const query = searchQuery.toLowerCase();

      const matchSearch = name.toLowerCase().includes(query) ||
                          sciName.toLowerCase().includes(query) ||
                          notes.toLowerCase().includes(query) ||
                          threats.toLowerCase().includes(query);

      const matchCat = selectedCategory === 'All' || sp.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [speciesList, searchQuery, selectedCategory]);

  // Statistics
  const stats = useMemo(() => {
    const total = speciesList.length;
    const endangered = speciesList.filter(s => s.status === 'Endangered' || s.status === 'Critically Endangered').length;
    const categoriesCount = categoriesList.length;

    return { total, endangered, categoriesCount };
  }, [speciesList, categoriesList]);

  return (
    <div style={{ paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
        paddingBottom: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Compass size={18} />
            <span>Municipal Authority Environmental Registry</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', margin: '4px 0 6px 0', color: '#ffffff', fontWeight: 800 }}>
            Marine Species Catalog & Registry
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '750px' }}>
            Register, curate, and publish marine biodiversity profiles. All species and taxonomy categories added here are immediately synchronized and accessible to marine researchers on their Species Explorer workspace.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={fetchSpecies}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            disabled={refreshing}
            title="Refresh species catalog from database"
          >
            <RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} />
            <span>Sync</span>
          </button>

          <button 
            onClick={() => setShowCategoryModal(true)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(157, 78, 221, 0.4)', color: '#d8b4fe' }}
          >
            <Layers size={16} />
            <span>Manage Categories</span>
          </button>

          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 16px rgba(0, 229, 255, 0.35)' }}
          >
            <Plus size={18} />
            <span>Add New Species</span>
          </button>
        </div>
      </div>

      {/* Alert Notifications */}
      {actionSuccess && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          borderRadius: '10px',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div style={{
          padding: '14px 18px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          borderRadius: '10px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.9rem'
        }}>
          <AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Analytics Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(10, 25, 48, 0.6)' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(0, 229, 255, 0.15)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <Compass size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Catalog Species</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>{stats.total}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(10, 25, 48, 0.6)' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endangered / Critical</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>{stats.endangered}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(10, 25, 48, 0.6)' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(157, 78, 221, 0.15)',
            border: '1px solid rgba(157, 78, 221, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d8b4fe'
          }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taxonomy Classes</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#d8b4fe', marginTop: '2px' }}>{stats.categoriesCount}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(10, 25, 48, 0.6)' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'rgba(0, 245, 212, 0.15)',
            border: '1px solid rgba(0, 245, 212, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Researcher Visible</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>100% Live</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(10, 25, 48, 0.5)', borderRadius: '8px', padding: '8px 14px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search catalog by common name, scientific taxonomy, threats, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '4px 0', fontSize: '0.95rem', width: '100%', color: '#ffffff' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dynamic Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', alignItems: 'center' }}>
          {filterCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                border: selectedCategory === cat ? '1px solid var(--accent-primary)' : '1px solid rgba(0, 229, 255, 0.2)',
                background: selectedCategory === cat ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'rgba(10, 25, 48, 0.6)',
                color: '#ffffff',
                cursor: 'pointer',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              {cat}
            </button>
          ))}

          <button
            onClick={() => setShowCategoryModal(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              border: '1px dashed rgba(157, 78, 221, 0.5)',
              background: 'rgba(157, 78, 221, 0.1)',
              color: '#d8b4fe',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
            title="Add or remove categories"
          >
            <Plus size={14} /> Category
          </button>
        </div>
      </div>

      {/* Species Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <RefreshCw size={36} className="spin-icon" style={{ color: 'var(--accent-primary)', marginBottom: '12px' }} />
          <p>Loading marine species registry...</p>
        </div>
      ) : filteredSpecies.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
          <Fish size={44} style={{ opacity: 0.3, marginBottom: '12px', color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#ffffff', marginBottom: '6px' }}>No Marine Species Found</h3>
          <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 16px auto' }}>
            No species in the catalog match your current search or category filter.
          </p>
          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add First Specimen
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '22px' }}>
          {filteredSpecies.map(sp => {
            const sciName = sp.scientificName || sp.scientific_name;
            const isDanger = sp.status === 'Endangered' || sp.status === 'Critically Endangered';
            
            return (
              <div
                key={sp.id || sp.species_id}
                className="glass-panel"
                onClick={() => setSelectedSpecies(sp)}
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '375px',
                  position: 'relative',
                  border: '1px solid rgba(0, 229, 255, 0.18)',
                  transition: 'all 0.25s ease'
                }}
              >
                {/* Species Card Header Image */}
                <div style={{ height: '165px', overflow: 'hidden', position: 'relative', background: 'rgba(5, 19, 41, 0.8)' }}>
                  <img 
                    src={resolveImage(sp.image)} 
                    alt={sp.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  
                  {/* Status Badge */}
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    background: isDanger ? 'rgba(239, 68, 68, 0.9)' : sp.status === 'Vulnerable' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(0, 245, 212, 0.9)',
                    color: isDanger ? '#ffffff' : '#051329',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                  }}>
                    {sp.status}
                  </span>

                  {/* Authority Contributed Pill if applicable */}
                  {sp.created_by_name && (
                    <span style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '8px',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '0.62rem',
                      fontWeight: 'bold',
                      background: 'rgba(4, 12, 26, 0.85)',
                      color: 'var(--accent-primary)',
                      border: '1px solid rgba(0, 229, 255, 0.3)'
                    }}>
                      Added by {sp.created_by_name}
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                        {sp.category}
                      </span>
                      {['Authority', 'Admin'].includes(user?.role) && (
                        <button 
                          onClick={(e) => handleDeleteSpecies(sp.species_id || sp.id, sp.name, e)}
                          title="Remove species from catalog"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(239, 68, 68, 0.7)',
                            cursor: 'pointer',
                            padding: '2px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', marginTop: '4px', color: '#ffffff', fontWeight: 'bold' }}>
                      {sp.name}
                    </h3>
                    <p style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text-secondary)', margin: '2px 0 6px 0' }}>
                      {sciName}
                    </p>
                    <p style={{
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: '1.4'
                    }}>
                      {sp.notes || sp.habitat || 'Ecological details documented in profile.'}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: '10px'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Sensitivity: <strong style={{ color: 'var(--accent-primary)' }}>{sp.sensitivity || 'Medium'}</strong>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      View Profile <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW SPECIES FORM */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '640px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', color: '#ffffff', margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={20} color="var(--accent-primary)" />
                  Register Marine Species
                </h2>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  This specimen profile will immediately appear in the Researcher Species Explorer.
                </span>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Photo Upload Box with Preview */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Species Photograph *</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>High-res PNG, JPG (max 15MB)</span>
                </label>
                
                <div 
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  style={{
                    border: '2px dashed rgba(0, 229, 255, 0.35)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    background: 'rgba(10, 25, 48, 0.5)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                    height: imagePreview ? '180px' : '120px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {imagePreview ? (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} 
                      />
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        background: 'rgba(4, 12, 26, 0.85)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        color: 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Camera size={13} /> Change Photo
                      </div>
                    </div>
                  ) : (
                    <>
                      <Camera size={30} style={{ color: 'var(--accent-primary)', opacity: 0.8, marginBottom: '6px' }} />
                      <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#ffffff' }}>Upload Specimen Photo</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Click to select photo or drag and drop image here
                      </div>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
              </div>

              {/* Names: Common & Scientific */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Common Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Olive Ridley Sea Turtle"
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Scientific Taxonomy *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Lepidochelys olivacea"
                    value={formData.scientific_name}
                    onChange={(e) => setFormData(p => ({ ...p, scientific_name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Taxonomy Class & Conservation Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Taxonomy Category *</label>
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(true)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--accent-primary)',
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        padding: 0,
                        fontWeight: '600'
                      }}
                    >
                      + Manage Categories
                    </button>
                  </div>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Conservation Status *</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                  >
                    {CONSERVATION_STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sensitivity Level */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Pollution Sensitivity Index</label>
                <select
                  className="form-control"
                  value={formData.sensitivity}
                  onChange={(e) => setFormData(p => ({ ...p, sensitivity: e.target.value }))}
                >
                  {SENSITIVITY_LEVELS.map(lvl => (
                    <option key={lvl} value={lvl}>{lvl} Sensitivity</option>
                  ))}
                </select>
              </div>

              {/* Habitat */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Typical Habitat</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Shallow coastal waters, sandy beaches, and offshore foraging corridors"
                  value={formData.habitat}
                  onChange={(e) => setFormData(p => ({ ...p, habitat: e.target.value }))}
                />
              </div>

              {/* Anthropogenic Threats */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Anthropogenic Threats</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Trawl nets, microplastic ingestion, coastal artificial lighting"
                  value={formData.threats}
                  onChange={(e) => setFormData(p => ({ ...p, threats: e.target.value }))}
                />
              </div>

              {/* Research Field Notes */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Research Field Notes / Observations</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Behavioral traits, local sightings near Kochi/Kerala shoreline, seasonal migration dates..."
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                ></textarea>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, padding: '12px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Registering Species...' : 'Publish to Species Registry'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CATEGORY MANAGEMENT MODAL */}
      {/* ========================================================================= */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '520px', width: '92%', display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#ffffff', margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="var(--accent-primary)" />
                  Taxonomy Category Manager
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Add or remove categories for marine species classification.
                </span>
              </div>
              <button onClick={() => setShowCategoryModal(false)} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Add Category Form */}
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Enter new category (e.g. Mollusks, Echinoderms)..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={categorySubmitting}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <Plus size={16} /> Add
              </button>
            </form>

            {/* Category List with Delete Option */}
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Categories ({categoriesList.length})
              </div>
              <div style={{
                maxHeight: '260px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px'
              }}>
                {categoriesList.map((cat) => (
                  <div
                    key={cat}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(10, 25, 48, 0.6)',
                      border: '1px solid rgba(0, 229, 255, 0.15)'
                    }}
                  >
                    <span style={{ color: '#ffffff', fontWeight: '600', fontSize: '0.88rem' }}>
                      {cat}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      title={`Remove "${cat}" category`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'rgba(239, 68, 68, 0.7)',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '6px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DETAILED SPECIES PROFILE MODAL */}
      {/* ========================================================================= */}
      {selectedSpecies && (
        <div className="modal-overlay" onClick={() => setSelectedSpecies(null)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ maxWidth: '600px', width: '92%', display: 'flex', flexDirection: 'column', gap: '18px', padding: '24px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.4rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>
                Species Profile Catalog
              </h2>
              <button 
                onClick={() => setSelectedSpecies(null)} 
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Top Grid: Image + Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px', alignItems: 'center' }}>
              <div style={{ borderRadius: '12px', overflow: 'hidden', height: '190px', background: 'rgba(5, 19, 41, 0.8)' }}>
                <img 
                  src={resolveImage(selectedSpecies.image)} 
                  alt={selectedSpecies.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Common Name:</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#ffffff' }}>
                    {selectedSpecies.name}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Scientific Name:</span>
                  <div style={{ fontStyle: 'italic', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                    {selectedSpecies.scientificName || selectedSpecies.scientific_name}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Taxonomy Category:</span>
                  <div style={{ color: '#ffffff' }}>{selectedSpecies.category}</div>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Conservation Status: </span>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    display: 'inline-block',
                    marginTop: '2px',
                    background: selectedSpecies.status === 'Endangered' || selectedSpecies.status === 'Critically Endangered' ? 'rgba(255,77,77,0.2)' : 'rgba(0,245,212,0.2)',
                    color: selectedSpecies.status === 'Endangered' || selectedSpecies.status === 'Critically Endangered' ? 'var(--danger)' : 'var(--success)'
                  }}>
                    {selectedSpecies.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Details Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '16px',
              fontSize: '0.84rem'
            }}>
              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '2px' }}>Typical Habitat:</strong>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {selectedSpecies.habitat || 'Coastal waters, lagoons, reefs, and seagrass beds'}
                </span>
              </div>

              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '2px' }}>Anthropogenic Threats:</strong>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {selectedSpecies.threats || 'Plastic pollution, accidental netting, coastal development'}
                </span>
              </div>

              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '2px' }}>Chemical/Pollution Sensitivity Index:</strong>
                <div style={{ color: 'var(--accent-primary)', fontWeight: 'bold', marginTop: '2px' }}>
                  {selectedSpecies.sensitivity ? `${selectedSpecies.sensitivity} Sensitivity` : 'High Sensitivity'}
                </div>
              </div>

              <div>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '2px' }}>Research Field Notes:</strong>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {selectedSpecies.notes || 'Frequently observed feeding along the coast.'}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => setSelectedSpecies(null)} 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '10px', marginTop: '6px' }}
            >
              Close Profile
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SpeciesManagement;
