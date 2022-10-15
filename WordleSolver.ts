import { exit } from "process"

const fs = require('fs')
const reader = require('readline')

const ANSWER_WORD = "buxom"
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

const excluedeWord = (wordList: string[], result: Array<[string, CharStatus, number]>, answerWord: string) => {
    var resultList = wordList
    for (const [char, status, index] of result) {
        switch (status) {
            case 'CONFIRM':
                resultList = resultList.filter((word) => word[index] == char)
                break
            case 'EXIST':
                resultList = resultList.filter((word) => word.includes(char))
                break
            case 'NON_EXIST':
                resultList = resultList.filter((word) => !word.includes(char))
                break
        }
    }
    return resultList
}
const calcEntropy = (prohability: {}) => {
    const length = Object.keys(prohability).length
    let sum = 0
    for (const value of Object.values(prohability)) {
        if (typeof value === 'number')
            sum += - (value / length) * Math.log2(value / length)
    }
    return sum
}
const selectWord = (restWordList: string[], answerableWordList: string[], isFirst?: boolean): string => {
    if (isFirst)
        return "soare"
    if (restWordList.length <= 2) return restWordList[0];
    const list = answerableWordList.map((word) => {
        return {
            "entropy": calcEntropy(
                restWordList.map((restWord) => diffWord(word, restWord))
                    .map(convertCurrentStatusArray)
                    .reduce((previousValue: { [k: string]: number }, currentValue: string) => {
                        previousValue[currentValue] = (previousValue[currentValue] || 0) + 1
                        return previousValue
                    }, {}))
            , word
        }
    }).sort((p1, p2) => p2.entropy - p1.entropy)
    return list[0].word
}
const isEnd = (charStatusArray: Array<[string, CharStatus, number]>) => {
    return charStatusArray.every((status) => status[1] == 'CONFIRM')
}
const solve = (restWordList: string[], answerWord: string, submittedWord?: string) => {
    const submitString = selectWord(restWordList, allWordList)
    const result = submitWord(submitString, answerWord)
    if (isEnd(result)) {
        console.log(`answer = ${submitString}`)
        return
    }
    console.log(submitString)
    solve(excluedeWord(restWordList, result, answerWord), answerWord, submitString)
}

solve(hiddenWordList, ANSWER_WORD)