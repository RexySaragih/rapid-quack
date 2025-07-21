import { WordDifficulty, WordData } from '../types/word';
declare class WordGenerator {
    private static instance;
    private cachedWords;
    private isInitialized;
    private constructor();
    static getInstance(): WordGenerator;
    getRandomWord(difficulty: WordDifficulty): WordData;
    private getFallbackWord;
    private calculatePoints;
    getDifficultyInfo(difficulty: WordDifficulty): {
        color: string;
        minWordLength: number;
        maxWordLength: number;
    } | {
        color: string;
        minWordLength: number;
        maxWordLength: number;
    } | {
        color: string;
        minWordLength: number;
        maxWordLength: number;
    } | {
        color: string;
        minWordLength: number;
        maxWordLength: number;
    } | {
        color: string;
        minWordLength: number;
        maxWordLength: number;
    };
}
export declare const wordGenerator: WordGenerator;
export {};
