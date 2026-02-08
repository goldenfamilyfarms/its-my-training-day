/**
 * Sample Data Source Plugin - Query Editor Component
 *
 * This React component provides the UI for building queries in Grafana's
 * query panel. It allows users to:
 * - Enter query text
 * - Select metrics
 * - Add label filters
 * - Choose output format
 *
 * Key concepts demonstrated:
 * - Using Grafana UI components for query building
 * - Handling query model updates
 * - Label/tag filtering patterns
 * - Format selection (time series vs table)
 */

import React, { ChangeEvent, useState } from 'react';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import {
  InlineField,
  Input,
  Select,
  InlineFieldRow,
  CodeEditor,
  Button,
  IconButton,
  HorizontalGroup,
  VerticalGroup,
  InlineLabel,
  useStyles2,
} from '@grafana/ui';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

import { SampleDataSource } from '../datasource';
import { SampleQuery, SampleDataSourceOptions, defaultQuery } from '../types';

/**
 * Props interface for the QueryEditor component
 *
 * QueryEditorProps provides:
 * - datasource: The data source instance
 * - query: Current query configuration
 * - onChange: Callback to update the query
 * - onRunQuery: Callback to execute the query
 */
type Props = QueryEditorProps<SampleDataSource, SampleQuery, SampleDataSourceOptions>;

/**
 * Format options for the query output
 */
const formatOptions: Array<SelectableValue<string>> = [
  { label: 'Time Series', value: 'time_series', description: 'For graph panels' },
  { label: 'Table', value: 'table', description: 'For table panels' },
];

/**
 * Sample metric options (in a real plugin, these would come from the data source)
 */
const metricOptions: Array<SelectableValue<string>> = [
  { label: 'CPU Usage', value: 'cpu_usage' },
  { label: 'Memory Usage', value: 'memory_usage' },
  { label: 'Disk I/O', value: 'disk_io' },
  { label: 'Network Bytes', value: 'network_bytes' },
  { label: 'Request Count', value: 'request_count' },
  { label: 'Error Rate', value: 'error_rate' },
  { label: 'Latency P50', value: 'latency_p50' },
  { label: 'Latency P99', value: 'latency_p99' },
];

/**
 * Custom styles for the query editor
 */
const getStyles = (theme: GrafanaTheme2) => ({
  queryEditor: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  codeEditor: css`
    margin-bottom: ${theme.spacing(1)};
  `,
  labelRow: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(0.5)};
  `,
  labelKey: css`
    width: 120px;
  `,
  labelValue: css`
    width: 150px;
  `,
});

/**
 * QueryEditor Component
 *
 * This component renders the query builder interface. It's displayed
 * in the query panel when users are building queries for dashboards
 * or exploring data.
 *
 * Interview Tip: Query editors should:
 * - Provide intuitive UI for building queries
 * - Support both simple and advanced use cases
 * - Give immediate feedback (run query on change)
 * - Handle all query model fields
 */
export function QueryEditor(props: Props) {
  const { query, onChange, onRunQuery, datasource } = props;
  const styles = useStyles2(getStyles);

  // Local state for label editing
  const [newLabelKey, setNewLabelKey] = useState('');
  const [newLabelValue, setNewLabelValue] = useState('');

  // Ensure query has default values
  const currentQuery: SampleQuery = {
    ...defaultQuery,
    ...query,
  };

  /**
   * Handle query text changes
   *
   * Updates the query model and optionally runs the query.
   */
  const onQueryTextChange = (value: string) => {
    onChange({ ...currentQuery, queryText: value });
  };

  /**
   * Handle metric selection changes
   */
  const onMetricChange = (value: SelectableValue<string>) => {
    onChange({ ...currentQuery, metric: value.value || '' });
    onRunQuery();
  };

  /**
   * Handle format selection changes
   */
  const onFormatChange = (value: SelectableValue<string>) => {
    onChange({ ...currentQuery, format: value.value as 'time_series' | 'table' });
    onRunQuery();
  };

  /**
   * Add a new label filter
   */
  const onAddLabel = () => {
    if (newLabelKey && newLabelValue) {
      const labels = { ...(currentQuery.labels || {}), [newLabelKey]: newLabelValue };
      onChange({ ...currentQuery, labels });
      setNewLabelKey('');
      setNewLabelValue('');
      onRunQuery();
    }
  };

  /**
   * Remove a label filter
   */
  const onRemoveLabel = (key: string) => {
    const labels = { ...(currentQuery.labels || {}) };
    delete labels[key];
    onChange({ ...currentQuery, labels });
    onRunQuery();
  };

  /**
   * Run query when user presses Enter in the query text field
   */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      onRunQuery();
    }
  };

  return (
    <div className={styles.queryEditor}>
      {/* Query Text Editor */}
      <InlineFieldRow>
        <InlineField
          label="Query"
          labelWidth={12}
          tooltip="Enter your query expression. Use Ctrl+Enter to run."
          grow
        >
          <div className={styles.codeEditor}>
            <CodeEditor
              height="100px"
              language="sql"
              value={currentQuery.queryText || ''}
              onBlur={onQueryTextChange}
              onSave={onQueryTextChange}
              showMiniMap={false}
              showLineNumbers={true}
              monacoOptions={{
                wordWrap: 'on',
                minimap: { enabled: false },
              }}
            />
          </div>
        </InlineField>
      </InlineFieldRow>

      {/* Metric and Format Selection */}
      <InlineFieldRow>
        <InlineField label="Metric" labelWidth={12} tooltip="Select the metric to query">
          <Select
            width={30}
            options={metricOptions}
            value={metricOptions.find((o) => o.value === currentQuery.metric)}
            onChange={onMetricChange}
            placeholder="Select metric"
            isClearable
            allowCustomValue
            aria-label="Metric selection"
          />
        </InlineField>

        <InlineField label="Format" labelWidth={12} tooltip="Output format for the query results">
          <Select
            width={20}
            options={formatOptions}
            value={formatOptions.find((o) => o.value === currentQuery.format)}
            onChange={onFormatChange}
            aria-label="Format selection"
          />
        </InlineField>
      </InlineFieldRow>

      {/* Label Filters Section */}
      <VerticalGroup spacing="sm">
        <InlineLabel width="auto">
          <strong>Label Filters</strong>
        </InlineLabel>

        {/* Existing Labels */}
        {currentQuery.labels &&
          Object.entries(currentQuery.labels).map(([key, value]) => (
            <div key={key} className={styles.labelRow}>
              <Input
                className={styles.labelKey}
                value={key}
                disabled
                aria-label={`Label key: ${key}`}
              />
              <span>=</span>
              <Input
                className={styles.labelValue}
                value={value}
                disabled
                aria-label={`Label value: ${value}`}
              />
              <IconButton
                name="times"
                onClick={() => onRemoveLabel(key)}
                tooltip="Remove label"
                aria-label={`Remove label ${key}`}
              />
            </div>
          ))}

        {/* Add New Label */}
        <div className={styles.labelRow}>
          <Input
            className={styles.labelKey}
            value={newLabelKey}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLabelKey(e.target.value)}
            placeholder="key"
            aria-label="New label key"
          />
          <span>=</span>
          <Input
            className={styles.labelValue}
            value={newLabelValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewLabelValue(e.target.value)}
            placeholder="value"
            aria-label="New label value"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={onAddLabel}
            disabled={!newLabelKey || !newLabelValue}
            aria-label="Add label"
          >
            Add
          </Button>
        </div>
      </VerticalGroup>

      {/* Run Query Button */}
      <HorizontalGroup>
        <Button variant="primary" onClick={onRunQuery} aria-label="Run query">
          Run Query
        </Button>
      </HorizontalGroup>
    </div>
  );
}

/**
 * Component Design Notes
 *
 * This QueryEditor demonstrates several best practices:
 *
 * 1. **Code Editor**: Using CodeEditor for query text provides syntax
 *    highlighting and a better editing experience.
 *
 * 2. **Select Components**: Using Select for metrics and format provides
 *    autocomplete and validation.
 *
 * 3. **Label Filters**: Dynamic label management allows flexible filtering.
 *
 * 4. **Keyboard Shortcuts**: Ctrl+Enter to run query improves productivity.
 *
 * 5. **Immediate Feedback**: Running query on selection changes gives
 *    users immediate feedback.
 *
 * 6. **Accessibility**: aria-label attributes throughout for screen readers.
 *
 * Interview Tip: When discussing query editors, emphasize:
 * - User experience (autocomplete, validation, shortcuts)
 * - Flexibility (support simple and complex queries)
 * - Performance (debounce rapid changes if needed)
 * - Consistency with Grafana's patterns
 */
