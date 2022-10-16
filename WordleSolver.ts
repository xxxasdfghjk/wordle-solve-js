import { exit } from "process"

const fs = require('fs')
const reader = require('readline')

type CharStatus = 'NON_EXIST' | 'EXIST' | 'CONFIRM'
const allWordListPath = "./resource/wordlist_all"
const hiddenWordListPath = "./resource/wordlist_hidden"
const allWordList = fs.readFileSync(allWordListPath).toString().split("\n")
const hiddenWordList = fs.readFileSync(hiddenWordListPath).toString().split("\n")
const submitWord = (inputWord: string, answerWord: string): Array<[string, CharStatus, number]> => {
    return inputWord.split('').map((char, index) => {
        return answerWord[index] == inputWord[index] ? [char, 'CONFIRM', index]
            : answerWord.includes(char) ? [char, 'EXIST', index]
                : [char, 'NON_EXIST', index]
    })
}

const diffWord = (inputWord: string, answerWord: string): Array<CharStatus> => {
    return inputWord.split('').map((char, index) => {
        return answerWord[index] == inputWord[index] ? 'CONFIRM'
            : answerWord.includes(char) ? 'EXIST'
                : 'NON_EXIST'
    })
}

const convertCurrentStatusArray = (charStatusArray: CharStatus[]): string => {
    return charStatusArray.map((charStatus) => {
        switch (charStatus) {
            case 'CONFIRM':
                return '1'
            case 'EXIST':
                return '2'
            case 'NON_EXIST':
                return '3'
        }
    }).join()
}

const excluedeWord = (wordList: string[], result: Array<[string, CharStatus, number]>) => {
    let resultList = wordList
    for (const [char, status, index] of result) {
        switch (status) {
            case 'CONFIRM':
                resultList = resultList.filter((word) => word[index] == char)
                break
            case 'EXIST':
                resultList = resultList.filter((word) => word.includes(char))
                resultList = resultList.filter((word) => word[index] != char)
                break
            case 'NON_EXIST':
                resultList = resultList.filter((word) => !word.includes(char))
                break
        }
    }
    return resultList
}
const calcEntropy = (prohability: { [k: string]: number }) => {
    let length = 0
    for (const value of Object.values(prohability)) {
        length += value
    }
    let sum = 0
    for (const value of Object.values(prohability)) {
        sum += - (value / length) * Math.log2(value / length)
    }
    return sum
}
const getInfoProfit = (answerableWord: string, submittedWords: Array<[string, CharStatus, number]>): number => {
    let res = 0
    answerableWord.split("").forEach((value, index) => {
        if (submittedWords.filter((elem) => elem[0] == value && elem[1] == 'CONFIRM' && elem[2] == index).length >= 1) {
            res = res - 1.0;
        }
        if (submittedWords.filter((elem) => elem[0] == value && elem[1] == 'NON_EXIST').length >= 1) {
            res = res - 1.0;
        }
        if (submittedWords.filter((elem) => elem[0] == value).length == 0) {
            res = res + 0.5;
        }
    })
    return res
}

const selectWord = (restWordList: string[], answerableWordList: string[], submittedResult: Array<[string, CharStatus, number]>, isFirst?: boolean,): string => {
    if (isFirst)
        return "soare"
    if (restWordList.length <= 2) return restWordList[0];
    const wordRank: Array<{ "entropy": number, answerableWord: string, infoProfit: number }> = []
    for (const answerableWord of answerableWordList) {
        const stateObj: { [k: string]: number } = {}
        for (const restWord of restWordList) {
            const statusString: string = convertCurrentStatusArray(diffWord(answerableWord, restWord))
            stateObj[statusString] = (stateObj[statusString] || 0) + 1
        }
        const infoProfit = getInfoProfit(answerableWord, submittedResult)
        wordRank.push({ "entropy": calcEntropy(stateObj), answerableWord, infoProfit })
    }
    wordRank.sort((p1, p2) =>
        p2.entropy - p1.entropy
    )
    return wordRank[0].answerableWord
}


const isEnd = (charStatusArray: Array<[string, CharStatus, number]>) => {
    return charStatusArray.every((status) => status[1] == 'CONFIRM')
}
const solve = (restWordList: string[], answerWord: string, selectableWords: string[]): Array<string> => {
    let tryNum = 0;
    const tryWords: Array<string> = []
    const submittedResult: Array<[string, CharStatus, number]> = []
    while (true) {
        const submitString = selectWord(restWordList, selectableWords, submittedResult, tryNum == 0)
        tryWords.push(submitString)
        tryNum++;
        const result = submitWord(submitString, answerWord)
        submittedResult.push(...result)
        if (isEnd(result) || tryNum >= 11) {
            return tryWords
        }
        // selectableWords = excluedeWord(restWordList.filter((elem) => elem != submitString), result)
        selectableWords = selectableWords.filter((elem) => elem != submitString)
        restWordList = excluedeWord(restWordList.filter((elem) => elem != submitString), result)
    }


}

const allTest = () => {
    let sum = 0
    for (const word of hiddenWordList) {
        const tryWords = solve(hiddenWordList, word, allWordList)
        sum += tryWords.length
        console.log(tryWords.join(","))
    }
}

const singleTest = (word: string) => {
    const tryWords = solve(hiddenWordList, word, allWordList)
    console.log(tryWords)
}
allTest()