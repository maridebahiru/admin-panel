import React from 'react';

const StatsCard = ({ title, value, icon: Icon, description }) => {
  return (
    <div className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-0.5">
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <h3 className="text-3xl font-black text-slate-800 leading-none">
          {value !== undefined ? value : '—'}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 font-medium">
            {description}
          </p>
        )}
      </div>
      
      <div className="p-3 bg-navy-50 rounded-xl text-navy-800 border border-navy-100 flex items-center justify-center">
        <Icon size={24} className="text-navy-800" />
      </div>
    </div>
  );
};

export default StatsCard;
