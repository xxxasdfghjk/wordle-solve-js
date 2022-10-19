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
    } else if (newRestWordList.length == 1) {
        return { isEnd: true, nextString: newRestWordList[0], isInvalid: false, restWordList: newRestWordList }
    } else {
        return { isEnd: false, nextString: selectWord(newRestWordList, selectableWords, false), isInvalid: false, restWordList: newRestWordList }
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

const singleTest = async (word: string) => {
    const allWordList = (await (await fetch(allWordsURL)).text()).split('\n')
    const hiddenWordList = (await (await fetch(hiddenWordsURL)).text()).split('\n')
    const tryWords = solve(hiddenWordList, word, allWordList)
}

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

const message = "No answer exists."
const Balloon = (props: { message: string }) => {
    return (<div className={style.balloon}>{props.message}</div>)
}

const SubmitButton = (props: { onClick: () => void, isValid: boolean, showNoticeBalloon: boolean, buttonMessage: string }) => {
    return (<div className={style.buttonWrapper}>
        <button className={classNames(props.isValid && style.canSubmit)} onClick={props.onClick}>{props.buttonMessage}</button>
        {props.showNoticeBalloon &&
            <Balloon message={message} />}
    </div>)
}

const makeWordleResult = (str: string, states: Array<CharStatus>): wordleResult => {
    return states.map((status: CharStatus, index: number) => { return { index, status, char: str[index] } })
}

const allWordsURL = "https://raw.githubusercontent.com/techtribeyt/Wordle/main/wordle_guesses.txt"
const hiddenWordsURL = "https://raw.githubusercontent.com/techtribeyt/Wordle/main/wordle_answers.txt"

const wordLength = 5
const displaySize = 6
const firstWord = "soare";
const WordleSolver = (props: {}) => {
    const [stringState, setStringState] = useState<Array<Array<CharStatus>>>([]);
    const [allWordsList, setSelectableAllWordsList] = useState<string[]>([])
    const [hiddenWordsList, setHiddenAllWordsList] = useState<Array<string[]>>([])
    const [canEditState, setCanEditState] = useState<Array<boolean>>([]);
    const [submittedNum, setSubmittedNum] = useState(1)
    const [submittedString, setSubmittedString] = useState<Array<string>>([])
    const [noticeBalloonState, setNoticeBalloonState] = useState<Array<boolean>>([])

    useEffect(() => {
        const setTextData = async () => {
            const allWordList = await (await fetch(allWordsURL)).text()
            const hiddenWordList = await (await fetch(hiddenWordsURL)).text()
            setSelectableAllWordsList(allWordList.split("\n"))
            setHiddenAllWordsList([hiddenWordList.split("\n")])
            setCanEditState(' '.repeat(displaySize).split("").map((_, index) => index == 0 ? true : false))
            setStringState(' '.repeat(1).split("").map(() => ' '.repeat(wordLength).split("").map(() => 'NON_EXIST')))
            setSubmittedString(['soare'])
            setNoticeBalloonState(' '.repeat(displaySize).split("").map((_, index) => false))
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
                if (stringState[index].every((e) => e == 'CONFIRM')) {
                    setNoticeBalloonState(' '.repeat(displaySize).split("").map((value, i) => false))

                    return
                }
                const { isEnd, nextString, isInvalid, restWordList } = nextWord(hiddenWordsList[index], allWordsList, submittedNum +
                    1, makeWordleResult(submittedString[index], stringState[index]))
                if (isInvalid) {
                    setNoticeBalloonState(' '.repeat(displaySize).split("").map((value, i) => i == index))
                    setCanEditState(' '.repeat(displaySize).split("").map((_, i) => i <= index ? true : false))
                    setStringState([...stringState.slice(0, index + 1)])

                } else if (isEnd) {
                    setStringState([...stringState.slice(0, index + 1), ' '.repeat(wordLength).split("").map(() => 'CONFIRM')])
                    setCanEditState(' '.repeat(displaySize).split("").map((_, i) => i <= index ? true : false))
                    setNoticeBalloonState(' '.repeat(displaySize).split("").map((value, i) => false))
                } else {
                    setStringState([...stringState.slice(0, index + 1), ' '.repeat(wordLength).split("").map(() => 'NON_EXIST')])
                    setCanEditState(' '.repeat(displaySize).split("").map((_, i) => i <= index + 1 ? true : false))
                    setNoticeBalloonState(' '.repeat(displaySize).split("").map((value, i) => false))
                }

                setHiddenAllWordsList([...hiddenWordsList.slice(0, index + 1), [...restWordList]])
                setSubmittedString([...submittedString.slice(0, index + 1), nextString])
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
                <SubmitButton
                    onClick={buttonClick(row)}
                    isValid={canEditState[row]}
                    showNoticeBalloon={noticeBalloonState?.[row]}
                    buttonMessage={canEditState[row] ? "SUBMIT" : ""} />
            </WordDisplay>)}
    </div>)
}

export default WordleSolver;
