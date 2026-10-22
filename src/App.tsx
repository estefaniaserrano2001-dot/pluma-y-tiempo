import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { LibraryView } from './components/library/LibraryView';
import { BookWorkspace } from './components/workspace/BookWorkspace';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileEditModal } from './components/auth/ProfileEditModal';
import { CustomPaletteModal } from './components/common/CustomPaletteModal';

const AppContent: React.FC = () => {
  const { activeBook, isProfileModalOpen, setIsProfileModalOpen } = useApp();

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <Header />
      <div className="flex-1">
        {activeBook ? <BookWorkspace /> : <LibraryView />}
      </div>
      <GlobalSearchModal />
      <AuthModal />
      <ProfileEditModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <CustomPaletteModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
