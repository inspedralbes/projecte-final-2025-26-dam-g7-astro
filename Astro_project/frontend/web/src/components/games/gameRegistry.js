import RadarScan from './RadarScan.vue';
import RadioSignal from './RadioSignal.vue';
import RhymeSquad from './RhymeSquad.vue';
import SpelledRosco from './SpelledRosco.vue';
import SymmetryBreaker from './SymmetryBreaker.vue';
import WordConstruction from './WordConstruction.vue';

export const gameComponents = Object.freeze({
  RadarScan,
  RadioSignal,
  RhymeSquad,
  SpelledRosco,
  SymmetryBreaker,
  WordConstruction
});

export const availableGameNames = Object.freeze(Object.keys(gameComponents));
