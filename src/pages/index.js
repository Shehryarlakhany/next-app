import Head from 'next/head'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useEffect, useState } from 'react'

const base64ToUint8Array = base64 => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(b64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function Home() {

  const [isSubscribed, setIsSubscribed] = useState(false)
  console.log('Home => isSubscribed:', isSubscribed)
  const [subscription, setSubscription] = useState(null)
  console.log('Home => subscription:', subscription)
  const [registration, setRegistration] = useState(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
      console.log('here')
      // run only in browser
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          if (sub && !(sub.expirationTime && Date.now() > sub.expirationTime - 24 * 60 * 60 * 1000)) {
            setSubscription(sub)
            setIsSubscribed(true)
          }
        })
        console.log(reg);
        setRegistration(reg)
      })
    }
  }, [])

  const subscribeButtonOnClick = async event => {
    // event.preventDefault()
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY),
    })
    // TODO: you should call your API to save subscription data on server in order to send web push notification from server
    setSubscription(sub)
    await fetch('/api/save_subscription', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        subscription: sub
      })
    })
    setIsSubscribed(true)
    console.log('web push subscribed!')
    console.log(sub)
  }

  const unsubscribeButtonOnClick = async event => {
    event.preventDefault()
    await subscription.unsubscribe()
    // TODO: you should call your API to delete or invalidate subscription data on server
    setSubscription(null)
    setIsSubscribed(false)
    console.log('web push unsubscribed!')
  }

  const sendNotificationButtonOnClick = async event => {
    event.preventDefault()
    if (subscription == null) {
      console.error('web push not subscribed')
      return
    }

    await fetch('/api/notification', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        subscription
      })
    })
  }

  return (
    <>
      <Head>
        <title>Ask Permisssion</title>
      </Head>
      <h1>Ask Permisssion</h1>
      <button onClick={() => subscribeButtonOnClick()} disabled={isSubscribed}>
        Subscribe
      </button>
    </>
  )
}
