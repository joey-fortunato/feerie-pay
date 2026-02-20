
import React from 'react';
import { Search, Bell, Menu } from 'lucide-react';

interface TopBarProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
  title: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuClick, onProfileClick, title }) => {
  return (
    <header className="h-20 bg-bg-main/50 backdrop-blur-md flex-shrink-0 flex items-center justify-between px-6 lg:px-10 border-b border-transparent lg:border-gray-100/50 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 text-dark-text hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl lg:text-2xl font-bold text-dark-text truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {/* Search Bar - Hidden on small mobile */}
        <div className="hidden md:flex items-center bg-white px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 w-64 focus-within:w-80 transition-all duration-300 group">
          <Search size={18} className="text-gray-400 group-focus-within:text-brand-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar transações..."
            className="ml-3 bg-transparent outline-none text-sm w-full text-dark-text placeholder-gray-400"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2.5 text-gray-500 hover:text-brand-primary transition-colors rounded-xl hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-sm">
          <Bell size={20} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-bg-main"></span>
        </button>

        {/* Profile */}
        <div 
          onClick={onProfileClick}
          className="flex items-center gap-3 pl-2 lg:pl-4 lg:border-l border-gray-200 cursor-pointer group"
        >
          <div className="text-right hidden sm:block group-hover:opacity-80 transition-opacity">
            <p className="text-sm font-bold text-dark-text leading-none mb-1">João Manuel</p>
            <p className="text-xs text-gray-500">Loja Luanda</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md border-2 border-white group-hover:shadow-lg transition-all">
            JM
          </div>
        </div>
      </div>
    </header>
  );
};
