import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { speechService } from './services/speechService';
import { vlibrasService } from './services/vlibrasService';
import { storageUtils } from './utils/storageUtils';
import { TranscriptLine, Theme, ConnectionStatus, VisualizerStyle } from './types';
import { ttsService } from './services/ttsService';
import { v4 as uuidv4 } from 'uuid';

import HomePage from './pages/HomePage';
import SettingsPage from './pages/SettingsPage';
import { VLibrasControl } from './components/VLibrasControl';
import { LoadingScreen } from './components/LoadingScreen';

function App() {
  const [activeTab, setActiveTab] = useState<'voice' | 'text'>('voice');
  const [textInput, setTextInput] = useState('');
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const [transcripts, setTranscripts] = useState<TranscriptLine[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  const [rms, setRms] = useState(0);
  const [theme, setTheme] = useState<Theme>('dark');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCacheEnabled, setIsCacheEnabled] = useState(true);
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>('wave');
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  // ── Estado da fila VLibras ────────────────────────────────────────────────
  const [vlibrasCurrentText, setVlibrasCurrentText] = useState<string | null>(null);
  const [vlibrasQueue, setVlibrasQueue] = useState<string[]>([]);

  // ── Inicialização ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Monitora o carregamento do VLibras
    const checkVLibras = () => {
      const vpw = document.querySelector('[vw-plugin-wrapper]') as HTMLElement | null;
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      
      // Consideramos pronto se o wrapper existir e o canvas (avatar) estiver presente
      if (vpw && canvas) {
        setTimeout(() => setIsAppReady(true), 2000); // 2s extras para o avatar "nascer"
        return true;
      }
      return false;
    };

    if (!checkVLibras()) {
      const interval = setInterval(() => {
        if (checkVLibras()) clearInterval(interval);
      }, 500);
      
      // Fallback de 12 segundos para conexões lentas
      const timeout = setTimeout(() => {
        setIsAppReady(true);
        clearInterval(interval);
      }, 12000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, []);

  useEffect(() => {
    setIsCacheEnabled(storageUtils.isCacheEnabled());
    setTranscripts(storageUtils.getTranscripts());
    const savedTheme = storageUtils.getTheme();
    setTheme(savedTheme);
    setVisualizerStyle(storageUtils.getVisualizerStyle());
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');

    // Update check logic
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });

        // Periodic check every 5 minutes
        const interval = setInterval(() => {
          registration.update();
        }, 1000 * 60 * 5);
        return () => clearInterval(interval);
      });
    }
  }, []);

  // ── VLibras: carrega o widget e usa data-auto-clicked ────────────────────
  // Mesma técnica do Traduz Libras (traduzlibras.com.br):
  //   • data-auto-clicked="true" no vw-access-button → abre o widget
  //   • data-auto-clicked="true" no vpw-skip-welcome-message → pula animação
  //   • data-auto-clicked="true" no vpw-guide__main__deny-btn → dispensa onboarding
  useEffect(() => {
    if (document.getElementById('vlibras-script')) return;

    const script = document.createElement('script');
    script.id = 'vlibras-script';
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    script.onload = () => {
      const w = window as any;
      if (w.VLibras) new w.VLibras.Widget('https://vlibras.gov.br/app');

      const autoClick = () => {
        const selectors = [
          '[vw-access-button]',
          '.vpw-skip-welcome-message',
          '.vpw-guide__main__deny-btn',
        ];
        selectors.forEach(sel => {
          const el = document.querySelector(sel) as HTMLElement | null;
          if (el && !el.dataset.autoClicked) {
            el.setAttribute('data-auto-clicked', 'true');
            el.click();
          }
        });

        // Automatic configuration triggers
      };

      autoClick();
      setTimeout(autoClick, 500);
      setTimeout(autoClick, 1500);
      setTimeout(autoClick, 3000);

      new MutationObserver(autoClick).observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    };

    document.body.appendChild(script);
    return () => { document.getElementById('vlibras-script')?.remove(); };
  }, []);

  const handleRefresh = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      if (window.caches) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
    }
    window.location.reload();
  };

  // Registra callbacks no vlibrasService
  useEffect(() => {
    vlibrasService.setCallbacks({
      onTranslating: (text) => setVlibrasCurrentText(text),
      onQueueChange: (queue) => setVlibrasQueue([...queue]),
      onIdle: () => {
        setVlibrasCurrentText(null);
        setVlibrasQueue([]);
      },
    });
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const saveTranscripts = useCallback((newTranscripts: TranscriptLine[]) => {
    setTranscripts(newTranscripts);
    storageUtils.saveTranscripts(newTranscripts);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    storageUtils.setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleToggleCache = (enabled: boolean) => {
    setIsCacheEnabled(enabled);
    storageUtils.setCacheEnabled(enabled);
    if (!enabled) setTranscripts([]);
  };

  const handleVisualizerStyleChange = (style: VisualizerStyle) => {
    setVisualizerStyle(style);
    storageUtils.setVisualizerStyle(style);
  };

  // ── Controle de gravação ──────────────────────────────────────────────────
  const handleStart = async () => {
    try {
      setError(null);
      setStatus(ConnectionStatus.CONNECTING);

      await speechService.connect(
        (text, isFinal) => {
          if (isFinal) {
            setTranscripts((prev) => {
              const newTranscripts = [
                ...prev,
                {
                  id: uuidv4(),
                  text,
                  isFinal: true,
                  timestamp: Date.now(),
                  source: 'user',
                  inputType: 'voice',
                } as TranscriptLine,
              ];
              storageUtils.saveTranscripts(newTranscripts);
              return newTranscripts;
            });
            setCurrentTranscription('');
            vlibrasService.translate(text);
          } else {
            setCurrentTranscription(text);
          }
        },
        (err) => {
          setError(err.message);
          setStatus(ConnectionStatus.ERROR);
          handleStop();
        },
        (volume) => setRms(volume)
      );

      setStatus(ConnectionStatus.CONNECTED);
    } catch (err: any) {
      setError(err.message || 'Failed to start recording');
      setStatus(ConnectionStatus.ERROR);
    }
  };

  // Inicia o microfone automaticamente quando o app estiver pronto
  useEffect(() => {
    if (isAppReady && activeTab === 'voice') {
      const timer = setTimeout(() => {
        handleStart();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isAppReady, activeTab]);

  const handleStop = async () => {
    await speechService.disconnect();
    setStatus(ConnectionStatus.DISCONNECTED);
    setRms(0);

    if (currentTranscription) {
      const finalTranscription = currentTranscription;
      setTranscripts((prev) => {
        const newTranscripts = [
          ...prev,
          {
            id: uuidv4(),
            text: finalTranscription,
            isFinal: true,
            timestamp: Date.now(),
            source: 'user',
            inputType: 'voice',
          } as TranscriptLine,
        ];
        storageUtils.saveTranscripts(newTranscripts);
        return newTranscripts;
      });
      setCurrentTranscription('');
      vlibrasService.translate(finalTranscription);
    }
  };

  const clearHistory = () => {
    saveTranscripts([]);
    storageUtils.clearTranscripts();
  };

  const handleSendText = () => {
    if (!textInput.trim()) return;
    const newText = textInput.trim();
    
    setTranscripts((prev) => {
      const newTranscripts = [
        ...prev,
        {
          id: uuidv4(),
          text: newText,
          isFinal: true,
          timestamp: Date.now(),
          source: 'user',
          inputType: 'text',
        } as TranscriptLine,
      ];
      storageUtils.saveTranscripts(newTranscripts);
      return newTranscripts;
    });

    if (isTTSEnabled) {
      ttsService.speak(newText);
    }
    vlibrasService.translate(newText);
    setTextInput('');
  };

  return (
    <BrowserRouter>
      <AnimatePresence>
        {!isAppReady && <LoadingScreen key="splash" message="Iniciando VLibras..." />}
      </AnimatePresence>
      
      <VLibrasControl />
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              textInput={textInput}
              setTextInput={setTextInput}
              isTTSEnabled={isTTSEnabled}
              setIsTTSEnabled={setIsTTSEnabled}
              transcripts={transcripts}
              currentTranscription={currentTranscription}
              status={status}
              error={error}
              rms={rms}
              updateAvailable={updateAvailable}
              vlibrasCurrentText={vlibrasCurrentText}
              vlibrasQueue={vlibrasQueue}
              visualizerStyle={visualizerStyle}
              handleRefresh={handleRefresh}
              handleStart={handleStart}
              handleStop={handleStop}
              handleSendText={handleSendText}
              isHistoryOpen={isHistoryOpen}
              setIsHistoryOpen={setIsHistoryOpen}
              clearHistory={clearHistory}
            />
          }
        />
        <Route
          path="/settings"
          element={
            <SettingsPage
              isCacheEnabled={isCacheEnabled}
              onToggleCache={handleToggleCache}
              visualizerStyle={visualizerStyle}
              onVisualizerStyleChange={handleVisualizerStyleChange}
              theme={theme}
              onToggleTheme={toggleTheme}
              transcripts={transcripts}
              onClearHistory={clearHistory}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
