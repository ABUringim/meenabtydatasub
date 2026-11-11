import React from 'react';
import { MessageCircle } from 'lucide-react';

export const FloatingWhatsApp: React.FC = () => {
  return (
    <aside aria-label="Support chat" className="fixed bottom-6 right-6 z-40">
      <a
        href="https://wa.me/2348145239871?text=Hello%20Sayyada%20Datasub%20Support%20Desk"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
        aria-label="Chat with Support on WhatsApp"
        title="Live WhatsApp Support Desk"
      >
        <MessageCircle className="w-5 h-5 fill-white text-emerald-600 group-hover:scale-110 transition-transform" />
        <span className="hidden sm:inline">Support Desk</span>
      </a>
    </aside>
  );
};

export default FloatingWhatsApp;
