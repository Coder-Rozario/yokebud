import React, { useState } from 'react'
import styles from './Newsletter.module.scss'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setMessage('Please enter a valid email address.')
      return
    }

    try {
      // Replace with actual API call
      // const response = await axios.post('/https://api.yokebud.com/api/subscribers', { email })
      setMessage('Thank you for subscribing!')
      setEmail('')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Subscription failed. Please try again.')
    }
  }

  return (
    <div className={styles.newsletter}>
      <input
        id="emailInput"
        type="email"
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleSubscribe}>Subscribe</button>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  )
}

export default Newsletter