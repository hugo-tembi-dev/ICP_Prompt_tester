import React, { useState } from 'react';
import { 
  QuestionMarkCircleIcon, 
  DocumentTextIcon, 
  BeakerIcon, 
  ChartBarIcon, 
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigation = [
  { 
    id: 'questions', 
    name: 'Questions', 
    icon: QuestionMarkCircleIcon,
    description: 'Manage your question library'
  },
  { 
    id: 'prompts', 
    name: 'Build Prompts', 
    icon: DocumentTextIcon,
    description: 'Create prompts from Q&A'
  },
  { 
    id: 'testing', 
    name: 'Test Prompts', 
    icon: BeakerIcon,
    description: 'Run tests with your data'
  },
  { 
    id: 'results', 
    name: 'Analytics', 
    icon: ChartBarIcon,
    description: 'View performance insights'
  },
  { 
    id: 'test-runs', 
    name: 'Test Runs', 
    icon: ClockIcon,
    description: 'Browse test history'
  },
];

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-gray-600 bg-opacity-75" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || true) && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`
              fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-strong transform
              lg:translate-x-0 lg:static lg:inset-0
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">ICP Prompt Tester</h1>
                  <p className="text-xs text-gray-500">Build & Test AI Prompts</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Bars3Icon className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <nav className="mt-6 px-4">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onTabChange(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`
                        w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                        ${isActive
                          ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <item.icon 
                        className={`
                          mr-2 h-4 w-4 flex-shrink-0
                          ${isActive ? 'text-primary-600' : 'text-gray-400'}
                       `} 
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs opacity-75">{item.description}</div>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="w-2 h-2 bg-primary-600 rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* User Section */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <div className="w-4 h-4 text-gray-400">
                    <svg 
                      className={`transform transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            // TODO: Add profile functionality
                            console.log('Profile clicked');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <UserCircleIcon className="h-4 w-4" />
                          <span>Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            // TODO: Add settings functionality
                            console.log('Settings clicked');
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                          <span>Settings</span>
                        </button>
                        <div className="border-t border-gray-100"></div>
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Bars3Icon className="h-5 w-5 text-gray-500" />
            </button>
            
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="hidden lg:block">
                  <h2 className="text-xl font-semibold text-gray-900 capitalize">
                    {navigation.find(item => item.id === activeTab)?.name || 'Dashboard'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {navigation.find(item => item.id === activeTab)?.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                  <span>System Online</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
