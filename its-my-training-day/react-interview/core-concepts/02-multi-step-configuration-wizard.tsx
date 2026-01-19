/**
 * Question 2: Complex multi-step configuration wizard
 * 
 * Implements state persistence, validation, step navigation, and data preservation
 * using Context API, custom hooks, and schema validation.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { z } from 'zod';

// Validation schemas
const processParametersSchema = z.object({
  temperature: z.number().min(0).max(2000),
  pressure: z.number().min(0).max(1000),
  duration: z.number().min(1).max(3600),
  rampRate: z.number().min(0.1).max(100),
});

const equipmentSettingsSchema = z.object({
  chamberType: z.enum(['single', 'batch', 'continuous']),
  gasFlow: z.number().min(0).max(1000),
  powerLevel: z.number().min(0).max(100),
});

const qualityThresholdsSchema = z.object({
  minYield: z.number().min(0).max(100),
  maxDefectRate: z.number().min(0).max(10),
  targetThickness: z.number().min(0).max(1000),
});

const safetyChecksSchema = z.object({
  emergencyStopEnabled: z.boolean(),
  maxTemperatureAlarm: z.number().min(0).max(2000),
  pressureReliefValve: z.boolean(),
});

// Types
type StepName = 'processParameters' | 'equipmentSettings' | 'qualityThresholds' | 'safetyChecks';

interface WizardState {
  currentStep: number;
  data: {
    processParameters?: z.infer<typeof processParametersSchema>;
    equipmentSettings?: z.infer<typeof equipmentSettingsSchema>;
    qualityThresholds?: z.infer<typeof qualityThresholdsSchema>;
    safetyChecks?: z.infer<typeof safetyChecksSchema>;
  };
  validationErrors: Record<StepName, string | null>;
  completedSteps: Set<StepName>;
  isDirty: boolean;
}

interface WizardContextValue {
  wizardState: WizardState;
  updateStepData: (step: StepName, data: any) => void;
  validateStep: (step: StepName) => Promise<boolean>;
  navigateToStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
  saveDraft: () => Promise<void>;
}

const WizardContext = createContext<WizardContextValue | null>(null);

// Step definitions
const STEPS: { name: StepName; title: string; schema: z.ZodSchema }[] = [
  { name: 'processParameters', title: 'Process Parameters', schema: processParametersSchema },
  { name: 'equipmentSettings', title: 'Equipment Settings', schema: equipmentSettingsSchema },
  { name: 'qualityThresholds', title: 'Quality Thresholds', schema: qualityThresholdsSchema },
  { name: 'safetyChecks', title: 'Safety Checks', schema: safetyChecksSchema },
];

// Wizard Provider
export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [wizardState, setWizardState] = useState<WizardState>(() => {
    // Load from localStorage for persistence
    const saved = localStorage.getItem('wizard-config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          completedSteps: new Set(parsed.completedSteps || []),
        };
      } catch {
        // If parsing fails, use defaults
      }
    }
    
    return {
      currentStep: 0,
      data: {},
      validationErrors: {
        processParameters: null,
        equipmentSettings: null,
        qualityThresholds: null,
        safetyChecks: null,
      } as any,
      completedSteps: new Set<StepName>(),
      isDirty: false,
    };
  });

  // Persist to localStorage on changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (wizardState.isDirty) {
        const toSave = {
          ...wizardState,
          completedSteps: Array.from(wizardState.completedSteps),
        };
        localStorage.setItem('wizard-config', JSON.stringify(toSave));
        setWizardState(prev => ({ ...prev, isDirty: false }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [wizardState]);

  const updateStepData = useCallback((step: StepName, data: any) => {
    setWizardState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [step]: { ...prev.data[step], ...data },
      },
      isDirty: true,
    }));
  }, []);

  const validateStep = useCallback(async (step: StepName): Promise<boolean> => {
    const stepDef = STEPS.find(s => s.name === step);
    if (!stepDef) return false;

    const stepData = wizardState.data[step];
    if (!stepData) {
      setWizardState(prev => ({
        ...prev,
        validationErrors: {
          ...prev.validationErrors,
          [step]: 'Step data is required',
        },
      }));
      return false;
    }

    try {
      stepDef.schema.parse(stepData);
      
      setWizardState(prev => ({
        ...prev,
        validationErrors: {
          ...prev.validationErrors,
          [step]: null,
        },
        completedSteps: new Set([...prev.completedSteps, step]),
      }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setWizardState(prev => ({
          ...prev,
          validationErrors: {
            ...prev.validationErrors,
            [step]: error.errors.map(e => e.message).join(', '),
          },
        }));
      }
      return false;
    }
  }, [wizardState.data]);

  const navigateToStep = useCallback((step: number) => {
    if (step >= 0 && step < STEPS.length) {
      setWizardState(prev => ({ ...prev, currentStep: step }));
    }
  }, []);

  const nextStep = useCallback(async () => {
    const currentStepName = STEPS[wizardState.currentStep]?.name;
    if (!currentStepName) return;

    const isValid = await validateStep(currentStepName);
    if (isValid && wizardState.currentStep < STEPS.length - 1) {
      setWizardState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }, [wizardState.currentStep, validateStep]);

  const previousStep = useCallback(() => {
    if (wizardState.currentStep > 0) {
      setWizardState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [wizardState.currentStep]);

  const reset = useCallback(() => {
    setWizardState({
      currentStep: 0,
      data: {},
      validationErrors: {
        processParameters: null,
        equipmentSettings: null,
        qualityThresholds: null,
        safetyChecks: null,
      } as any,
      completedSteps: new Set(),
      isDirty: false,
    });
    localStorage.removeItem('wizard-config');
  }, []);

  const saveDraft = useCallback(async () => {
    const toSave = {
      ...wizardState,
      completedSteps: Array.from(wizardState.completedSteps),
    };
    localStorage.setItem('wizard-config', JSON.stringify(toSave));
    
    // Optionally save to server
    try {
      await fetch('/api/wizard/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave),
      });
    } catch (error) {
      console.error('Failed to save draft to server:', error);
    }
  }, [wizardState]);

  const value: WizardContextValue = {
    wizardState,
    updateStepData,
    validateStep,
    navigateToStep,
    nextStep,
    previousStep,
    reset,
    saveDraft,
  };

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

// Hook to use wizard context
export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}

// Custom hook for individual step
export function useWizardStep(stepName: StepName) {
  const { wizardState, updateStepData, validateStep } = useWizard();
  const [localState, setLocalState] = useState(wizardState.data[stepName] || {});
  const [isDirty, setIsDirty] = useState(false);

  // Debounced save to context
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isDirty) {
        updateStepData(stepName, localState);
        setIsDirty(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [localState, isDirty, stepName, updateStepData]);

  const updateField = useCallback((field: string, value: any) => {
    setLocalState(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  return {
    data: localState,
    updateField,
    isDirty,
    errors: wizardState.validationErrors[stepName],
    isCompleted: wizardState.completedSteps.has(stepName),
    validate: () => validateStep(stepName),
  };
}

// Step component wrapper
interface StepProps {
  stepName: StepName;
  children: (step: ReturnType<typeof useWizardStep>) => React.ReactNode;
}

export function WizardStep({ stepName, children }: StepProps) {
  const step = useWizardStep(stepName);
  return <>{children(step)}</>;
}

// Main wizard component
export function ConfigurationWizard() {
  const { wizardState, nextStep, previousStep, navigateToStep, saveDraft, reset } = useWizard();
  const currentStepDef = STEPS[wizardState.currentStep];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>Semiconductor Manufacturing Configuration Wizard</h1>

      {/* Progress indicator */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          {STEPS.map((step, index) => (
            <button
              key={step.name}
              onClick={() => navigateToStep(index)}
              style={{
                flex: 1,
                padding: '10px',
                margin: '0 5px',
                border: '2px solid',
                borderColor: index === wizardState.currentStep 
                  ? '#007bff' 
                  : wizardState.completedSteps.has(step.name)
                  ? '#28a745'
                  : '#ccc',
                backgroundColor: index === wizardState.currentStep ? '#e7f3ff' : 'white',
                cursor: 'pointer',
              }}
            >
              {step.title}
              {wizardState.completedSteps.has(step.name) && ' ✓'}
            </button>
          ))}
        </div>
      </div>

      {/* Current step content */}
      <div style={{ minHeight: '400px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>{currentStepDef.title}</h2>
        
        {wizardState.validationErrors[currentStepDef.name] && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            {wizardState.validationErrors[currentStepDef.name]}
          </div>
        )}

        <WizardStep stepName={currentStepDef.name}>
          {(step) => (
            <div>
              {currentStepDef.name === 'processParameters' && (
                <ProcessParametersStep step={step} />
              )}
              {currentStepDef.name === 'equipmentSettings' && (
                <EquipmentSettingsStep step={step} />
              )}
              {currentStepDef.name === 'qualityThresholds' && (
                <QualityThresholdsStep step={step} />
              )}
              {currentStepDef.name === 'safetyChecks' && (
                <SafetyChecksStep step={step} />
              )}
            </div>
          )}
        </WizardStep>
      </div>

      {/* Navigation buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
        <button
          onClick={previousStep}
          disabled={wizardState.currentStep === 0}
          style={{ padding: '10px 20px' }}
        >
          Previous
        </button>
        
        <div>
          <button
            onClick={saveDraft}
            style={{ padding: '10px 20px', marginRight: '10px' }}
          >
            Save Draft
          </button>
          <button
            onClick={reset}
            style={{ padding: '10px 20px', marginRight: '10px' }}
          >
            Reset
          </button>
        </div>

        <button
          onClick={nextStep}
          disabled={wizardState.currentStep === STEPS.length - 1}
          style={{ padding: '10px 20px' }}
        >
          {wizardState.currentStep === STEPS.length - 1 ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// Step components
function ProcessParametersStep({ step }: { step: ReturnType<typeof useWizardStep> }) {
  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label>Temperature (°C):</label>
        <input
          type="number"
          value={step.data.temperature || ''}
          onChange={(e) => step.updateField('temperature', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label>Pressure (kPa):</label>
        <input
          type="number"
          value={step.data.pressure || ''}
          onChange={(e) => step.updateField('pressure', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label>Duration (seconds):</label>
        <input
          type="number"
          value={step.data.duration || ''}
          onChange={(e) => step.updateField('duration', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label>Ramp Rate (°C/min):</label>
        <input
          type="number"
          value={step.data.rampRate || ''}
          onChange={(e) => step.updateField('rampRate', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
    </div>
  );
}

function EquipmentSettingsStep({ step }: { step: ReturnType<typeof useWizardStep> }) {
  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label>Chamber Type:</label>
        <select
          value={step.data.chamberType || 'single'}
          onChange={(e) => step.updateField('chamberType', e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="single">Single</option>
          <option value="batch">Batch</option>
          <option value="continuous">Continuous</option>
        </select>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label>Gas Flow (sccm):</label>
        <input
          type="number"
          value={step.data.gasFlow || ''}
          onChange={(e) => step.updateField('gasFlow', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label>Power Level (%):</label>
        <input
          type="number"
          value={step.data.powerLevel || ''}
          onChange={(e) => step.updateField('powerLevel', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
    </div>
  );
}

function QualityThresholdsStep({ step }: { step: ReturnType<typeof useWizardStep> }) {
  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label>Minimum Yield (%):</label>
        <input
          type="number"
          value={step.data.minYield || ''}
          onChange={(e) => step.updateField('minYield', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label>Maximum Defect Rate (%):</label>
        <input
          type="number"
          value={step.data.maxDefectRate || ''}
          onChange={(e) => step.updateField('maxDefectRate', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label>Target Thickness (nm):</label>
        <input
          type="number"
          value={step.data.targetThickness || ''}
          onChange={(e) => step.updateField('targetThickness', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
    </div>
  );
}

function SafetyChecksStep({ step }: { step: ReturnType<typeof useWizardStep> }) {
  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label>
          <input
            type="checkbox"
            checked={step.data.emergencyStopEnabled || false}
            onChange={(e) => step.updateField('emergencyStopEnabled', e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Emergency Stop Enabled
        </label>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label>Max Temperature Alarm (°C):</label>
        <input
          type="number"
          value={step.data.maxTemperatureAlarm || ''}
          onChange={(e) => step.updateField('maxTemperatureAlarm', parseFloat(e.target.value))}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
        <label>
          <input
            type="checkbox"
            checked={step.data.pressureReliefValve || false}
            onChange={(e) => step.updateField('pressureReliefValve', e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Pressure Relief Valve Enabled
        </label>
      </div>
    </div>
  );
}

