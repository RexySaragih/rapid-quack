export declare enum WordDifficulty {
    EASY = "easy",
    NORMAL = "normal",
    HARD = "hard",
    EXPERT = "expert",
    DUCKAPOCALYPSE = "duckapocalypse"
}
export interface WordData {
    word: string;
    difficulty: WordDifficulty;
    points: number;
}
export interface WordGeneratorConfig {
    minLength: number;
    maxLength: number;
    difficulty: WordDifficulty;
    count: number;
}
export interface WordList {
    [key: string]: string[];
}
