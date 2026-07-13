import React, { useState, useEffect } from 'react';
import { safeStorage } from '../lib/safeStorage';

interface CompanyLogoProps {
  className?: string;
}

export default function CompanyLogo({ className = "h-10" }: CompanyLogoProps) {
  const [logo, setLogo] = useState<string | null>(() => {
    return safeStorage.getItem('company_logo');
  });

  useEffect(() => {
    // 1. Fetch custom logo from the backend database settings table
    const fetchLogo = async () => {
      try {
        const res = await fetch('/api/logo');
        if (res.ok) {
          const data = await res.json();
          if (data.logo) {
            setLogo(data.logo);
            safeStorage.setItem('company_logo', data.logo);
          } else {
            setLogo(null);
            safeStorage.removeItem('company_logo');
          }
        }
      } catch (err) {
        console.error("Failed to fetch custom company logo:", err);
      }
    };

    fetchLogo();

    // 2. React to real-time events when admin uploads or resets a logo
    const handleStorageChange = () => {
      const updatedLogo = safeStorage.getItem('company_logo');
      setLogo(updatedLogo);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('company_logo_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('company_logo_updated', handleStorageChange);
    };
  }, []);

  return (
    <img 
      src={logo || "/logo.svg"} 
      alt="شعار الشركة" 
      className={`${className} object-contain`} 
      referrerPolicy="no-referrer" 
      id="company-logo-img"
    />
  );
}
