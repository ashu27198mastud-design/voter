import React from 'react';
import { motion } from 'framer-motion';

interface NextActionCardProps {
  title: string;
  action: string;
}

export const NextActionCard: React.FC<NextActionCardProps> = ({ title, action }) => (
  <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden h-full">
    <div className="absolute top-0 right-0 p-4 opacity-10">
      <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" />
      </svg>
    </div>
    <span className="text-xs font-bold uppercase tracking-widest text-blue-200 mb-2 block">Next Best Action</span>
    <h3 className="text-2xl font-bold mb-2">{title}</h3>
    <p className="text-blue-100">{action}</p>
  </div>
);
