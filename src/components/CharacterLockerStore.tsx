import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CHARACTERS } from '../data/characters';
import { CharacterItem } from '../types';
import { PlayerCoverFlowCarousel } from './PlayerCoverFlowCarousel';
import { sounds } from '../utils/audio';
import { Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const CharacterLockerStore: React.FC = () => {
  const { user, unlockCharacter, equipCharacter } = useAuth();
  const { t } = useLanguage();

  const [selectedCharId, setSelectedCharId] = useState<string>(
    user?.equippedCharacterId || CHARACTERS[0].id
  );

  const selectedChar = CHARACTERS.find((c) => c.id === selectedCharId) || CHARACTERS[0];

  const handleBuyOrEquipChar = (char: CharacterItem) => {
    sounds.playKeyClick();
    if (user?.unlockedCharacters.includes(char.id)) {
      equipCharacter(char.id);
      sounds.playCorrect();
    } else {
      if ((user?.coins ?? 0) >= char.price) {
        const success = unlockCharacter(char.id, char.price);
        if (success) {
          sounds.playUnlock();
          try {
            confetti({
              particleCount: 90,
              spread: 75,
              origin: { y: 0.55 },
              colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#10b981', '#ffffff']
            });
          } catch {}
        }
      } else {
        sounds.playWrong();
      }
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Header Presentation Banner */}
      <div className="relative overflow-hidden bg-neutral-900 border-3 border-neutral-900 rounded-3xl p-5 sm:p-8 shadow-[0_8px_0_0_#171717] text-white">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400 text-neutral-950 rounded-xl text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-neutral-950" />
              <span>
                {t(
                  `3D Cover Flow Showcase • ${CHARACTERS.length} Official Football Stars`,
                  `عرض ثلاثي الأبعاد • ${CHARACTERS.length} نجم كرة قدم`
                )}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              {t('Football Players Showcase ⚽', 'معرض نجوم كرة القدم ⚽')}
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-neutral-400 max-w-xl">
              {t(
                'Navigate between cards using keyboard arrows (← / →), swipe, or click any card on the sides. Equip your star player for math arena exams!',
                'تصفح البطاقات بالأسهم أو السحب، واجمع العملات لفتح وتجهيز نجمك المفضل!'
              )}
            </p>
          </div>

          <div className="px-4 py-2.5 bg-neutral-800 border-2 border-neutral-700 rounded-2xl flex items-center gap-2 font-mono font-black text-amber-400 shadow-sm shrink-0">
            <span className="text-xs text-neutral-400 uppercase">{t('Your Coins:', 'عملاتك:')}</span>
            <span className="text-lg text-white font-black" dir="ltr">
              🪙 {user?.coins.toLocaleString() ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* 3D Cover Flow Carousel */}
      <PlayerCoverFlowCarousel
        characters={CHARACTERS}
        selectedId={selectedChar.id}
        onSelect={(char) => setSelectedCharId(char.id)}
        onEquipOrBuy={handleBuyOrEquipChar}
        userCoins={user?.coins ?? 0}
        unlockedIds={user?.unlockedCharacters ?? []}
        equippedId={user?.equippedCharacterId ?? ''}
      />
    </div>
  );
};
