export default function DefaultProductImage({ productName, category }) {
  // Get category icon based on product category
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'skincare':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M8 12h8"/>
            <path d="M12 8v8"/>
          </svg>
        );
      case 'makeup':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 12h20"/>
            <path d="M12 2v20"/>
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        );
      case 'haircare':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C8 2 5 5 5 9c0 2 1 4 3 5v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-6c2-1 3-3 3-5 0-4-3-7-7-7z"/>
          </svg>
        );
      case 'fragrance':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 2v6l3 3 3-3V2"/>
            <path d="M6 8h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"/>
            <path d="M12 8v10"/>
          </svg>
        );
      case 'bodycare':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v4l4 4 4-4V2"/>
            <path d="M4 6h16v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z"/>
          </svg>
        );
      case 'tools':
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        );
      default:
        return (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="9" cy="9" r="2"/>
            <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
          </svg>
        );
    }
  };

  // Get initials from product name
  const getInitials = (name) => {
    if (!name) return 'P';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--brand-2)' }}
    >
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, var(--brand) 1px, transparent 1px),
                           radial-gradient(circle at 80% 50%, var(--brand) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center p-4">
        {/* Category Icon */}
        <div className="mb-3 opacity-60" style={{ color: 'var(--brand)' }}>
          {getCategoryIcon(category)}
        </div>
        
        {/* Product Initials */}
        <div 
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--brand)' }}
        >
          {getInitials(productName)}
        </div>
        
        {/* Category Label */}
        {category && (
          <div 
            className="text-xs uppercase tracking-wide font-medium"
            style={{ color: 'var(--muted)' }}
          >
            {category}
          </div>
        )}
      </div>
      
      {/* Corner Accent */}
      <div 
        className="absolute top-0 right-0 w-8 h-8 opacity-20"
        style={{
          background: `linear-gradient(-45deg, var(--brand) 0%, transparent 70%)`,
        }}
      />
      <div 
        className="absolute bottom-0 left-0 w-8 h-8 opacity-20"
        style={{
          background: `linear-gradient(45deg, var(--brand) 0%, transparent 70%)`,
        }}
      />
    </div>
  );
}
