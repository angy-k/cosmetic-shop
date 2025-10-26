"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function ProductForm({ product = null, onSubmit, onCancel, isLoading = false }) {
  const { apiCall } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    originalPrice: '',
    brand: '',
    category: '',
    subcategory: '',
    sku: '',
    tags: [],
    images: [],
    inventory: {
      quantity: '',
      lowStockThreshold: '10',
      trackInventory: true
    },
    specifications: {
      weight: { value: '', unit: 'ml' },
      dimensions: { length: '', width: '', height: '', unit: 'cm' },
      ingredients: [],
      skinType: [],
      concerns: []
    },
    isFeatured: false,
    isActive: true
  });
  
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');
  const [newImage, setNewImage] = useState({ url: '', alt: '', isPrimary: false });
  const [imageInputType, setImageInputType] = useState('url'); // 'url' or 'file'
  const [uploadingImage, setUploadingImage] = useState(false);

  // Generate SKU suggestion based on brand and category
  const generateSKU = () => {
    if (!formData.brand || !formData.category) return '';
    
    const brandCode = formData.brand.substring(0, 2).toUpperCase();
    const categoryCode = formData.category.substring(0, 2).toUpperCase();
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${brandCode}-${categoryCode}-${randomNum}`;
  };

  // Populate form with existing product data for editing
  useEffect(() => {
    if (product && product._id) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        brand: product.brand || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        sku: product.sku || '',
        tags: product.tags || [],
        images: product.images || [],
        inventory: {
          quantity: product.inventory?.quantity?.toString() || '',
          lowStockThreshold: product.inventory?.lowStockThreshold?.toString() || '10',
          trackInventory: product.inventory?.trackInventory !== false
        },
        specifications: {
          weight: {
            value: product.specifications?.weight?.value?.toString() || '',
            unit: product.specifications?.weight?.unit || 'ml'
          },
          dimensions: {
            length: product.specifications?.dimensions?.length?.toString() || '',
            width: product.specifications?.dimensions?.width?.toString() || '',
            height: product.specifications?.dimensions?.height?.toString() || '',
            unit: product.specifications?.dimensions?.unit || 'cm'
          },
          ingredients: product.specifications?.ingredients || [],
          skinType: product.specifications?.skinType || [],
          concerns: product.specifications?.concerns || []
        },
        isFeatured: product.isFeatured || false,
        isActive: product.isActive !== false
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('inventory.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        inventory: {
          ...prev.inventory,
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name.startsWith('specifications.')) {
      const parts = name.split('.');
      if (parts.length === 3) {
        // Handle nested objects like specifications.weight.value
        const [, section, field] = parts;
        setFormData(prev => ({
          ...prev,
          specifications: {
            ...prev.specifications,
            [section]: {
              ...prev.specifications[section],
              [field]: value
            }
          }
        }));
      } else if (parts.length === 2) {
        // Handle arrays like specifications.ingredients
        const [, field] = parts;
        setFormData(prev => ({
          ...prev,
          specifications: {
            ...prev.specifications,
            [field]: value
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }
    
    setUploadingImage(true);
    
    try {
      // Compress image first
      const compressedFile = await compressImage(file);
      
      // Convert compressed image to base64 data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setNewImage(prev => ({ ...prev, url: imageUrl }));
        setUploadingImage(false);
      };
      reader.onerror = () => {
        alert('Error reading file');
        setUploadingImage(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error uploading image');
      setUploadingImage(false);
    }
  };

  const addImage = () => {
    if (newImage.url.trim()) {
      const imageToAdd = {
        ...newImage,
        isPrimary: formData.images.length === 0 || newImage.isPrimary
      };
      
      // If this is set as primary, unset others
      let updatedImages = formData.images;
      if (imageToAdd.isPrimary) {
        updatedImages = formData.images.map(img => ({ ...img, isPrimary: false }));
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...updatedImages, imageToAdd]
      }));
      setNewImage({ url: '', alt: '', isPrimary: false });
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const setPrimaryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.brand.trim()) newErrors.brand = 'Brand is required';
    if (!formData.inventory.quantity || parseInt(formData.inventory.quantity) < 0) {
      newErrors['inventory.quantity'] = 'Valid quantity is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Transform data for submission
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        inventory: {
          ...formData.inventory,
          quantity: parseInt(formData.inventory.quantity),
          lowStockThreshold: parseInt(formData.inventory.lowStockThreshold)
        }
      };
      
      onSubmit(submitData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Basic Information
        </h2>
        
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            Product Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--background)', 
              borderColor: errors.name ? 'var(--error)' : 'var(--border)',
              color: 'var(--foreground)'
            }}
            placeholder="Enter product name"
          />
          {errors.name && (
            <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Brand */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            Brand *
          </label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--background)', 
              borderColor: errors.brand ? 'var(--error)' : 'var(--border)',
              color: 'var(--foreground)'
            }}
            placeholder="Enter brand name"
          />
          {errors.brand && (
            <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
              {errors.brand}
            </p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--background)', 
              borderColor: errors.category ? 'var(--error)' : 'var(--border)',
              color: 'var(--foreground)'
            }}
          >
            <option value="">Select category</option>
            <option value="skincare">Skincare</option>
            <option value="makeup">Makeup</option>
            <option value="fragrance">Fragrance</option>
            <option value="haircare">Hair Care</option>
            <option value="bodycare">Body Care</option>
            <option value="tools">Tools & Accessories</option>
            <option value="sets">Sets</option>
            <option value="other">Other</option>
          </select>
          {errors.category && (
            <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
              {errors.category}
            </p>
          )}
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            Subcategory
          </label>
          <input
            type="text"
            name="subcategory"
            value={formData.subcategory}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--background)', 
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
            placeholder="Enter subcategory (optional)"
          />
        </div>

        {/* SKU */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            SKU *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              name="sku"
              value={formData.sku}
              onChange={handleChange}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                background: 'var(--background)', 
                borderColor: errors.sku ? 'var(--error)' : 'var(--border)',
                color: 'var(--foreground)'
              }}
              placeholder="Enter SKU (e.g., SKIN-001)"
            />
            <button
              type="button"
              onClick={() => {
                const newSKU = generateSKU();
                if (newSKU) {
                  setFormData(prev => ({ ...prev, sku: newSKU }));
                  // Clear SKU error if it exists
                  if (errors.sku) {
                    setErrors(prev => ({ ...prev, sku: '' }));
                  }
                }
              }}
              disabled={!formData.brand || !formData.category}
              className="px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              style={{ 
                background: 'var(--accent)', 
                color: 'white',
                minWidth: '80px'
              }}
              title={!formData.brand || !formData.category ? 'Fill brand and category first' : 'Generate SKU'}
            >
              Generate
            </button>
          </div>
          {errors.sku && (
            <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
              {errors.sku}
            </p>
          )}
          <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
            SKU must be unique. Fill brand and category first, then click Generate for a suggestion.
          </p>
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            Short Description
          </label>
          <input
            type="text"
            name="shortDescription"
            value={formData.shortDescription}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--background)', 
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
            placeholder="Brief product description"
            maxLength="100"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--background)', 
              borderColor: errors.description ? 'var(--error)' : 'var(--border)',
              color: 'var(--foreground)'
            }}
            placeholder="Detailed product description"
          />
          {errors.description && (
            <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
              {errors.description}
            </p>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Pricing
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Price * ($)
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                background: 'var(--background)', 
                borderColor: errors.price ? 'var(--error)' : 'var(--border)',
                color: 'var(--foreground)'
              }}
              placeholder="0.00"
            />
            {errors.price && (
              <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                {errors.price}
              </p>
            )}
          </div>

          {/* Original Price */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Original Price ($)
            </label>
            <input
              type="number"
              name="originalPrice"
              value={formData.originalPrice}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                background: 'var(--background)', 
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              placeholder="0.00 (for discounts)"
            />
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Inventory
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Quantity *
            </label>
            <input
              type="number"
              name="inventory.quantity"
              value={formData.inventory.quantity}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                background: 'var(--background)', 
                borderColor: errors['inventory.quantity'] ? 'var(--error)' : 'var(--border)',
                color: 'var(--foreground)'
              }}
              placeholder="0"
            />
            {errors['inventory.quantity'] && (
              <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                {errors['inventory.quantity']}
              </p>
            )}
          </div>

          {/* Low Stock Threshold */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Low Stock Threshold
            </label>
            <input
              type="number"
              name="inventory.lowStockThreshold"
              value={formData.inventory.lowStockThreshold}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                background: 'var(--background)', 
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              placeholder="10"
            />
          </div>
        </div>

        {/* Track Inventory */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="inventory.trackInventory"
              checked={formData.inventory.trackInventory}
              onChange={handleChange}
            />
            <span style={{ color: 'var(--foreground)' }}>Track Inventory</span>
          </label>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Tags
        </h2>
        
        {/* Add Tag */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--background)', 
              borderColor: 'var(--border)',
              color: 'var(--foreground)'
            }}
            placeholder="Add a tag"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 rounded-lg font-medium hover:opacity-90"
            style={{ background: 'var(--brand)', color: 'white' }}
          >
            Add
          </button>
        </div>

        {/* Tag List */}
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                style={{ background: 'var(--brand-2)', color: 'var(--foreground)' }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:opacity-70"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Images
        </h2>
        
        {/* Image Input Type Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setImageInputType('url')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              imageInputType === 'url' ? 'opacity-100' : 'opacity-60'
            }`}
            style={{ 
              background: imageInputType === 'url' ? 'var(--brand)' : 'var(--surface)',
              color: imageInputType === 'url' ? 'white' : 'var(--foreground)',
              border: imageInputType === 'url' ? 'none' : '1px solid var(--border)'
            }}
          >
            URL
          </button>
          <button
            type="button"
            onClick={() => setImageInputType('file')}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              imageInputType === 'file' ? 'opacity-100' : 'opacity-60'
            }`}
            style={{ 
              background: imageInputType === 'file' ? 'var(--brand)' : 'var(--surface)',
              color: imageInputType === 'file' ? 'white' : 'var(--foreground)',
              border: imageInputType === 'file' ? 'none' : '1px solid var(--border)'
            }}
          >
            Upload File
          </button>
        </div>
        
        {/* Add Image */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {/* Image Input - URL or File */}
            {imageInputType === 'url' ? (
              <input
                type="url"
                value={newImage.url}
                onChange={(e) => setNewImage(prev => ({ ...prev, url: e.target.value }))}
                className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ 
                  background: 'var(--background)', 
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)'
                }}
                placeholder="Image URL"
              />
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 w-full"
                  style={{ 
                    background: 'var(--background)', 
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)'
                  }}
                  disabled={uploadingImage}
                />
                {uploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: 'var(--brand)' }}></div>
                  </div>
                )}
              </div>
            )}
            
            {/* Alt Text */}
            <input
              type="text"
              value={newImage.alt}
              onChange={(e) => setNewImage(prev => ({ ...prev, alt: e.target.value }))}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ 
                background: 'var(--background)', 
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
              placeholder="Alt text"
            />
            
            {/* Primary Checkbox and Add Button */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newImage.isPrimary}
                  onChange={(e) => setNewImage(prev => ({ ...prev, isPrimary: e.target.checked }))}
                />
                <span className="text-sm" style={{ color: 'var(--foreground)' }}>Primary</span>
              </label>
              <button
                type="button"
                onClick={addImage}
                disabled={uploadingImage || !newImage.url.trim()}
                className="px-4 py-2 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--brand)', color: 'white' }}
              >
                {uploadingImage ? 'Uploading...' : 'Add'}
              </button>
            </div>
          </div>
          
          {/* Image Preview */}
          {newImage.url && (
            <div className="mt-2">
              <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>Preview:</p>
              <img
                src={newImage.url}
                alt={newImage.alt || 'Preview'}
                className="w-32 h-32 object-cover rounded-lg border"
                style={{ borderColor: 'var(--border)' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Image List */}
        {formData.images.length > 0 && (
          <div className="space-y-2">
            {formData.images.map((image, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 border rounded-lg"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg0NFY0NEgyMFYyMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Ik0yOCAzMkwzMiAyOEwzNiAzMkw0MCAyOEw0NCAzNlY0MEgyOFYzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                  }}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    {image.alt || 'No alt text'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {image.url}
                  </p>
                  {image.isPrimary && (
                    <span className="inline-block px-2 py-1 text-xs rounded" style={{ background: 'var(--brand)', color: 'white' }}>
                      Primary
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className="px-3 py-1 text-xs rounded border hover:opacity-70"
                      style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    >
                      Set Primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="px-3 py-1 text-xs rounded hover:opacity-70"
                    style={{ background: 'var(--error)', color: 'white' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
          Settings
        </h2>
        
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isFeatured"
              checked={formData.isFeatured}
              onChange={handleChange}
            />
            <span style={{ color: 'var(--foreground)' }}>Featured Product</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
            />
            <span style={{ color: 'var(--foreground)' }}>Active (visible to customers)</span>
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-4 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--brand)', color: 'white' }}
        >
          {isLoading ? 'Saving...' : (product ? 'Update Product' : 'Create Product')}
        </button>
        
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-3 rounded-lg font-medium border hover:opacity-70 disabled:opacity-50"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
