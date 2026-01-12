/**
 * Question: React Component Architecture for Compliance Workflows
 * 
 * Build a multi-step compliance workflow wizard where users configure automated 
 * controls, map them to frameworks, and set up evidence collection schedules. 
 * This implementation handles complex form state, validation, and step dependencies.
 * 
 * Key Technical Decisions:
 * - State machine pattern for workflow orchestration
 * - Compound component pattern for flexibility
 * - Schema-driven validation with Zod
 * - Auto-save with debouncing for draft persistence
 * - Cross-step dependency resolution
 */

import React, { useReducer, useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';

// Types
type StepId =
  | 'frameworkSelection'
  | 'controlMapping'
  | 'evidenceConfiguration'
  | 'scheduleSetup'
  | 'review';

type Framework = 'SOC2' | 'FEDRAMP' | 'ISO27001' | 'PCI';

interface ValidationError {
  field: string;
  message: string;
}

interface WorkflowState {
  currentStep: StepId;
  completedSteps: Set<StepId>;
  stepData: Record<StepId, unknown>;
  validationErrors: Record<StepId, ValidationError[]>;
  isDirty: boolean;
}

type WorkflowEvent =
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'GOTO'; step: StepId }
  | { type: 'UPDATE_DATA'; step: StepId; data: unknown }
  | { type: 'SET_ERRORS'; step: StepId; errors: ValidationError[] }
  | { type: 'SAVE_DRAFT' }
  | { type: 'SUBMIT' }
  | { type: 'INITIALIZE'; payload: Partial<WorkflowState> };

// Step Data Types
interface FrameworkSelectionData {
  frameworks: Framework[];
  primaryFramework?: Framework;
  scope: {
    businessUnits: string[];
    environments: ('production' | 'staging' | 'development')[];
  };
}

interface ControlMappingData {
  mappings: Array<{
    controlId: string;
    framework: Framework;
    controlIdentifier: string;
  }>;
}

interface EvidenceConfigurationData {
  collectionMethods: Array<{
    controlId: string;
    method: 'automated' | 'manual' | 'hybrid';
    schedule?: string;
  }>;
}

interface ScheduleSetupData {
  schedules: Array<{
    controlId: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
    time?: string;
    timezone: string;
  }>;
}

// Validation Schemas
const frameworkSelectionSchema = z.object({
  frameworks: z.array(z.enum(['SOC2', 'FEDRAMP', 'ISO27001', 'PCI'])).min(1, {
    message: 'At least one framework must be selected',
  }),
  primaryFramework: z.enum(['SOC2', 'FEDRAMP', 'ISO27001', 'PCI']).optional(),
  scope: z.object({
    businessUnits: z.array(z.string()).min(1, {
      message: 'At least one business unit must be selected',
    }),
    environments: z.array(z.enum(['production', 'staging', 'development'])).min(1),
  }),
}).refine(
  (data) => {
    // If multiple frameworks, primary must be selected
    return data.frameworks.length === 1 || data.primaryFramework !== undefined;
  },
  {
    message: 'Primary framework must be selected when multiple frameworks are chosen',
    path: ['primaryFramework'],
  }
);

// Workflow Reducer
function workflowReducer(
  state: WorkflowState,
  action: WorkflowEvent
): WorkflowState {
  switch (action.type) {
    case 'UPDATE_DATA': {
      const newStepData = {
        ...state.stepData,
        [action.step]: action.data,
      };

      return {
        ...state,
        stepData: newStepData,
        isDirty: true,
        // Clear errors when data is updated
        validationErrors: {
          ...state.validationErrors,
          [action.step]: [],
        },
      };
    }

    case 'SET_ERRORS': {
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.step]: action.errors,
        },
      };
    }

    case 'NEXT': {
      const nextStep = getNextStep(state.currentStep);
      return {
        ...state,
        currentStep: nextStep,
        completedSteps: new Set([...state.completedSteps, state.currentStep]),
      };
    }

    case 'PREVIOUS': {
      const previousStep = getPreviousStep(state.currentStep);
      return {
        ...state,
        currentStep: previousStep,
      };
    }

    case 'GOTO': {
      return {
        ...state,
        currentStep: action.step,
      };
    }

    case 'INITIALIZE': {
      return {
        ...state,
        ...action.payload,
      };
    }

    default:
      return state;
  }
}

function getNextStep(current: StepId): StepId {
  const steps: StepId[] = [
    'frameworkSelection',
    'controlMapping',
    'evidenceConfiguration',
    'scheduleSetup',
    'review',
  ];
  const currentIndex = steps.indexOf(current);
  return steps[currentIndex + 1] || current;
}

function getPreviousStep(current: StepId): StepId {
  const steps: StepId[] = [
    'frameworkSelection',
    'controlMapping',
    'evidenceConfiguration',
    'scheduleSetup',
    'review',
  ];
  const currentIndex = steps.indexOf(current);
  return steps[Math.max(0, currentIndex - 1)];
}

// Step Component Props
interface StepProps<TData> {
  data: TData;
  onChange: (data: TData) => void;
  errors?: ValidationError[];
  onNext?: () => void;
  onPrevious?: () => void;
}

// Step Interface
interface WorkflowStep<TData> {
  id: StepId;
  title: string;
  description: string;
  component: React.ComponentType<StepProps<TData>>;
  validationSchema: z.ZodSchema<TData>;
  defaultData: TData;
  dependencies?: StepId[];
}

// Framework Selection Step Component
function FrameworkSelectionForm({
  data,
  onChange,
  errors,
}: StepProps<FrameworkSelectionData>) {
  const availableFrameworks: Framework[] = ['SOC2', 'FEDRAMP', 'ISO27001', 'PCI'];

  const handleFrameworkToggle = (framework: Framework) => {
    const newFrameworks = data.frameworks.includes(framework)
      ? data.frameworks.filter(f => f !== framework)
      : [...data.frameworks, framework];
    
    onChange({
      ...data,
      frameworks: newFrameworks,
      // Reset primary if it's no longer in selected frameworks
      primaryFramework: newFrameworks.includes(data.primaryFramework!)
        ? data.primaryFramework
        : undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Compliance Frameworks
        </label>
        <div className="grid grid-cols-2 gap-4">
          {availableFrameworks.map(framework => (
            <label
              key={framework}
              className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={data.frameworks.includes(framework)}
                onChange={() => handleFrameworkToggle(framework)}
                className="mr-3"
              />
              <span>{framework}</span>
            </label>
          ))}
        </div>
        {errors?.find(e => e.field === 'frameworks') && (
          <p className="mt-1 text-sm text-red-600">
            {errors.find(e => e.field === 'frameworks')?.message}
          </p>
        )}
      </div>

      {data.frameworks.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Primary Framework
          </label>
          <select
            value={data.primaryFramework || ''}
            onChange={e => onChange({
              ...data,
              primaryFramework: e.target.value as Framework,
            })}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Select primary framework</option>
            {data.frameworks.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            The primary framework determines control naming conventions
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Units
        </label>
        <input
          type="text"
          placeholder="Enter business units (comma-separated)"
          value={data.scope.businessUnits.join(', ')}
          onChange={e => onChange({
            ...data,
            scope: {
              ...data.scope,
              businessUnits: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
            },
          })}
          className="w-full border rounded-lg p-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Environments
        </label>
        <div className="flex gap-4">
          {(['production', 'staging', 'development'] as const).map(env => (
            <label key={env} className="flex items-center">
              <input
                type="checkbox"
                checked={data.scope.environments.includes(env)}
                onChange={e => {
                  const newEnvs = e.target.checked
                    ? [...data.scope.environments, env]
                    : data.scope.environments.filter(e => e !== env);
                  onChange({
                    ...data,
                    scope: { ...data.scope, environments: newEnvs },
                  });
                }}
                className="mr-2"
              />
              <span className="capitalize">{env}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

// Workflow Context
interface WorkflowContextValue {
  state: WorkflowState;
  dispatch: React.Dispatch<WorkflowEvent>;
  validateStep: (step: StepId) => Promise<boolean>;
  canProceed: (step: StepId) => boolean;
}

const WorkflowContext = React.createContext<WorkflowContextValue | null>(null);

// Custom hook for workflow persistence
function useWorkflowPersistence(
  workflowId: string,
  state: WorkflowState
) {
  const [isSaving, setIsSaving] = useState(false);

  const saveDraft = useCallback(
    async (stateToSave: WorkflowState) => {
      setIsSaving(true);
      try {
        // In real implementation, would call API
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Draft saved:', {
          workflowId,
          stepData: stateToSave.stepData,
          currentStep: stateToSave.currentStep,
        });
      } finally {
        setIsSaving(false);
      }
    },
    [workflowId]
  );

  // Debounced auto-save
  useEffect(() => {
    if (!state.isDirty) return;

    const timeoutId = setTimeout(() => {
      saveDraft(state);
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [state, saveDraft]);

  return { isSaving };
}

// Main Workflow Wizard Component
interface ComplianceWorkflowWizardProps {
  workflowId?: string;
  onComplete?: (data: WorkflowState['stepData']) => void;
}

export function ComplianceWorkflowWizard({
  workflowId = 'new',
  onComplete,
}: ComplianceWorkflowWizardProps) {
  const [state, dispatch] = useReducer(workflowReducer, {
    currentStep: 'frameworkSelection',
    completedSteps: new Set(),
    stepData: {
      frameworkSelection: {
        frameworks: [],
        scope: { businessUnits: [], environments: ['production'] },
      } as FrameworkSelectionData,
      controlMapping: { mappings: [] } as ControlMappingData,
      evidenceConfiguration: { collectionMethods: [] } as EvidenceConfigurationData,
      scheduleSetup: { schedules: [] } as ScheduleSetupData,
    },
    validationErrors: {},
    isDirty: false,
  });

  const { isSaving } = useWorkflowPersistence(workflowId, state);

  const validateStep = useCallback(async (step: StepId): Promise<boolean> => {
    const stepData = state.stepData[step];

    try {
      switch (step) {
        case 'frameworkSelection':
          frameworkSelectionSchema.parse(stepData);
          break;
        // Add validation for other steps
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        dispatch({ type: 'SET_ERRORS', step, errors });
      }
      return false;
    }
  }, [state.stepData]);

  const canProceed = useCallback((step: StepId): boolean => {
    // Check if step dependencies are completed
    // Simplified - would check actual dependencies
    return state.completedSteps.has(step) || step === state.currentStep;
  }, [state]);

  const handleNext = useCallback(async () => {
    const isValid = await validateStep(state.currentStep);
    if (isValid) {
      dispatch({ type: 'NEXT' });
    }
  }, [state.currentStep, validateStep]);

  const handlePrevious = useCallback(() => {
    dispatch({ type: 'PREVIOUS' });
  }, []);

  const handleStepDataChange = useCallback((step: StepId, data: unknown) => {
    dispatch({ type: 'UPDATE_DATA', step, data });
  }, []);

  const contextValue: WorkflowContextValue = {
    state,
    dispatch,
    validateStep,
    canProceed,
  };

  const currentStepData = state.stepData[state.currentStep];
  const currentErrors = state.validationErrors[state.currentStep] || [];

  return (
    <WorkflowContext.Provider value={contextValue}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Compliance Control Configuration</h1>
          {isSaving && (
            <p className="text-sm text-gray-500">Saving draft...</p>
          )}
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[
            'frameworkSelection',
            'controlMapping',
            'evidenceConfiguration',
            'scheduleSetup',
            'review',
          ].map((step, index) => {
            const isCompleted = state.completedSteps.has(step as StepId);
            const isCurrent = state.currentStep === step;

            return (
              <React.Fragment key={step}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className="ml-2 text-sm hidden md:block capitalize">
                    {step.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                {index < 4 && <div className="flex-1 h-1 bg-gray-200 mx-2" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Current Step Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {state.currentStep === 'frameworkSelection' && (
            <FrameworkSelectionForm
              data={currentStepData as FrameworkSelectionData}
              onChange={data => handleStepDataChange('frameworkSelection', data)}
              errors={currentErrors}
            />
          )}
          {/* Add other step components here */}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handlePrevious}
            disabled={state.currentStep === 'frameworkSelection'}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            {state.currentStep === 'review' ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
    </WorkflowContext.Provider>
  );
}

