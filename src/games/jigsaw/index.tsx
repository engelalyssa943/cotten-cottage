import { lazy } from 'react';
import type { CollectibleDef, GameModule } from '../../engine/types';
import { PIC_H, PIC_W, Scene, SCENES, SCENE_NAME, type SceneId } from './scenes';

const STORY: Record<SceneId, string> = {
  garden: 'Every flower went back exactly where it grew.',
  pond: 'The fish waited patiently while you put the water back together.',
  night: 'You found every star and set them all back in the sky.',
};

function sceneCard(id: SceneId): CollectibleDef {
  return {
    id: `jigsaw:${id}`,
    title: SCENE_NAME[id],
    story: STORY[id],
    themes: ['building', 'cute'],
    Art: ({ found, className }) => (
      <div
        className={className}
        style={{
          display: 'grid',
          placeItems: 'center',
          filter: found ? undefined : 'grayscale(1) opacity(0.4)',
        }}
      >
        <svg viewBox={`0 0 ${PIC_W} ${PIC_H}`} width={104} height={69} style={{ borderRadius: 8 }} aria-hidden>
          <Scene id={id} />
        </svg>
      </div>
    ),
  };
}

/** Four pieces, one still out. */
const JigsawIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden fill="currentColor">
    <path d="M8 8 h20 v8 a5 5 0 0 0 8 0 V8 h20 v20 h-8 a5 5 0 0 0 0 8 h8 v20 H36 v-8 a5 5 0 0 0-8 0 v8 H8 V36 h8 a5 5 0 0 0 0-8 H8 Z" opacity="0.45" />
    <path d="M8 8 h20 v8 a5 5 0 0 0 8 0 V8 h8 v20 h-8 a5 5 0 0 0 0 8 h8 v8 H36 v-8 a5 5 0 0 0-8 0 v8 H8 Z" />
  </svg>
);

const jigsaw: GameModule = {
  id: 'jigsaw',
  title: 'Jigsaw',
  rooms: ['workshop'],
  bands: ['bloom', 'star'],
  themes: ['building', 'cute'],
  Icon: JigsawIcon,
  Game: lazy(() => import('./Game')),
  collectibles: SCENES.map(sceneCard),
};

export default jigsaw;
