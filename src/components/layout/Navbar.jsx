import React, { useState } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center text-navy-900">
              <ShoppingBag className="h-8 w-8 text-accent mr-2" />
              <span className="font-bold text-xl tracking-tight">Personal Shopper</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 hover:text-navy-900 font-medium transition-colors">Como funciona</a>
            <a href="#" className="text-gray-600 hover:text-navy-900 font-medium transition-colors">Sobre</a>
            <a href="#" className="text-gray-600 hover:text-navy-900 font-medium transition-colors">Contato</a>
            <button className="bg-navy-900 text-white px-5 py-2 rounded-full font-medium hover:bg-navy-800 transition-colors">
              Login
            </button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-navy-900 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-900 hover:bg-gray-50">Como funciona</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-900 hover:bg-gray-50">Sobre</a>
            <a href="#" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-900 hover:bg-gray-50">Contato</a>
            <a href="#" className="block w-full text-left px-3 py-2 text-base font-medium text-accent hover:bg-gray-50">Login</a>
          </div>
        </div>
      )}
    </nav>
  );
}
