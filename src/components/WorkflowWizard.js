// WorkflowWizard — multi-step guided process with validation, save draft, context panel
// UX spec §5.3: Step indicator, per-step validation, save draft, back/next/cancel, completion summary

import { h, React } from '../lib/dom.js';

const STEPS = [
  {
    id: 'participant-info',
    label: 'Participant Info',
    description: 'Basic identification and entity details',
    fields: [
      { key: 'legalName', label: 'Legal Entity Name', type: 'text', required: true, placeholder: 'e.g., Goldman Sachs & Co. LLC' },
      { key: 'lei', label: 'LEI', type: 'text', required: true, placeholder: 'e.g., 5493000IBP32UQZ0KL24' },
      { key: 'jurisdiction', label: 'Jurisdiction of Incorporation', type: 'select', required: true, options: ['US', 'UK', 'DE', 'CH', 'SG', 'KY', 'IE', 'LU', 'BM', 'JP'] },
      { key: 'entityType', label: 'Entity Type', type: 'select', required: true, options: ['Corporation', 'Limited Partnership', 'LLC', 'Trust', 'Foundation', 'Sovereign Entity'] },
    ]
  },
  {
    id: 'document-collection',
    label: 'Documents',
    description: 'Upload constitutional and identification documents',
    fields: [
      { key: 'constitutionalDoc', label: 'Certificate of Incorporation', type: 'file', required: true },
      { key: 'articlesDoc', label: 'Articles of Association / Operating Agreement', type: 'file', required: true },
      { key: 'regulatoryStatus', label: 'Regulatory Status Doc', type: 'file', required: false },
      { key: 'taxResidency', label: 'Tax Residency Certificate (W-8/W-9)', type: 'file', required: true },
    ]
  },
  {
    id: 'screening-compliance',
    label: 'Screening & Compliance',
    description: 'Sanctions, PEP, and adverse media checks',
    fields: [
      { key: 'sanctionsCheck', label: 'Sanctions Screening', type: 'info', value: 'Auto-run on submission' },
      { key: 'pepStatus', label: 'PEP Classification', type: 'select', required: true, options: ['Non-PEP', 'Domestic PEP', 'Foreign PEP', 'International Organisation PEP', 'Close Associate', 'Family Member'] },
      { key: 'adverseMedia', label: 'Adverse Media Check', type: 'info', value: 'Auto-run on submission' },
      { key: 'riskClassification', label: 'Risk Classification', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Prohibited'] },
    ]
  },
  {
    id: 'account-setup',
    label: 'Account Setup',
    description: 'Bank accounts, wallets, and settlement instructions',
    fields: [
      { key: 'bankAccount', label: 'Primary Bank Account (IBAN)', type: 'text', required: true, placeholder: 'e.g., GB29NWBK60161331926819' },
      { key: 'bic', label: 'BIC/SWIFT', type: 'text', required: true, placeholder: 'e.g., NWBKGB2L' },
      { key: 'walletAddress', label: 'Digital Wallet Address', type: 'text', required: false, placeholder: '0x... (optional)' },
      { key: 'ssiReference', label: 'SSI Reference (DTCC ALERT)', type: 'text', required: false, placeholder: 'e.g., ALERT-12345' },
    ]
  },
  {
    id: 'review-submit',
    label: 'Review & Submit',
    description: 'Review all data before final submission',
    fields: [],
  }
];

export function WorkflowWizard({ title, onComplete, steps = STEPS, demoLabel = 'Demo workflow — changes are held in this session only.' }) {
  const workflowSteps = steps;
  const [currentStep, setCurrentStep] = React.useState(0);
  const [formData, setFormData] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [draftSaved, setDraftSaved] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);
  const [filePreviews, setFilePreviews] = React.useState({});

  const wizardTitle = title || 'Onboarding Case Manager: Goldman Sachs & Co.';
  const step = workflowSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === workflowSteps.length - 1;

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setTouched(prev => ({ ...prev, [key]: true }));
    // Clear error on change
    if (errors[key]) {
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const handleFileSelect = (key) => {
    // Simulate file selection
    setFilePreviews(prev => ({ ...prev, [key]: `file-${key}-${Date.now()}.pdf` }));
    updateField(key, `file-${key}-${Date.now()}.pdf`);
  };

  const validateStep = () => {
    const newErrors = {};
    if (step.fields) {
      step.fields.forEach(f => {
        if (f.required && !formData[f.key]) {
          if (f.type === 'file' && !filePreviews[f.key]) {
            newErrors[f.key] = `${f.label} is required`;
          } else if (f.type !== 'file' && !formData[f.key]) {
            newErrors[f.key] = `${f.label} is required`;
          }
        }
      });
    }
    return newErrors;
  };

  const handleNext = () => {
    if (isLastStep) {
      setSubmitted(true);
      if (onComplete) onComplete(formData);
      return;
    }
    const stepErrors = validateStep();
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const goToStep = (idx) => {
    if (idx < currentStep) {
      setErrors({});
      setCurrentStep(idx);
    }
  };

  const saveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const handleCancel = () => {
    const hasData = Object.values(formData).some(v => v);
    if (hasData) {
      setShowCancelConfirm(true);
    } else {
      resetWizard();
    }
  };

  const resetWizard = () => {
    setCurrentStep(0);
    setFormData({});
    setErrors({});
    setTouched({});
    setSubmitted(false);
    setShowCancelConfirm(false);
    setFilePreviews({});
  };

  // Build context summary from prior steps
  const priorStepsData = workflowSteps.slice(0, currentStep).filter(s => s.fields && s.fields.some(f => formData[f.key]));
  const contextSummary = {};
  priorStepsData.forEach(s => {
    s.fields.forEach(f => {
      if (formData[f.key]) contextSummary[f.key] = { label: f.label, value: formData[f.key] };
    });
  });

  if (submitted) {
    return h('div', { className: 'flex items-center justify-center h-full' },
      h('div', { className: 'text-center max-w-md p-8' },
        h('div', { className: 'text-5xl mb-4' }, '✅'),
        h('h2', { className: 'text-xl font-semibold text-slate-100 mb-2' }, 'Submission Complete'),
        h('p', { className: 'text-sm text-slate-400 mb-6' }, `Participant "${formData.legalName || 'Unknown'}" has been submitted for onboarding. Reference: ONB-${Date.now().toString(36).toUpperCase()}`),
        h('div', { className: 'flex gap-3 justify-center' },
          h('button', {
            className: 'px-4 py-2 bg-daos-600 hover:bg-daos-700 rounded text-sm font-medium focus-ring',
            onClick: resetWizard,
          }, 'View Participant 360'),
          h('button', {
            className: 'px-4 py-2 border border-surface-border rounded text-sm text-slate-400 hover:text-slate-200 hover:bg-surface-overlay focus-ring',
            onClick: resetWizard,
          }, 'Start New'),
        )
      )
    );
  }

  return h('div', { className: 'flex flex-col h-full' },
    // Step Indicator Bar
    h('div', { className: 'px-4 py-3 border-b border-surface-border bg-surface-raised/50' },
      h('div', { className: 'flex items-center justify-between mb-2' },
        h('div', {}, h('h2', { className: 'text-sm font-semibold text-slate-200' }, wizardTitle), h('p', { className: 'text-2xs text-slate-500 mt-0.5' }, demoLabel)),
        h('div', { className: 'flex items-center gap-2' },
          h('button', {
            className: 'px-3 py-1 text-xs text-slate-400 hover:text-slate-200 border border-surface-border rounded hover:bg-surface-overlay focus-ring',
            onClick: saveDraft,
          }, draftSaved ? '✓ Draft Saved' : '💾 Save Draft'),
        )
      ),
      // Step indicators
      h('div', { className: 'flex items-center gap-1', role: 'progressbar', 'aria-valuenow': currentStep + 1, 'aria-valuemin': 1, 'aria-valuemax': workflowSteps.length, 'aria-label': `Step ${currentStep + 1} of ${workflowSteps.length}` },
        ...workflowSteps.map((s, idx) => {
          const isComplete = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isFuture = idx > currentStep;

          return h('div', { key: s.id, className: 'flex items-center flex-1' },
            idx > 0 && h('div', { className: `flex-1 h-0.5 mx-1 rounded-full ${isComplete || isCurrent ? 'bg-daos-500' : 'bg-surface-border'}` }),
            h('button', {
              className: `flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors focus-ring whitespace-nowrap ${isComplete ? 'bg-daos-900/30 text-daos-300 hover:bg-daos-900/50 cursor-pointer' : isCurrent ? 'bg-daos-700 text-daos-100' : 'bg-transparent text-slate-500'}`,
              disabled: isFuture,
              onClick: () => goToStep(idx),
              'aria-current': isCurrent ? 'step' : undefined,
              title: isComplete ? `Go back to ${s.label}` : s.description,
            },
              isComplete ? h('span', { className: 'text-status-success' }, '✓') : h('span', { className: 'text-xs font-mono' }, `${idx + 1}`),
              h('span', { className: 'hidden sm:inline' }, s.label),
            )
          );
        })
      ),
    ),

    // Main content + context panel
    h('div', { className: 'flex-1 flex min-h-0' },
      // Step content
      h('div', { className: 'flex-1 overflow-auto scrollbar-thin p-6' },
        h('div', { className: 'max-w-2xl' },
          h('h3', { className: 'text-base font-semibold text-slate-100 mb-1' }, step.label),
          h('p', { className: 'text-sm text-slate-500 mb-6' }, step.description),

          step.fields && step.fields.map(field => {
            const fieldId = `field-${field.key}`;
            const hasError = errors[field.key];

            return h('div', { key: field.key, className: 'mb-4' },
              h('label', {
                htmlFor: fieldId,
                className: 'block text-xs font-medium text-slate-400 mb-1.5',
              }, `${field.label}${field.required ? ' *' : ''}`),
              field.type === 'text'
                ? h('input', {
                  id: fieldId,
                  type: 'text',
                  value: formData[field.key] || '',
                  onInput: (e) => updateField(field.key, e.target.value),
                  placeholder: field.placeholder || '',
                  className: `w-full px-3 py-2 bg-surface border rounded text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-daos-500 ${hasError ? 'border-status-danger' : touched[field.key] ? 'border-status-success/30' : 'border-surface-border'}`,
                  'aria-required': field.required,
                  'aria-invalid': String(!!hasError),
                  'aria-describedby': hasError ? `${fieldId}-error` : undefined,
                })
                : field.type === 'select'
                ? h('select', {
                  id: fieldId,
                  value: formData[field.key] || '',
                  onChange: (e) => updateField(field.key, e.target.value),
                  className: `w-full px-3 py-2 bg-surface border rounded text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-daos-500 ${hasError ? 'border-status-danger' : touched[field.key] ? 'border-status-success/30' : 'border-surface-border'}`,
                  'aria-required': field.required,
                  'aria-invalid': String(!!hasError),
                },
                  h('option', { value: '', disabled: true }, 'Select...'),
                  ...field.options.map(opt => h('option', { key: opt, value: opt }, opt))
                )
                : field.type === 'file'
                ? h('div', {},
                  h('div', {
                    className: `border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors focus-within:ring-1 focus-within:ring-daos-500 ${hasError ? 'border-status-danger' : filePreviews[field.key] ? 'border-status-success/30 bg-status-success/5' : 'border-surface-border hover:border-daos-500/50'}`,
                    tabIndex: 0,
                    role: 'button',
                    'aria-label': `Upload ${field.label}`,
                    onClick: () => handleFileSelect(field.key),
                    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleFileSelect(field.key); } },
                  },
                    filePreviews[field.key]
                      ? h('div', { className: 'flex items-center justify-center gap-2 text-xs text-slate-300' },
                        h('span', {}, '📄'),
                        h('span', {}, filePreviews[field.key]),
                        h('button', {
                          className: 'text-status-danger hover:text-status-danger/80',
                          onClick: (ev) => { ev.stopPropagation(); setFilePreviews(prev => { const n = { ...prev }; delete n[field.key]; return n; }); updateField(field.key, ''); },
                          'aria-label': 'Remove file'
                        }, '✕'),
                      )
                      : h('div', {},
                        h('div', { className: 'text-2xl text-slate-600 mb-1' }, '📤'),
                        h('p', { className: 'text-xs text-slate-500' }, `Click to select ${field.label}`),
                      ),
                  ),
                )
                : field.type === 'info'
                ? h('div', {
                  id: fieldId,
                  className: 'px-3 py-2 bg-surface rounded border border-surface-border text-sm text-slate-400',
                }, field.value)
                : null,
              hasError && h('p', { id: `${fieldId}-error`, className: 'mt-1 text-xs text-status-danger', role: 'alert' }, hasError),
            );
          }),

          // Review step
          isLastStep && h('div', { className: 'bg-surface rounded-lg border border-surface-border p-4' },
            h('h4', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Submission Summary'),
            h('div', { className: 'space-y-2' },
              ...workflowSteps.filter(s => s.fields).flatMap(s =>
                s.fields.filter(f => formData[f.key] || filePreviews[f.key]).map(f =>
                  h('div', { key: f.key, className: 'flex justify-between text-xs py-1 border-b border-surface-border last:border-0' },
                    h('span', { className: 'text-slate-500' }, f.label),
                    h('span', { className: 'text-slate-200 truncate ml-4' }, String(filePreviews[f.key] || formData[f.key])),
                  )
                )
              )
            ),
            h('p', { className: 'text-xs text-slate-500 mt-3' }, 'By submitting, you confirm all information is accurate and complete.'),
          ),
        )
      ),

      // Context Panel — right sidebar
      h('div', { className: 'w-72 border-l border-surface-border bg-surface p-4 overflow-auto scrollbar-thin hidden lg:block' },
        h('h4', { className: 'text-xs font-semibold text-slate-400 uppercase mb-3' }, 'Context Panel'),
        Object.keys(contextSummary).length === 0
          ? h('p', { className: 'text-xs text-slate-600 italic' }, 'Data from prior steps will appear here as you progress.')
          : h('div', { className: 'space-y-2' },
            ...Object.entries(contextSummary).map(([key, val]) =>
              h('div', { key, className: 'py-1.5 px-2 bg-surface rounded border border-surface-border' },
                h('div', { className: 'text-2xs text-slate-500' }, val.label),
                h('div', { className: 'text-xs text-slate-200 mt-0.5 break-all' }, String(val.value)),
              )
            ),
            h('div', { className: 'mt-4 pt-4 border-t border-surface-border' },
              h('div', { className: 'text-2xs text-slate-500 mb-1' }, 'Wizard Progress'),
              h('div', { className: 'text-xs text-slate-300' }, `Step ${currentStep + 1} of ${workflowSteps.length} — "${step.label}"`),
              h('div', { className: 'text-2xs text-slate-500 mt-1' }, `${currentStep} of ${workflowSteps.length - 1} steps completed`),
            )
          )
      ),
    ),

    // Bottom navigation
    h('div', { className: 'flex items-center justify-between px-6 py-3 border-t border-surface-border bg-surface-raised/30' },
      h('button', {
        className: 'px-4 py-2 text-sm text-slate-400 hover:text-status-danger border border-surface-border rounded hover:bg-surface-overlay focus-ring',
        onClick: handleCancel,
      }, 'Cancel'),
      h('div', { className: 'flex items-center gap-3' },
        !isFirstStep && h('button', {
          className: 'px-4 py-2 text-sm text-slate-300 border border-surface-border rounded hover:bg-surface-overlay focus-ring',
          onClick: handleBack,
        }, '← Back'),
        h('button', {
          className: `px-5 py-2 text-sm font-medium rounded focus-ring ${isLastStep ? 'bg-status-success hover:bg-status-success/90 text-white' : 'bg-daos-600 hover:bg-daos-700 text-white'}`,
          onClick: handleNext,
        }, isLastStep ? '✓ Submit for Approval' : 'Next →'),
      )
    ),

    // Cancel confirmation modal
    showCancelConfirm && h('div', {
      className: 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in',
      onClick: () => setShowCancelConfirm(false),
      role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Cancel wizard'
    },
      h('div', {
        className: 'bg-surface-raised border border-surface-border rounded-lg p-6 w-96 shadow-2xl',
        onClick: (e) => e.stopPropagation()
      },
        h('h3', { className: 'text-lg font-semibold text-slate-100 mb-2' }, 'Cancel Wizard?'),
        h('p', { className: 'text-sm text-slate-400 mb-4' }, 'You have entered data in this wizard. Would you like to save a draft before exiting?'),
        h('div', { className: 'flex gap-3' },
          h('button', {
            className: 'flex-1 py-2 bg-surface border border-surface-border rounded text-sm text-slate-300 hover:bg-surface-overlay focus-ring',
            onClick: resetWizard,
          }, 'Discard'),
          h('button', {
            className: 'flex-1 py-2 bg-daos-600 hover:bg-daos-700 rounded text-sm text-white font-medium focus-ring',
            onClick: () => { saveDraft(); setShowCancelConfirm(false); },
          }, 'Save Draft & Exit'),
        ),
        h('button', {
          className: 'mt-3 w-full py-2 text-sm text-slate-400 hover:text-slate-200 focus-ring',
          onClick: () => setShowCancelConfirm(false),
        }, 'Continue Editing'),
      )
    ),
  );
}
