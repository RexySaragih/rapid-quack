var _a;
import { WordDifficulty } from '../types/word';
import { easyWords } from './fallbackWords/easy';
import { normalWords } from './fallbackWords/normal';
import { hardWords } from './fallbackWords/hard';
import { expertWords } from './fallbackWords/expert';
import { duckapocalypseWords } from './fallbackWords/duckapocalypse';
var FALLBACK_WORDS = (_a = {},
    _a[WordDifficulty.EASY] = easyWords,
    _a[WordDifficulty.NORMAL] = normalWords,
    _a[WordDifficulty.HARD] = hardWords,
    _a[WordDifficulty.EXPERT] = expertWords,
    _a[WordDifficulty.DUCKAPOCALYPSE] = duckapocalypseWords,
    _a);
var WordGenerator = /** @class */ (function () {
    function WordGenerator() {
        this.cachedWords = new Map();
        this.isInitialized = false;
        // Private constructor for singleton
    }
    WordGenerator.getInstance = function () {
        if (!WordGenerator.instance) {
            WordGenerator.instance = new WordGenerator();
        }
        return WordGenerator.instance;
    };
    WordGenerator.prototype.getRandomWord = function (difficulty) {
        // Get words for the specified difficulty
        var words = FALLBACK_WORDS[difficulty];
        if (!words || words.length === 0) {
            console.error("No words available for difficulty: ".concat(difficulty));
            return this.getFallbackWord(difficulty);
        }
        // Select a random word
        var word = words[Math.floor(Math.random() * words.length)];
        return {
            word: word,
            difficulty: difficulty,
            points: this.calculatePoints(word, difficulty),
        };
    };
    WordGenerator.prototype.getFallbackWord = function (difficulty) {
        // Use a simple word as fallback
        var fallbackWord = 'duck';
        return {
            word: fallbackWord,
            difficulty: difficulty,
            points: this.calculatePoints(fallbackWord, difficulty),
        };
    };
    WordGenerator.prototype.calculatePoints = function (word, difficulty) {
        var _a;
        var basePoints = (_a = {},
            _a[WordDifficulty.EASY] = 10,
            _a[WordDifficulty.NORMAL] = 20,
            _a[WordDifficulty.HARD] = 30,
            _a[WordDifficulty.EXPERT] = 50,
            _a[WordDifficulty.DUCKAPOCALYPSE] = 100,
            _a);
        // Calculate bonus points based on word length
        var lengthBonus = Math.floor(word.length * 2);
        return basePoints[difficulty] + lengthBonus;
    };
    WordGenerator.prototype.getDifficultyInfo = function (difficulty) {
        var _a;
        var difficultyInfo = (_a = {},
            _a[WordDifficulty.EASY] = {
                color: '#4ade80', // green
                minWordLength: 3,
                maxWordLength: 5,
            },
            _a[WordDifficulty.NORMAL] = {
                color: '#60a5fa', // blue
                minWordLength: 6,
                maxWordLength: 8,
            },
            _a[WordDifficulty.HARD] = {
                color: '#f472b6', // pink
                minWordLength: 9,
                maxWordLength: 12,
            },
            _a[WordDifficulty.EXPERT] = {
                color: '#7c3aed', // purple
                minWordLength: 13,
                maxWordLength: 18,
            },
            _a[WordDifficulty.DUCKAPOCALYPSE] = {
                color: '#ef4444', // red
                minWordLength: 19,
                maxWordLength: 100,
            },
            _a);
        return difficultyInfo[difficulty];
    };
    return WordGenerator;
}());
export var wordGenerator = WordGenerator.getInstance();
