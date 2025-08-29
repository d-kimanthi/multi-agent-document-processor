import { Bars3Icon, BellIcon } from '@heroicons/react/24/outline'
import React from 'react'
import { useLocation } from 'react-router-dom'
import { SearchBar } from './SearchBar'

interface HeaderProps {
  onMenuClick: () => void
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation()
  
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard'
      case '/documents':
        return 'Documents'
      case '/upload':
        return 'Upload Document'
      case '/analysis':
        return 'Analysis'
      case '/search':
        return 'Search & Query'
      case '/agents':
        return 'Agent Monitoring'
      default:
        return 'Document Intelligence'
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              type="button"
              className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            <div className="ml-4 lg:ml-0">
              <h1 className="text-2xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <SearchBar />
            </div>
            
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-lg"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" />
            </button>
            
            <div className="flex items-center">
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-700">AI Engineer</div>
                <div className="text-xs text-gray-500">Admin User</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}