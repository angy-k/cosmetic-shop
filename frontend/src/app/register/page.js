"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
    
    // Real-time validation for password confirmation
    if (name === 'confirmPassword' || name === 'password') {
      const updatedData = { ...formData, [name]: value };
      if (updatedData.password && updatedData.confirmPassword) {
        if (updatedData.password !== updatedData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: "Passwords do not match"
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            confirmPassword: ""
          }));
        }
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { confirmPassword, ...submitData } = formData;
      
      const result = await register(submitData);
      
      if (result.success) {
        // Redirect to home page
        router.push('/');
      } else {
        setErrors({ general: result.error });
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--background)' }}>
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>
            Create Account
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            Join us and start your beauty journey today
          </p>
        </div>

        {/* Register Form */}
        <div className="rounded-lg border p-8 shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--error)', color: 'white' }}>
                {errors.general}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  background: 'var(--background)', 
                  borderColor: errors.name ? 'var(--error)' : 'var(--border)',
                  color: 'var(--foreground)',
                  focusRingColor: 'var(--brand)'
                }}
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  background: 'var(--background)', 
                  borderColor: errors.email ? 'var(--error)' : 'var(--border)',
                  color: 'var(--foreground)',
                  focusRingColor: 'var(--brand)'
                }}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Phone Number <span className="text-xs" style={{ color: 'var(--muted)' }}>(optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  background: 'var(--background)', 
                  borderColor: errors.phone ? 'var(--error)' : 'var(--border)',
                  color: 'var(--foreground)',
                  focusRingColor: 'var(--brand)'
                }}
                placeholder="Enter your phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  background: 'var(--background)', 
                  borderColor: errors.password ? 'var(--error)' : 'var(--border)',
                  color: 'var(--foreground)',
                  focusRingColor: 'var(--brand)'
                }}
                placeholder="Create a password"
              />
              {errors.password && (
                <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{ 
                    background: 'var(--background)', 
                    borderColor: errors.confirmPassword ? 'var(--error)' : 
                                (formData.password && formData.confirmPassword && formData.password === formData.confirmPassword) ? 'var(--success)' : 'var(--border)',
                    color: 'var(--foreground)',
                    focusRingColor: 'var(--brand)'
                  }}
                  placeholder="Confirm your password"
                />
                {/* Password match indicator */}
                {formData.password && formData.confirmPassword && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {formData.password === formData.confirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--success)' }}>
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--error)' }}>
                        <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm" style={{ color: 'var(--error)' }}>
                  {errors.confirmPassword}
                </p>
              )}
              {/* Success message when passwords match */}
              {!errors.confirmPassword && formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-1 text-sm" style={{ color: 'var(--success)' }}>
                  Passwords match ✓
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'var(--brand)' }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="font-medium hover:underline transition-colors"
                style={{ color: 'var(--brand)' }}
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
