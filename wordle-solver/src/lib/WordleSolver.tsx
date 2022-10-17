import React, { Children, ReactNode, useEffect, useState } from 'react'
import style from './WordleSolver.module.css'
import classNames from 'classnames'
import { JsxElement } from 'typescript'
const file = require("./resource/wordlist_all")
type CharStatus = 'NON_EXIST' | 'EXIST' | 'CONFIRM' | 'NO_INFO'
type wordleResult = Array<{ index: number, status: CharStatus, char: string }>
const allWordListPath = "./../../public/resource/wordlist_all"
const hiddenWordListPath = "./../../public/resource/wordlist_hidden"
const submitWord = (inputWord: string, answerWord: string): wordleResult => {
    return inputWord.split('').map((char, index) => {
        return answerWord[index] == inputWord[index] ? { char, status: 'CONFIRM', index }
            : answerWord.includes(char) ? { char, status: 'EXIST', index }
                : { char, status: 'NON_EXIST', index }
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

const excludeWord = (wordList: string[], result: wordleResult) => {
    let resultList = wordList
    for (const obj of result) {
        const { index, status, char } = obj
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
const calcEntropy = (probability: { [k: string]: number }) => {
    let length = 0
    for (const value of Object.values(probability)) {
        length += value
    }
    let sum = 0
    for (const value of Object.values(probability)) {
        sum += - (value / length) * Math.log2(value / length)
    }
    return sum
}

const selectWord = (restWordList: string[], answerableWordList: string[], isFirst?: boolean): string => {
    if (isFirst)
        return "soare"
    if (restWordList.length <= 2) return restWordList[0];
    const wordRank: Array<{ "entropy": number, answerableWord: string }> = []
    for (const answerableWord of answerableWordList) {
        const stateObj: { [k: string]: number } = {}
        for (const restWord of restWordList) {
            const statusString: string = convertCurrentStatusArray(diffWord(answerableWord, restWord))
            stateObj[statusString] = (stateObj[statusString] || 0) + 1
        }
        wordRank.push({ "entropy": calcEntropy(stateObj), answerableWord })
    }
    wordRank.sort((p1, p2) =>
        p2.entropy - p1.entropy
    )
    return wordRank[0].answerableWord
}


const isEnd = (charStatusArray: wordleResult) => {
    return charStatusArray.every((status) => status.status == 'CONFIRM')
}

type wordleProps = { restWordList: string[], selectableWords: string[], result: Array<CharStatus>, submittedWords: string[], tryNum: Number }
type wordleOutput = { isEnd: boolean, nextString: string, isInvalid: boolean, restWordList: string[] }

const nextWord = (restWordList: string[], selectableWords: string[], tryNum: number, result: wordleResult): wordleOutput => {
    const newRestWordList = excludeWord(restWordList, result)
    if (newRestWordList.length == 0) {
        return { isEnd: true, nextString: '     ', isInvalid: true, restWordList: newRestWordList }
    } else if (restWordList.length == 1) {
        return { isEnd: true, nextString: restWordList[0], isInvalid: false, restWordList: newRestWordList }
    } else {
        return { isEnd: false, nextString: selectWord(restWordList, selectableWords, tryNum == 0), isInvalid: true, restWordList: newRestWordList }
    }
}

const solve = (restWordList: string[], answerWord: string, selectableWords: string[]): Array<string> => {
    let tryNum = 0;
    const tryWords: Array<string> = []
    while (true) {
        const submitString = selectWord(restWordList, selectableWords, tryNum == 0)
        tryWords.push(submitString)
        tryNum++;
        const result = submitWord(submitString, answerWord)
        if (isEnd(result) || tryNum >= 11) {
            return tryWords
        }
        // selectableWords = excludeWord(restWordList.filter((elem) => elem != submitString), result)
        restWordList = excludeWord(restWordList, result)
    }
}

// const allTest = () => {
//     let sum = 0
//     for (const word of hiddenWordList) {
//         const tryWords = solve(hiddenWordList, word, allWordList)
//         sum += tryWords.length
//         console.log(tryWords.join(","))
//     }
// }

// const singleTest = (word: string) => {
//     const tryWords = solve(hiddenWordList, word, allWordList)
//     console.log(tryWords)
// }


const charStyleName = (status: CharStatus) => {
    switch (status) {
        case 'NON_EXIST':
            return 'char-non-exist'
        case 'EXIST':
            return 'char-exist'
        case 'CONFIRM':
            return 'char-confirm'
        default:
            return 'char-no-info'
    }
}

const nextState = (status: CharStatus) => {
    switch (status) {
        case 'NON_EXIST':
            return 'EXIST'
        case 'EXIST':
            return 'CONFIRM'
        case 'CONFIRM':
            return 'NON_EXIST'
        default:
            return 'NON_EXIST'
    }
}

const WordBox = (props: { char: string, status: CharStatus, onClick: () => void }) => {
    return (<div className={classNames(style.box)}>
        <div className={classNames(style['inner-block'], style[charStyleName(props.status)])} onClick={props.onClick}>
            {props.char}
        </div></div>)
}

const WordDisplay = (props: { words: string, children: ReactNode, charStates: Array<CharStatus>, onClickBox: (index: number) => () => void }) => {
    return (<div className={style.display}>
        {props.words.split('').map((char, index) => {
            return (<WordBox char={char} status={props.charStates?.[index] ?? 'NO_INFO'} onClick={props.onClickBox(index)} />)
        })}
        {props.children}
    </div>)
}

const SubmitButton = (props: { onClick: () => void, isValid: boolean }) => {
    return <button onClick={props.onClick}></button>
}

const makeWordleResult = (str: string, states: Array<CharStatus>): wordleResult => {
    return states.map((status: CharStatus, index: number) => { return { index, status, char: str[index] } })
}


const wordLength = 5
const displaySize = 6
const firstWord = "soare";
const WordleSolver = (props: {}) => {
    const [stringState, setStringState] = useState<Array<Array<CharStatus>>>([]);
    const [allWordsList, setSelectableAllWordsList] = useState<string[]>([])
    const [hiddenWordsList, setHiddenAllWordsList] = useState<string[]>([])
    const [canEditState, setCanEditState] = useState<Array<boolean>>([]);
    const [submittedNum, setSubmittedNum] = useState(0)
    const [submittedString, setSubmittedString] = useState<Array<string>>([])
    useEffect(() => {
        const setTextData = async () => {
            const allWordList = await (await fetch("https://raw.githubusercontent.com/techtribeyt/Wordle/main/wordle_answers.txt")).text()
            const hiddenWordList = await (await fetch("https://raw.githubusercontent.com/techtribeyt/Wordle/main/wordmaster_guesses.txt")).text()
            setSelectableAllWordsList(allWordList.split("\n"))
            setHiddenAllWordsList(hiddenWordList.split("\n"))
            setCanEditState(' '.repeat(displaySize).split("").map((_, index) => index == 0 ? true : false))
            setStringState(' '.repeat(displaySize).split("").map(() => ' '.repeat(wordLength).split("").map(() => 'NON_EXIST')))
            setSubmittedString(['soare'])
        }
        setTextData()
    }, [])

    const onClickBox = (row: number) => {
        return (index: number) => {
            return () => {
                if (canEditState[row]) {
                    const newStringState = stringState;
                    newStringState[row][index] = nextState(newStringState[row][index])
                    setStringState([...newStringState])
                }
            }
        }
    }
    const buttonClick = (index: number) => {
        return () => {
            if (canEditState[index]) {
                const { isEnd, nextString, isInvalid, restWordList } = nextWord(hiddenWordsList, allWordsList, submittedNum + 1, makeWordleResult(submittedString[index], stringState[index]))
                console.log(nextString, isEnd);
                console.log(makeWordleResult(submittedString[index], stringState[index]))
                if (isEnd) {
                    const allGreen: CharStatus[] = ' '.repeat(wordLength).split("").map(() => 'CONFIRM')
                    const newStringState = stringState;
                    newStringState[index + 1] = allGreen;
                    setStringState([...newStringState])
                    const newCanEditState = ' '.repeat(wordLength).split("").map(() => false)
                    setCanEditState(newCanEditState)
                    setSubmittedString([...submittedString, nextString])
                    console.log("finished")

                } else {
                    setHiddenAllWordsList(restWordList)
                    const newCanEditState = ' '.repeat(wordLength).split("").map((_, i) => i == index + 1 ? true : false)
                    setCanEditState(newCanEditState)
                    setSubmittedString([...submittedString, nextString])
                }
            }
        }
    }
    return (<div className={style.container}>
        {Array.apply(null, Array(displaySize)).map((_, row) =>
            <WordDisplay
                words={submittedString?.[row]?.toUpperCase() ?? ' '.repeat(wordLength)}
                onClickBox={onClickBox(row)}
                charStates={stringState[row]}
            >
                <SubmitButton onClick={buttonClick(row)} isValid={canEditState[row]} />
            </WordDisplay>)}
    </div>)
}

export default WordleSolver;

