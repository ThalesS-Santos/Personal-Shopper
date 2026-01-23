import React, { useState, useEffect } from 'react';
import { Menu, X, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Dynamic Styles
  const navBg = scrolled ? 'bg-transparent backdrop-blur-none shadow-none' : 'bg-white shadow-sm';
  const textColor = scrolled ? 'text-white hover:text-orange-200' : 'text-gray-600 hover:text-navy-900';
  const logoColor = scrolled ? 'text-white' : 'text-navy-900';
  const buttonStyle = scrolled 
    ? 'bg-white text-navy-900 hover:bg-gray-100 shadow-lg' 
    : 'bg-navy-900 text-white hover:bg-navy-800';

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="w-full px-6 md:px-10">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className={`flex-shrink-0 flex items-center group transition-colors duration-300 ${logoColor}`}>
              <ShoppingBag className="h-8 w-8 text-accent mr-3 group-hover:text-orange-600 transition-colors" />
              <span className="font-exhibit font-bold text-2xl tracking-tight">Personal Shopper</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/como-funciona" className={`font-medium transition-colors duration-300 ${textColor}`}>Como funciona</Link>
            <Link to="/sobre" className={`font-medium transition-colors duration-300 ${textColor}`}>Sobre</Link>
            <Link to="/contato" className={`font-medium transition-colors duration-300 ${textColor}`}>Contato</Link>
            <button className={`px-6 py-2.5 rounded-full font-medium transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 ${buttonStyle}`}>
              Login
            </button>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`focus:outline-none transition-colors duration-300 ${scrolled ? 'text-white' : 'text-gray-600'}`}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 animate-slide-down">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/como-funciona" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-900 hover:bg-gray-50">Como funciona</Link>
            <Link to="/sobre" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-900 hover:bg-gray-50">Sobre</Link>
            <Link to="/contato" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-navy-900 hover:bg-gray-50">Contato</Link>
            <a href="#" className="block w-full text-left px-3 py-2 text-base font-medium text-accent hover:bg-gray-50">Login</a>
          </div>
        </div>
      )}
    </nav>
  );
}
