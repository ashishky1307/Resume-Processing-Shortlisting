'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserIcon,
  CpuChipIcon,
  XMarkIcon,
  ClockIcon,
  UsersIcon,
  SparklesIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { chatApi, type ChatMessage, type ChatResponse, type ChatSession } from '../src/lib/api'

interface ChatBotProps {
  className?: string
}

export default function ChatBot({ className = '' }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [showSessions, setShowSessions] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])
  // Load user sessions when chat opens
  useEffect(() => {
    if (isOpen && sessions.length === 0) {
      loadUserSessions()
    }
  }, [isOpen, sessions.length])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const loadUserSessions = async () => {
    try {
      const userSessions = await chatApi.getSessions()
      setSessions(userSessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const startNewSession = async () => {
    try {
      const response = await chatApi.startSession()
      setCurrentSessionId(response.session_id)
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant for candidate selection. I have access to all the resumes you\'ve uploaded and can help you find the perfect candidates for any role. What would you like to know about your candidates?',
        timestamp: new Date().toISOString()
      }])
      setShowSessions(false)
      await loadUserSessions() // Refresh sessions list
      toast.success('New chat session started!')
    } catch (error) {
      console.error('Error starting session:', error)
      toast.error('Failed to start new chat session')
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      setIsLoading(true)
      const history = await chatApi.getHistory(sessionId)
      setCurrentSessionId(sessionId)
      setMessages(history.messages)
      setShowSessions(false)
      toast.success('Chat session loaded!')
    } catch (error) {
      console.error('Error loading session:', error)
      toast.error('Failed to load chat session')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setIsLoading(true)

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, newUserMessage])

    try {
      const response: ChatResponse = await chatApi.sendMessage({
        message: userMessage,
        session_id: currentSessionId || undefined
      })

      // Update session ID if it was created
      if (!currentSessionId) {
        setCurrentSessionId(response.session_id)
        await loadUserSessions() // Refresh sessions list
      }

      // Add assistant response to chat
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        metadata: {
          sources: response.sources,
          candidates_mentioned: response.candidates_mentioned
        }
      }

      setMessages(prev => [...prev, assistantMessage])

      // Show info about mentioned candidates
      if (response.candidates_mentioned.length > 0) {
        toast.success(`Found ${response.candidates_mentioned.length} relevant candidate(s)!`)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }
  // Auto-resize textarea based on content
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = '40px' // Reset to minimum height
    const scrollHeight = textarea.scrollHeight
    const maxHeight = 80 // Max height for approximately 2 lines + padding
    const newHeight = Math.min(scrollHeight, maxHeight)
    textarea.style.height = newHeight + 'px'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const clearCurrentSession = () => {
    setMessages([])
    setCurrentSessionId(null)
    setShowSessions(false)
  }
  const getSuggestionQuestions = () => [
    "Who are my most experienced candidates?",
    "Find candidates with Python skills",
    "Show me candidates from San Francisco",
    "Who has the most relevant experience for a senior developer role?",
    "Compare candidates with React and Angular experience",
    "Find recent graduates with computer science degrees"
  ]

  // Type guard to check if candidates_mentioned exists and is an array
  const hasCandidatesMentioned = (metadata: ChatMessage['metadata']): metadata is { candidates_mentioned: number[] } => {
    return metadata?.candidates_mentioned !== undefined && 
           Array.isArray(metadata.candidates_mentioned) && 
           metadata.candidates_mentioned.length > 0
  }
  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <motion.button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
        </motion.button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-96 h-[600px] bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden"
      >        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-full">
              <CpuChipIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                AI Candidate Assistant
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {currentSessionId ? 'Active session' : 'Ready to help'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Chat sessions"
            >
              <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={clearCurrentSession}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="New chat"
            >
              <PlusIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Sessions Panel */}
        <AnimatePresence>
          {showSessions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
            >
              <div className="p-3 max-h-32 overflow-y-auto">                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Recent Sessions
                  </span>
                  <button
                    onClick={startNewSession}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    New Session
                  </button>
                </div>
                {sessions.length > 0 ? (
                  <div className="space-y-1">
                    {sessions.slice(0, 5).map((session) => (
                      <button
                        key={session.session_id}                        onClick={() => loadSession(session.session_id)}
                        className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 dark:text-white">
                            {session.message_count} messages
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {formatTimestamp(session.last_activity)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    No previous sessions
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !currentSessionId ? (
            <div className="text-center space-y-4">              <div className="p-6">
                <SparklesIcon className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Welcome to your AI Candidate Assistant!
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  I can help you find and analyze candidates from your uploaded resumes.
                </p>
                <button
                  onClick={startNewSession}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Start Conversation
                </button>
              </div>
                <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Try asking:
                </p>
                {getSuggestionQuestions().slice(0, 3).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(question)
                      if (!currentSessionId) {
                        startNewSession().then(() => {
                          setTimeout(() => sendMessage(), 100)
                        })
                      }
                    }}                    className="block w-full text-left p-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                  >
                    &ldquo;{question}&rdquo;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>                    <div className={`p-2 rounded-full ${
                      message.role === 'user' 
                        ? 'bg-blue-600 dark:bg-blue-500' 
                        : 'bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                    }`}>
                      {message.role === 'user' ? (
                        <UserIcon className="w-4 h-4 text-white" />
                      ) : (
                        <CpuChipIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>                      <div className="flex items-center justify-between mt-2">                        <span className={`text-xs ${
                          message.role === 'user'
                            ? 'text-white opacity-70'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {hasCandidatesMentioned(message.metadata) && (
                          <div className="flex items-center space-x-1">
                            <UsersIcon className="w-3 h-3" />
                            <span className={`text-xs ${
                              message.role === 'user'
                                ? 'text-white opacity-70'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {message.metadata.candidates_mentioned.length} candidates
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >                  <div className="flex items-start space-x-2">
                    <div className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600">
                      <CpuChipIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-end space-x-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your candidates..."
              disabled={isLoading}
              rows={1}
              className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none overflow-y-auto min-h-[40px] max-h-[80px]"
              style={{ height: '40px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`p-2 rounded-lg transition-colors shrink-0 ${
                inputMessage.trim() && !isLoading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
            </button>
          </div>
            {messages.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {getSuggestionQuestions().slice(3, 6).map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="text-xs px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                >
                  {question.length > 25 ? question.substring(0, 25) + '...' : question}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
