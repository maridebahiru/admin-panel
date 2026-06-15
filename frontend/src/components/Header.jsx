import React from 'react';
import { Menu, User, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Header = ({ choirName, logoUrl, toggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shadow-sm">
      {/* Left side: Hamburger menu & Title */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex items-center space-x-3">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt="Choir Logo" 
              className="w-9 h-9 rounded-full object-cover border-2 border-gold-500/30"
              onError={(e) => {
                e.target.style.display = 'none'; // hide if broken
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-navy-800 flex items-center justify-center font-bold text-gold-500 text-sm">
              HM
            </div>
          )}
          <span className="text-sm font-bold text-navy-800 font-amharic hidden sm:inline-block">
            {choirName || 'Hyme Managmenr'}
          </span>
        </div>
      </div>

      {/* Right side: Admin Email & Quick Info */}
      <div className="flex items-center space-x-4">
        {/* User Info Card */}
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 border border-slate-200">
            <User size={18} />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-500">Administrator</p>
             <span className="text-[10px] text-slate-400 font-semibold block truncate max-w-[150px]">
              {user?.email || 'admin@hymemanagmenr.org'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
