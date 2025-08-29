import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useUploadDocument } from '@/hooks/useDocuments'
import { classNames } from '@/utils/classNames'
import {
    CheckCircleIcon,
    CloudArrowUpIcon,
    DocumentTextIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'

interface FileWithPreview extends File {
  preview?: string
  id: string
}

export const Upload: React.FC = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const uploadDocument = useUploadDocument()
  const navigate = useNavigate()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substring(7),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const uploadFile = async (file: FileWithPreview) => {
    try {
      setUploadProgress(prev => ({ ...prev, [file.id]: 0 }))
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const current = prev[file.id] || 0
          if (current >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return { ...prev, [file.id]: current + 10 }
        })
      }, 200)

      await uploadDocument.mutateAsync(file)
      
      clearInterval(progressInterval)
      setUploadProgress(prev => ({ ...prev, [file.id]: 100 }))
      
      // Remove file from list after successful upload
      setTimeout(() => {
        removeFile(file.id)
      }, 1500)
      
    } catch (error) {
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[file.id]
        return newProgress
      })
    }
  }

  const uploadAllFiles = async () => {
    const filesToUpload = files.filter(file => !(file.id in uploadProgress))
    
    for (const file of filesToUpload) {
      await uploadFile(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Documents</h1>
        <p className="text-lg text-gray-600 mb-8">
          Upload your documents to start intelligent analysis and processing
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={classNames(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200',
          isDragActive
            ? 'border-primary-400 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        )}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg text-primary-600 font-medium">
            Drop the files here...
          </p>
        ) : (
          <div>
            <p className="text-lg text-gray-900 font-medium mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-gray-500">
              Supports PDF, DOCX, and TXT files up to 50MB
            </p>
          </div>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Files to Upload ({files.length})
            </h3>
            <div className="space-x-2">
              <button
                onClick={() => setFiles([])}
                className="btn-secondary"
                disabled={Object.keys(uploadProgress).length > 0}
              >
                Clear All
              </button>
              <button
                onClick={uploadAllFiles}
                disabled={files.length === 0 || Object.keys(uploadProgress).length > 0}
                className="btn-primary"
              >
                {Object.keys(uploadProgress).length > 0 ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  'Upload All Files'
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {files.map((file) => {
              const progress = uploadProgress[file.id]
              const isUploading = progress !== undefined
              const isCompleted = progress === 100
              
              return (
                <div
                  key={file.id}
                  className="flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0 mr-4">
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                    
                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">
                            {isCompleted ? 'Upload complete' : `Uploading... ${progress}%`}
                          </span>
                        </div>
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={classNames(
                              'h-2 rounded-full transition-all duration-300',
                              isCompleted ? 'bg-green-500' : 'bg-primary-500'
                            )}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {isCompleted ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-500" />
                    ) : isUploading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <button
                          onClick={() => uploadFile(file)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Upload
                        </button>
                        <button
                          onClick={() => removeFile(file.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Upload Guidelines</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Supported formats: PDF, DOCX, TXT</span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Maximum file size: 50MB per file</span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Processing includes: text extraction, entity recognition, sentiment analysis, topic modeling</span>
          </li>
          <li className="flex items-start">
            <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <span>Processing time varies based on document size and complexity</span>
          </li>
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens after upload?</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-primary-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <span className="text-primary-600 font-bold">4</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Indexing</h4>
            <p className="text-sm text-gray-600">Make searchable and queryable</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/documents')}
            className="btn-secondary mr-3"
          >
            View All Documents
          </button>
          <button
            onClick={() => navigate('/search')}
            className="btn-secondary"
          >
            Search & Query
          </button>
        </div>
      </div>
    </div>
  )
}
