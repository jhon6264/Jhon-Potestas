import { site } from './site'

const firstName = site.name.split(' ')[0]

export const chatConfig = {
  firstName,
  displayName: site.name,
  avatar: '/assets/profile/Day.png',
  maxMessageLength: 1000,
  title: `Chat with ${firstName}`,
  hint: 'Ask me about programming, web dev, or tech!',
  introMessage:
    'Hi there! Thanks for visiting my website. Feel free to ask me anything about programming, web development, or my experiences in tech. Let me know how I can help!',
}
