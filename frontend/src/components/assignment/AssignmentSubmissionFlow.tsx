import React, { useState, useCallback } from 'react';
import {
  DocumentIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import FileUpload from '../ui/FileUpload';
import RichTextEditor from '../ui/RichTextEditor';
import ProgressIndicator, { ProgressStep } from '../ui/ProgressIndicator';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  maxPoints: number;
  submissionTypes: ('text' | 'file' | 'url')[];
  allowedFileTypes?: string[];
  maxFileSize?: number;
  maxFiles?: number;
  rubric?: AssignmentRubric[];
  instructions?: string;
}

export interface AssignmentRubric {
  criteria: string;
  description: string;
  maxPoints: number;
  levels: {
    name: string;
    description: string;
    points: number;
  }[];
}

export interface SubmissionData {
  textContent?: string;
  files?: File[];
  urls?: string[];
  comments?: string;
}

interface AssignmentSubmissionFlowProps {
  assignment: Assignment;
  existingSubmission?: {
    id: string;
    submittedAt: Date;
    textContent?: string;
    files?: { name: string; url: string; size: number }[];
    urls?: string[];
    comments?: string;
    status: 'draft' | 'submitted' | 'graded';
    grade?: number;
    feedback?: string;
  };
  onSubmit: (data: SubmissionData, isDraft: boolean) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const AssignmentSubmissionFlow: React.FC<AssignmentSubmissionFlowProps> = ({
  assignment,
  existingSubmission,
  onSubmit,
  onCancel,
  className = ''
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    textContent: existingSubmission?.textContent || '',
    files: [],
    urls: existingSubmission?.urls || [],
    comments: existingSubmission?.comments || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');

  const isOverdue = new Date() > assignment.dueDate;
  const timeUntilDue = formatDistanceToNow(assignment.dueDate, { addSuffix: true });
  const canSubmit = existingSubmission?.status !== 'submitted' && !isOverdue;

  const steps: ProgressStep[] = [
    {
      id: 'instructions',
      title: 'Instructions',
      description: 'Review assignment details',
      status: currentStep === 0 ? 'current' : currentStep > 0 ? 'completed' : 'upcoming'
    },
    {
      id: 'submission',
      title: 'Submission',
      description: 'Submit your work',
      status: currentStep === 1 ? 'current' : currentStep > 1 ? 'completed' : 'upcoming'
    },
    {
      id: 'review',
      title: 'Review',
      description: 'Review and submit',
      status: currentStep === 2 ? 'current' : currentStep > 2 ? 'completed' : 'upcoming'
    }
  ];

  const validateSubmission = useCallback(() => {
    const errors: string[] = [];
    
    // Check if at least one submission type is provided
    if (assignment.submissionTypes.includes('text') && !submissionData.textContent?.trim()) {
      if (!submissionData.files?.length && !submissionData.urls?.length) {
        errors.push('Please provide text content, upload files, or add URLs');
      }
    }
    
    if (assignment.submissionTypes.includes('file') && submissionData.files?.length === 0) {
      if (!submissionData.textContent?.trim() && !submissionData.urls?.length) {
        errors.push('Please upload at least one file or provide other content');
      }
    }
    
    if (assignment.submissionTypes.includes('url') && submissionData.urls?.length === 0) {
      if (!submissionData.textContent?.trim() && !submissionData.files?.length) {
        errors.push('Please add at least one URL or provide other content');
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  }, [assignment.submissionTypes, submissionData]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!validateSubmission()) {
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!isDraft && !validateSubmission()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(submissionData, isDraft);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (files: File[]) => {
    setSubmissionData(prev => ({
      ...prev,
      files: [...(prev.files || []), ...files]
    }));
  };

  const handleAddUrl = () => {
    if (newUrl.trim()) {
      setSubmissionData(prev => ({
        ...prev,
        urls: [...(prev.urls || []), newUrl.trim()]
      }));
      setNewUrl('');
    }
  };

  const handleRemoveUrl = (index: number) => {
    setSubmissionData(prev => ({
      ...prev,
      urls: prev.urls?.filter((_, i) => i !== index) || []
    }));
  };

  const renderInstructionsStep = () => (
    <div className="space-y-6">
      {/* Assignment Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          {assignment.title}
        </h3>
        <p className="text-blue-800 mb-4">
          {assignment.description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-blue-900">Due Date:</span>
            <div className={`flex items-center mt-1 ${
              isOverdue ? 'text-red-600' : 'text-blue-800'
            }`}>
              <ClockIcon className="w-4 h-4 mr-1" />
              {timeUntilDue}
            </div>
          </div>
          
          <div>
            <span className="font-medium text-blue-900">Points:</span>
            <p className="text-blue-800 mt-1">
              {assignment.maxPoints} points
            </p>
          </div>
        </div>
      </div>
      
      {/* Instructions */}
      {assignment.instructions && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            Instructions
          </h4>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: assignment.instructions }}
          />
        </div>
      )}
      
      {/* Submission Types */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-3">
          Submission Requirements
        </h4>
        <div className="space-y-2">
          {assignment.submissionTypes.map(type => (
            <div key={type} className="flex items-center">
              <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700 capitalize">
                {type} submission {type === 'file' ? 'upload' : type === 'url' ? 'links' : 'entry'}
              </span>
            </div>
          ))}
          
          {assignment.allowedFileTypes && (
            <p className="text-xs text-gray-500 mt-2">
              Allowed file types: {assignment.allowedFileTypes.join(', ')}
            </p>
          )}
          
          {assignment.maxFileSize && (
            <p className="text-xs text-gray-500">
              Maximum file size: {(assignment.maxFileSize / 1024 / 1024).toFixed(1)}MB
            </p>
          )}
        </div>
      </div>
      
      {/* Rubric */}
      {assignment.rubric && assignment.rubric.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            Grading Rubric
          </h4>
          <div className="space-y-4">
            {assignment.rubric.map((item, index) => (
              <div key={index} className="border border-gray-100 rounded-lg p-4">
                <h5 className="font-medium text-gray-900">
                  {item.criteria} ({item.maxPoints} points)
                </h5>
                <p className="text-sm text-gray-600 mt-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSubmissionStep = () => (
    <div className="space-y-6">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <h4 className="font-medium text-red-800">
              Please fix the following issues:
            </h4>
          </div>
          <ul className="mt-2 list-disc list-inside text-sm text-red-700">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Text Submission */}
      {assignment.submissionTypes.includes('text') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Text Submission
          </label>
          <RichTextEditor
            value={submissionData.textContent || ''}
            onChange={(value) => setSubmissionData(prev => ({ ...prev, textContent: value }))}
            placeholder="Enter your submission text here..."
            minHeight={200}
            showToolbar={true}
            allowImages={true}
            allowLinks={true}
          />
        </div>
      )}
      
      {/* File Upload */}
      {assignment.submissionTypes.includes('file') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            File Upload
          </label>
          <FileUpload
            accept={assignment.allowedFileTypes?.join(',') || '*/*'}
            multiple={true}
            maxSize={assignment.maxFileSize || 10 * 1024 * 1024}
            maxFiles={assignment.maxFiles || 10}
            onFilesSelected={handleFileUpload}
            label="Upload your assignment files"
            description="Drag and drop files here, or click to browse"
          />
        </div>
      )}
      
      {/* URL Submission */}
      {assignment.submissionTypes.includes('url') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Submission
          </label>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add URL
              </button>
            </div>
            
            {submissionData.urls && submissionData.urls.length > 0 && (
              <div className="space-y-2">
                {submissionData.urls.map((url, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 truncate flex-1"
                    >
                      {url}
                    </a>
                    <button
                      onClick={() => handleRemoveUrl(index)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Comments */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comments (Optional)
        </label>
        <textarea
          value={submissionData.comments || ''}
          onChange={(e) => setSubmissionData(prev => ({ ...prev, comments: e.target.value }))}
          placeholder="Add any additional comments for your instructor..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-6">
      {/* Submission Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Submission Summary
        </h3>
        
        {submissionData.textContent && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Text Content:</h4>
            <div className="bg-white p-4 rounded border text-sm max-h-32 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: submissionData.textContent }} />
            </div>
          </div>
        )}
        
        {submissionData.files && submissionData.files.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">
              Files ({submissionData.files.length}):
            </h4>
            <div className="space-y-2">
              {submissionData.files.map((file, index) => (
                <div key={index} className="flex items-center bg-white p-3 rounded border">
                  <DocumentIcon className="w-5 h-5 text-gray-400 mr-3" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {submissionData.urls && submissionData.urls.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">
              URLs ({submissionData.urls.length}):
            </h4>
            <div className="space-y-2">
              {submissionData.urls.map((url, index) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {url}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {submissionData.comments && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Comments:</h4>
            <div className="bg-white p-4 rounded border text-sm">
              {submissionData.comments}
            </div>
          </div>
        )}
      </div>
      
      {/* Submission Warning */}
      {!isOverdue && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800">
                Ready to Submit?
              </h4>
              <p className="text-sm text-yellow-700 mt-1">
                Once submitted, you may not be able to make changes. Make sure your work is complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressIndicator
          steps={steps}
          orientation="horizontal"
          onStepClick={(step, index) => setCurrentStep(index)}
        />
      </div>
      
      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && renderInstructionsStep()}
          {currentStep === 1 && renderSubmissionStep()}
          {currentStep === 2 && renderReviewStep()}
        </motion.div>
      </AnimatePresence>
      
      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
        <div className="flex space-x-3">
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Previous
            </button>
          )}
          
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
        
        <div className="flex space-x-3">
          {/* Save Draft */}
          {canSubmit && currentStep === 2 && (
            <button
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
          )}
          
          {/* Next/Submit */}
          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Next
            </button>
          ) : canSubmit ? (
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                  Submit Assignment
                </>
              )}
            </button>
          ) : (
            <span className="px-6 py-2 bg-gray-300 text-gray-500 rounded-lg">
              {isOverdue ? 'Past Due' : 'Cannot Submit'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignmentSubmissionFlow;