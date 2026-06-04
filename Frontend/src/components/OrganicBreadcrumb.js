"use client";

import Link from 'next/link';

export default function OrganicBreadcrumb({ paths }) {
  return (
    <nav className="flex items-center space-x-2 text-xs font-mono uppercase tracking-widest text-slate-500 mb-8">
      <Link href="/" className="hover:text-emerald-400 transition-colors duration-300">
        Origin Vault
      </Link>
      
      {paths.map((path, index) => (
        <div key={index} className="flex items-center space-x-2">
          <span className="text-slate-700">/</span>
          {path.href ? (
            <Link href={path.href} className="hover:text-cyan-400 transition-colors duration-300">
              {path.label}
            </Link>
          ) : (
            <span className="text-slate-300">{path.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}