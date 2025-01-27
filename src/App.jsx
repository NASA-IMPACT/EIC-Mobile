import Map from './components/Map';
import Panel from './components/Panel';
import EICLogo from './components/Logo';
import { AppProvider, useAppContext } from './contexts';
import RotateOverlay from './components/RotateOverlay';
import Tour from './components/Tour';

function AppContent() {
  const { hasWebGLError } = useAppContext();

  if (hasWebGLError) {
    return (
      <div>
        Your WebGL implementation doesn't seem to support hardware accelerated
        rendering. Check your browser settings or if your GPU is in a blocklist.
      </div>
    );
  }

  return (
    <>
      <Tour />
      <RotateOverlay />
      <EICLogo />
      <Panel />
      <Map />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}