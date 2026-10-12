import type { StudySet } from './types';
import { uid } from './utils';

const DEMO: { term: string; definition: string; distractors: string[] }[] = [
  {
    term: 'Photosynthesis',
    definition:
      'The process plants use to turn light energy, water and carbon dioxide into glucose and oxygen.',
    distractors: [
      'The process cells use to break glucose down and release usable energy.',
      'The movement of water from the roots up to the leaves.',
      'The division of one cell into two identical daughter cells.',
    ],
  },
  {
    term: 'Chlorophyll',
    definition:
      'The green pigment in chloroplasts that absorbs light energy for photosynthesis.',
    distractors: [
      'A protein that carries oxygen around in red blood cells.',
      'The rigid outer layer that surrounds plant cells.',
      'A sugar that stores energy in plant roots.',
    ],
  },
  {
    term: 'Chloroplast',
    definition: 'The organelle where photosynthesis takes place.',
    distractors: [
      'The organelle that produces most of the cell’s ATP.',
      'The organelle that stores water and nutrients in plant cells.',
      'The control center that holds the cell’s DNA.',
    ],
  },
  {
    term: 'Stomata',
    definition:
      'Tiny pores on leaves that let carbon dioxide in and oxygen out.',
    distractors: [
      'Root hairs that absorb water from the soil.',
      'Thick-walled cells that carry water up the stem.',
      'A waxy layer that stops leaves from drying out.',
    ],
  },
  {
    term: 'Light-dependent reactions',
    definition:
      'The stage in the thylakoid membranes that uses light to make ATP and NADPH and releases oxygen.',
    distractors: [
      'The stage that uses ATP to build glucose from carbon dioxide.',
      'The stage that breaks glucose down into pyruvate.',
      'The stage that copies DNA before a cell divides.',
    ],
  },
  {
    term: 'Calvin cycle',
    definition:
      'The light-independent stage in the stroma that uses ATP and NADPH to build glucose from carbon dioxide.',
    distractors: [
      'The stage that captures sunlight and splits water molecules.',
      'The cycle that releases energy from glucose in mitochondria.',
      'The cycle that moves nitrogen between soil and air.',
    ],
  },
  {
    term: 'Glucose',
    definition:
      'The sugar produced by photosynthesis that stores chemical energy.',
    distractors: [
      'The gas released through the stomata during photosynthesis.',
      'The pigment that gives leaves their green color.',
      'The molecule that carries energy inside cells as a short-term battery.',
    ],
  },
  {
    term: 'Thylakoid',
    definition:
      'Disc-shaped membrane sacs inside a chloroplast where light is captured.',
    distractors: [
      'The fluid-filled space around the grana in a chloroplast.',
      'The folded inner membrane of a mitochondrion.',
      'The large central vacuole of a plant cell.',
    ],
  },
  {
    term: 'Stroma',
    definition:
      'The fluid-filled space in a chloroplast where the Calvin cycle happens.',
    distractors: [
      'The stacks of membrane discs that capture light.',
      'The jelly-like material that fills the whole cell.',
      'The tube that carries sugar through the plant.',
    ],
  },
  {
    term: 'Carbon dioxide',
    definition:
      'The gas plants take in from the air and fix into sugar during photosynthesis.',
    distractors: [
      'The gas plants release as a by-product of photosynthesis.',
      'The most common gas in Earth’s atmosphere.',
      'The pigment that reflects green light.',
    ],
  },
];

export function createDemoSet(): StudySet {
  const now = Date.now();
  return {
    id: uid(),
    title: 'Photosynthesis basics (demo)',
    description: 'A ready-made set so you can try every study mode.',
    source: 'demo',
    createdAt: now,
    updatedAt: now,
    cards: DEMO.map((c) => ({ id: uid(), ...c })),
  };
}
