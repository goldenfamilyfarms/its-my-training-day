/**
 * Form Handling with Advanced Validation
 * 
 * Implements robust form handling with complex validation rules,
 * async validation, field dependencies, and error recovery using
 * React Hook Form and Zod.
 */

import React, { useEffect, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema
const equipmentConfigSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment ID is required'),
  
  temperatureThreshold: z.number()
    .min(0, 'Temperature must be positive')
    .max(2000, 'Temperature cannot exceed 2000°C'),
  
  pressureRange: z.object({
    min: z.number(),
    max: z.number(),
  }).refine(
    (data) => data.min < data.max,
    {
      message: 'Minimum pressure must be less than maximum',
      path: ['min'],
    }
  ),
  
  sensors: z.array(z.object({
    id: z.string(),
    type: z.enum(['temperature', 'pressure', 'vacuum', 'flow_rate']),
    enabled: z.boolean(),
    pollingInterval: z.number()
      .min(1000, 'Minimum polling interval is 1 second')
      .max(60000, 'Maximum polling interval is 60 seconds'),
    calibrationDate: z.string().datetime().optional(),
  })).min(1, 'At least one sensor must be configured'),
  
  notificationEmail: z.string()
    .email('Invalid email address')
    .or(z.literal('')),
  
  alertSettings: z.object({
    enabled: z.boolean(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    recipients: z.array(z.string().email()).min(1).optional(),
  }).refine(
    (data) => !data.enabled || (data.recipients && data.recipients.length > 0),
    {
      message: 'At least one recipient required when alerts enabled',
      path: ['recipients'],
    }
  ),
  
  maintenanceSchedule: z.object({
    frequency: z.enum(['weekly', 'monthly', 'quarterly']),
    nextDate: z.string().datetime(),
  }).refine(
    (data) => new Date(data.nextDate) > new Date(),
    {
      message: 'Maintenance date must be in the future',
      path: ['nextDate'],
    }
  ),
});

type EquipmentConfigFormData = z.infer<typeof equipmentConfigSchema>;

// Custom hook for form management
export function useEquipmentConfigForm(
  initialData?: Partial<EquipmentConfigFormData>,
  onSubmit?: (data: EquipmentConfigFormData) => Promise<void>
) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty, isValid },
    watch,
    setValue,
    getValues,
    trigger,
    reset,
    setError,
    clearErrors,
  } = useForm<EquipmentConfigFormData>({
    resolver: zodResolver(equipmentConfigSchema),
    mode: 'onBlur',
    defaultValues: {
      sensors: [
        {
          id: 'sensor-1',
          type: 'temperature',
          enabled: true,
          pollingInterval: 5000,
        },
      ],
      alertSettings: {
        enabled: false,
        severity: 'medium',
      },
      ...initialData,
    },
  });

  const {
    fields: sensorFields,
    append: appendSensor,
    remove: removeSensor,
    update: updateSensor,
  } = useFieldArray({
    control,
    name: 'sensors',
  });

  const alertsEnabled = watch('alertSettings.enabled');
  const selectedSensors = watch('sensors');

  // Async validation for equipment ID uniqueness
  const validateEquipmentId = useCallback(async (equipmentId: string) => {
    try {
      const response = await fetch(`/api/equipment/validate/${equipmentId}`);
      const { exists } = await response.json();

      if (exists) {
        setError('equipmentId', {
          type: 'manual',
          message: 'Equipment ID already exists',
        });
        return false;
      }

      clearErrors('equipmentId');
      return true;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }, [setError, clearErrors]);

  // Cross-field validation
  const validateForm = useCallback(async () => {
    const values = getValues();

    const hasTempSensor = values.sensors.some(s => s.type === 'temperature');
    if (hasTempSensor && values.temperatureThreshold < 100) {
      setError('temperatureThreshold', {
        type: 'manual',
        message: 'Temperature threshold seems unusually low for selected sensors',
      });
      return false;
    }

    return true;
  }, [getValues, setError]);

  const onSubmitForm = handleSubmit(async (data) => {
    try {
      const isValid = await validateForm();
      if (!isValid) return;

      await onSubmit?.(data);
      reset(data);
    } catch (error) {
      if (error instanceof Error) {
        setError('root.serverError', {
          type: 'manual',
          message: error.message,
        });
      }
    }
  });

  const addSensor = useCallback((type: 'temperature' | 'pressure' | 'vacuum' | 'flow_rate') => {
    appendSensor({
      id: `sensor-${Date.now()}`,
      type,
      enabled: true,
      pollingInterval: 5000,
    });
  }, [appendSensor]);

  const saveDraft = useCallback(async () => {
    const values = getValues();
    try {
      await fetch('/api/equipment/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  }, [getValues]);

  return {
    register,
    control,
    errors,
    isSubmitting,
    isDirty,
    isValid,
    watch,
    setValue,
    trigger,
    reset,
    onSubmit: onSubmitForm,
    sensorFields,
    addSensor,
    removeSensor,
    updateSensor,
    validateEquipmentId,
    validateForm,
    saveDraft,
    alertsEnabled,
    selectedSensors,
  };
}

// Form component
interface EquipmentConfigFormProps {
  initialData?: Partial<EquipmentConfigFormData>;
  onSuccess?: (data: EquipmentConfigFormData) => void;
}

export function EquipmentConfigForm({ initialData, onSuccess }: EquipmentConfigFormProps) {
  const {
    register,
    control,
    errors,
    isSubmitting,
    isDirty,
    onSubmit,
    sensorFields,
    addSensor,
    removeSensor,
    validateEquipmentId,
    saveDraft,
    alertsEnabled,
  } = useEquipmentConfigForm(initialData, async (data) => {
    const response = await fetch('/api/equipment/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to save configuration');
    }

    onSuccess?.(data);
  });

  // Autosave draft
  useEffect(() => {
    if (isDirty) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 30000); // Save every 30 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [isDirty, saveDraft]);

  return (
    <form onSubmit={onSubmit} className="equipment-config-form">
      {errors.root?.serverError && (
        <div role="alert" className="error-banner">
          <strong>Error:</strong> {errors.root.serverError.message}
        </div>
      )}

      {isDirty && (
        <div className="autosave-indicator">
          <span>Unsaved changes</span>
          <button type="button" onClick={saveDraft} disabled={isSubmitting}>
            Save Draft
          </button>
        </div>
      )}

      <div className="form-section">
        <h2>Basic Configuration</h2>
        
        <div className="form-group">
          <label htmlFor="equipmentId">Equipment ID *</label>
          <input
            id="equipmentId"
            {...register('equipmentId')}
            onBlur={(e) => {
              if (e.target.value) {
                validateEquipmentId(e.target.value);
              }
            }}
            aria-invalid={!!errors.equipmentId}
            aria-describedby={errors.equipmentId ? 'equipmentId-error' : undefined}
          />
          {errors.equipmentId && (
            <span id="equipmentId-error" role="alert">
              {errors.equipmentId.message}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="temperatureThreshold">Temperature Threshold (°C) *</label>
          <input
            id="temperatureThreshold"
            type="number"
            {...register('temperatureThreshold', { valueAsNumber: true })}
            aria-invalid={!!errors.temperatureThreshold}
          />
          {errors.temperatureThreshold && (
            <span role="alert">{errors.temperatureThreshold.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Pressure Range</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="number"
              placeholder="Min"
              {...register('pressureRange.min', { valueAsNumber: true })}
            />
            <input
              type="number"
              placeholder="Max"
              {...register('pressureRange.max', { valueAsNumber: true })}
            />
          </div>
          {errors.pressureRange && (
            <span role="alert">{errors.pressureRange.message}</span>
          )}
        </div>
      </div>

      <div className="form-section">
        <h2>Sensors</h2>
        {sensorFields.map((field, index) => (
          <div key={field.id} className="sensor-item">
            <Controller
              name={`sensors.${index}.type`}
              control={control}
              render={({ field }) => (
                <select {...field}>
                  <option value="temperature">Temperature</option>
                  <option value="pressure">Pressure</option>
                  <option value="vacuum">Vacuum</option>
                  <option value="flow_rate">Flow Rate</option>
                </select>
              )}
            />
            <input
              type="number"
              placeholder="Polling Interval (ms)"
              {...register(`sensors.${index}.pollingInterval`, { valueAsNumber: true })}
            />
            <label>
              <input
                type="checkbox"
                {...register(`sensors.${index}.enabled`)}
              />
              Enabled
            </label>
            <button type="button" onClick={() => removeSensor(index)}>
              Remove
            </button>
          </div>
        ))}
        <div>
          <button type="button" onClick={() => addSensor('temperature')}>
            Add Temperature Sensor
          </button>
          <button type="button" onClick={() => addSensor('pressure')}>
            Add Pressure Sensor
          </button>
        </div>
        {errors.sensors && (
          <span role="alert">{errors.sensors.message}</span>
        )}
      </div>

      <div className="form-section">
        <h2>Alert Settings</h2>
        <label>
          <input type="checkbox" {...register('alertSettings.enabled')} />
          Enable Alerts
        </label>
        
        {alertsEnabled && (
          <div>
            <label>Severity</label>
            <select {...register('alertSettings.severity')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            
            <Controller
              name="alertSettings.recipients"
              control={control}
              render={({ field }) => (
                <div>
                  <label>Recipients (comma-separated emails)</label>
                  <input
                    {...field}
                    onChange={(e) => {
                      const emails = e.target.value.split(',').map(email => email.trim());
                      field.onChange(emails);
                    }}
                  />
                </div>
              )}
            />
          </div>
        )}
        {errors.alertSettings && (
          <span role="alert">{errors.alertSettings.message}</span>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Saving...' : 'Save Configuration'}
        </button>
        <button type="button" onClick={() => reset()}>
          Reset
        </button>
      </div>
    </form>
  );
}

