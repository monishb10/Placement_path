import {javaQuestions} from './java';
import {patternQuestions} from './patterns';
import {structureQuestions} from './structures';
import {advancedQuestions} from './advanced';
import {aptitudeQuestions} from './aptitude';
import {placementQuestions} from './placement';
import {careerQuestions} from './career';
import type {Question} from './types';

export const questionBanks: Record<string, Question[]> = {
  ...javaQuestions, ...patternQuestions, ...structureQuestions,
  ...advancedQuestions, ...aptitudeQuestions, ...placementQuestions, ...careerQuestions,
};
