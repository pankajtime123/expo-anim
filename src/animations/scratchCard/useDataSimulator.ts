import { MutableRefObject, RefObject, useEffect, useRef, useState } from "react"
import { useOnce } from "../../hooks/useConstructor"

const randomMessages = [
    'Hi, nice video',
    'I like your video',
    'Nice gamepay',
    'Your voice is so amazing, are you a singer?',
    'mja aa gya bro, kya baat hai',
    'please play pubg',
    'please play minecraft',
    'Hey bro, I am your big fan',
    'Weather is very good today',
    'People are so good here',
    'Ram Ram ji',
]

const randomUsers = [
    {
        name: 'Rahul',
        dp: 'https://source.unsplash.com/random?' + 1
    },
    {
        name: 'Pankaj',
        dp: 'https://source.unsplash.com/random?' + 2
    },
    {
        name: 'Suresh',
        dp: 'https://source.unsplash.com/random?' + 3
    },
    {
        name: 'Pawar',
        dp: 'https://source.unsplash.com/random?' + 4
    },
    {
        name: 'Laxmiant Swami',
        dp: 'https://source.unsplash.com/random?' + 5
    },
    {
        name: 'Dharmendra',
        dp: 'https://source.unsplash.com/random?' + 6
    },
    {
        name: 'Eklavya',
        dp: 'https://source.unsplash.com/random?' + 7
    }
]

export type UserMessage = {
    id: string,
    name: string,
    dp: string,
    message: string,
}

const config = {
    maxMessagesToAppendAtOnce: 10,
    messageAppendInterval: 1000,
    maxDisplayMessages: 3000,
    thresoldToKeepBackScrollBackUp: 1000,
}

export const useDataSimulator = (isInteracting: RefObject<boolean>) => {

    const [userMessages, setUserMessages] = useState<UserMessage[]>([])
    let currMessages = useRef(userMessages).current;

    useEffect(()=>{
        let t2: any;
        let t = setInterval(()=>{ 
            let totalNewMessagesToAppend = Math.floor(Math.random() * config.maxMessagesToAppendAtOnce)
            let len = currMessages.length
            for(let i = 0; i < totalNewMessagesToAppend; i++){
                let randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)]
                let randomMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)]
                currMessages.push({
                    id: (len + i).toString(),
                    name: randomUser.name,
                    dp: randomUser.dp,
                    message: randomMessage
                })
            }
            if(isInteracting.current) return;
            setUserMessages([...currMessages])
            if(currMessages.length > config.maxDisplayMessages){
                t2 = setTimeout(() => {
                    currMessages.slice(-config.thresoldToKeepBackScrollBackUp);
                    setUserMessages([...currMessages])
                }, 100);
            }

        }, config.messageAppendInterval)
        return ()=>{
            clearInterval(t)
            clearTimeout(t2)
        }
    }, [])

    return userMessages
}
