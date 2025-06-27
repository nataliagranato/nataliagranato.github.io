'use client'

import { useState, useEffect } from 'react'

interface SubscriberCountProps {
  showLabel?: boolean
  className?: string
}

export default function SubscriberCount({ 
  showLabel = true, 
  className = '' 
}: SubscriberCountProps) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCount()
  }, [])

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/newsletter/count')
      const data = await response.json()
      setCount(data.total)
    } catch (error) {
      console.error('Erro ao buscar contador:', error)
      setCount(0)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <span className="animate-pulse bg-gray-300 dark:bg-gray-600 h-4 w-12 rounded"></span>
        {showLabel && <span className="ml-1 text-sm text-gray-500">inscritos</span>}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="font-semibold text-primary-600 dark:text-primary-400">
        {count}
      </span>
      {showLabel && (
        <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">
          {count === 1 ? 'inscrito' : 'inscritos'}
        </span>
      )}
    </span>
  )
}
