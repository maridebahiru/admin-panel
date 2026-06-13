import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Megaphone, 
  FolderKanban, 
  Music, 
  Settings as SettingsIcon, 
  LogOut, 
  X 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Announcements', path: '/announcements', icon: Megaphone },
    { name: 'Categories', path: '/categories', icon: FolderKanban },
    { name: 'Mezmurs', path: '/mezmurs', icon: Music },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm lg:hidden" 
          onClick={toggleSidebar}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-navy-800 text-slate-100 transition-transform duration-300 ease-in-out transform border-r border-navy-900/50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:h-screen
      `}>
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-navy-900/50 bg-navy-900">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center font-bold text-navy-800 text-lg shadow-md">
              Z
            </div>
            <span className="text-lg font-bold tracking-wider text-slate-50 font-amharic">
              Zion Admin
            </span>
          </div>
          
          <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-navy-700/50 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    toggleSidebar();
                  }
                }}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium
                  ${isActive 
                    ? 'bg-navy-900 text-gold-500 border-l-4 border-gold-500 font-semibold' 
                    : 'text-slate-300 hover:bg-navy-700/50 hover:text-slate-50'}
                `}
                end={item.path === '/'}
              >
                <IconComponent 
                  size={20} 
                  className="mr-3 transition-colors duration-200" 
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-navy-900/50 bg-navy-900/40">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to log out?')) {
                logout();
              }
            }}
            className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors duration-200 group"
          >
            <LogOut size={20} className="mr-3 text-red-400 group-hover:text-red-300" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
