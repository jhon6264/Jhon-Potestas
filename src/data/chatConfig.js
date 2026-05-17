import { site } from './site'

const firstName = site.name.split(' ')[0]

export const chatConfig = {
  firstName,
  ownerName: site.name,
  displayName: `Chat with ${firstName}`,
  avatar: '/assets/profile/Day.png',
  maxMessageLength: 1000,
  title: `Chat with ${firstName}`,
  hint: 'Ask me about Programming',
  introMessage:
    "Hi, I'm Jhon's AI. Ask me about my resume, projects, skills, or programming.",
}
