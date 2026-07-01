import { useState, useEffect } from 'react';
import { TrainingGround } from './scenes/TrainingGround';
import { HUD } from './components/ui/HUD';
import { TutorialPanel } from './components/ui/TutorialPanel';
import { DamageNumbers } from './components/ui/DamageNumbers';
import { LoadingScreen } from './components/ui/LoadingScreen';
import { ResultScreen } from './components/ui/ResultScreen';
import { PerformancePanel } from './components/ui/PerformancePanel';
import { PointerLockHint } from './components/ui/PointerLockHint';
import { SettingsPanel } from './components/ui/SettingsPanel';
import { SkinPanel } from './components/ui/SkinPanel';
import { ModeSelect } from './components/ui/ModeSelect';
import { MainMenu } from './components/ui/MainMenu';
import { useGameStore } from './stores/gameStore';
import './index.css';

/**
 * 应用根组件
 */
export default function App() {
  const isLoading = useGameStore((state) => state.isLoading);
  const isGameOver = useGameStore((state) => state.isGameOver);
  const isInMenu = useGameStore((state) => state.isInMenu);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSkinOpen, setIsSkinOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        if (isSkinOpen) {
          setIsSkinOpen(false);
        } else {
          setIsSettingsOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSkinOpen]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0f1117]">
      {isLoading && <LoadingScreen />}

      {isInMenu ? (
        <MainMenu />
      ) : (
        <>
          <div className="absolute inset-0">
            <TrainingGround />
          </div>

          {!isLoading && !isSettingsOpen && !isSkinOpen && (
            <>
              <HUD />
              <ModeSelect />
              <TutorialPanel />
              <DamageNumbers />
              <PerformancePanel />
              <PointerLockHint />
            </>
          )}

          {!isLoading && (
            <>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="pointer-events-auto fixed right-5 top-20 z-40 rounded-none border border-gray-700 bg-gray-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 backdrop-blur-sm transition-colors hover:border-orange-500 hover:text-white"
              >
                设置 [ESC]
              </button>
              <button
                onClick={() => setIsSkinOpen(true)}
                className="pointer-events-auto fixed right-5 top-28 z-40 rounded-none border border-gray-700 bg-gray-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 backdrop-blur-sm transition-colors hover:border-orange-500 hover:text-white"
              >
                皮肤
              </button>
            </>
          )}

          {isGameOver && <ResultScreen />}
          <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
          <SkinPanel isOpen={isSkinOpen} onClose={() => setIsSkinOpen(false)} />
        </>
      )}
    </div>
  );
}
