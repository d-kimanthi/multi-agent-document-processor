import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { queryApi } from '@/services/api'
import { classNames } from '@/utils/classNames'
import {
    ChatBubbleLeftRightIcon,
    DocumentTextIcon,
    MagnifyingGlassIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline'
import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { useSearchParams } from 'react-router-dom'

export const Search: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [mode, setMode] = useState<'search' | 'qa'>('qa')
  const [results, setResults] = useState<any>(null)

  const searchMutation = useMutation(
    ({ query, mode }: { query: string; mode: 'search' | 'qa' }) => {
      if (mode === 'search') {
        return queryApi.searchDocuments(query, 10)
      } else {
        return queryApi.askQuestion(query, 5)
      }
    },
    {
      onSuccess: (data) => {
        setResults(data)
      },
      onError: (error) => {
        console.error('Search error:', error)
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setSearchParams({ q: query.trim() })
      searchMutation.mutate({ query: query.trim(), mode })
    }
  }

  const confidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const clearResults = () => {
    setResults(null)
    setQuery('')
    setSearchParams({})
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Search & Query</h1>
        <p className="text-lg text-gray-600">
          Search through your documents or ask intelligent questions
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex justify-center">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setMode('qa')}
            className={classNames(
              'flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors',
              mode === 'qa'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4 mr-2" />
            Question & Answer
          </button>
          <button
            onClick={() => setMode('search')}
            className={classNames(
              'flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors',
              mode === 'search'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
            Document Search
          </button>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {mode === 'qa' ? (
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-lg"
            placeholder={
              mode === 'qa'
                ? 'Ask a question about your documents...'
                : 'Search for specific content...'
            }
          />
        </div>
        <div className="flex justify-center space-x-2">
          <button
            type="submit"
            disabled={!query.trim() || searchMutation.isLoading}
            className="btn-primary text-lg px-8 py-3"
          >
            {searchMutation.isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {mode === 'qa' ? 'Finding Answer...' : 'Searching...'}
              </>
            ) : (
              <>
                {mode === 'qa' ? (
                  <SparklesIcon className="h-5 w-5 mr-2" />
                ) : (
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                )}
                {mode === 'qa' ? 'Ask Question' : 'Search Documents'}
              </>
            )}
          </button>
          {(results || query) && (
            <button
              type="button"
              onClick={clearResults}
              className="btn-secondary text-lg px-6 py-3"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Example Queries */}
      {!results && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {mode === 'qa' ? 'Example Questions' : 'Example Searches'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mode === 'qa' ? (
              <>
                <button
                  onClick={() => setQuery('What are the main topics discussed?')}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <span className="text-primary-600 font-medium">
                    What are the main topics discussed?
                  </span>
                </button>
                <button
                  onClick={() => setQuery('Summarize the key findings')}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <span className="text-primary-600 font-medium">
                    Summarize the key findings
                  </span>
                </button>
                <button
                  onClick={() => setQuery('What entities are mentioned most frequently?')}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <span className="text-primary-600 font-medium">
                    What entities are mentioned most frequently?
                  </span>
                </button>
                <button
                  onClick={() => setQuery('What is the overall sentiment?')}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <span className="text-primary-600 font-medium">
                    What is the overall sentiment?
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setQuery('artificial intelligence')}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <span className="text-primary-600 font-medium">artificial intelligence</span>
                </button>
                <button
                  onClick={() => setQuery('machine learning')}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <span className="text-primary-600 font-medium">machine learning</span>
                </button>
                <button
                  onClick={() => setQuery('data analysis')}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <span className="text-primary-600 font-medium">data analysis</span>
                </button>
                <button
                  onClick={() => setQuery('natural language processing')}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-300 transition-colors"
                >
                  <span className="text-primary-600 font-medium">natural language processing</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Search Error */}
      {searchMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Search failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  {searchMutation.error instanceof Error 
                    ? searchMutation.error.message 
                    : 'An error occurred while searching. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {mode === 'qa' ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Answer</h3>
                <span className={classNames(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  confidenceColor(results.confidence || 0)
                )}>
                  {Math.round((results.confidence || 0) * 100)}% confidence
                </span>
              </div>
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-800 text-lg leading-relaxed">
                  {results.answer || 'No answer could be generated for this question.'}
                </p>
              </div>

              {results.sources && results.sources.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    Sources ({results.sources.length})
                  </h4>
                  <div className="space-y-3">
                    {results.sources.map((source: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Document {source.document_id} - Chunk {source.chunk_index}
                          </span>
                          <span className="text-xs text-gray-500">
                            {Math.round((source.similarity_score || 0) * 100)}% match
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {source.text_snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.processing_time_ms && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Processing time: {results.processing_time_ms}ms
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Search Results ({results.total_results || results.results?.length || 0})
                </h3>
              </div>
              
              {(!results.results || results.results.length === 0) ? (
                <div className="card text-center py-8">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your search terms or check if documents have been processed.
                  </p>
                </div>
              ) : (
                results.results.map((result: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">
                          Document {result.document_id}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          Chunk {result.chunk_index}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {Math.round((result.similarity_score || 0) * 100)}% match
                      </span>
                    </div>
                    
                    <p className="text-gray-700 leading-relaxed">
                      {result.text}
                    </p>

                    {result.metadata && (
                      <div className="mt-3 text-xs text-gray-500">
                        Source: {result.metadata.source}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}