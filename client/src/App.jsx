import React, { useEffect, useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import TextToImage from './components/TextToImage';
import TextToImageN8N from './components/TextToImageN8N';
import Inpainting from './components/Inpainting';
import Outpainting from './components/Outpainting';
import ImageUnderstanding from './components/ImageUnderstanding';
import { ENDPOINTS } from './config';

function App() {
  const [activeFeature, setActiveFeature] = useState('text-to-image');
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setUserLoading(true);
        setUserError(null);
        const res = await fetch(ENDPOINTS.ME, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Accept': 'application/json' },
        });
        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          if (data && data.authenticated) {
            setUser(data);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        setUserError('Failed to retrieve user');
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };

    fetchUser();
  }, []);

  const renderFeature = () => {
    switch (activeFeature) {
      case 'text-to-image':
        return <TextToImage />;
      case 'text-to-image-n8n':
        return <TextToImageN8N />;
      case 'inpainting':
        return <Inpainting />;
      case 'outpainting':
        return <Outpainting />;
      case 'image-understanding':
        return <ImageUnderstanding />;
      default:
        return <TextToImage />;
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>AI Photo Editor</h1>
        <div className="header-spacer" />
        <div className="user-badge" title={user && (user.displayName || `${user.domain ? user.domain + '\\' : ''}${user.name}`) || ''}>
          {userLoading ? (
            <span className="user-muted">Signing in...</span>
          ) : user ? (
            <>
              <span className="user-name">{user.displayName || user.name || 'User'}</span>
              {user.domain || user.name ? (
                <span className="user-sub">{`${user.domain ? user.domain + '\\' : ''}${user.name || ''}`}</span>
              ) : null}
            </>
          ) : userError ? (
            <span className="user-error">User unavailable</span>
          ) : (
            <span className="user-muted">Not authenticated</span>
          )}
        </div>
      </header>
      <div className="main-content">
        <Sidebar onSelectFeature={setActiveFeature} activeFeature={activeFeature} />
        <main className="content">
          <div className="container">
            {renderFeature()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

