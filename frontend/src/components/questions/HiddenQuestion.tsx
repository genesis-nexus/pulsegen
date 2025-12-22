import { useEffect, useRef } from 'react';
import { Question } from '../../types';

interface HiddenQuestionProps {
  question: Question;
  onChange?: (value: any) => void;
  value?: any;
}

export default function HiddenQuestion({ question, onChange, value }: HiddenQuestionProps) {
  const settings = question.settings || {};

  const initialized = useRef(false);

  useEffect(() => {
    // Prevent infinite loops: only populate if value is missing and we haven't done it yet
    if (value || initialized.current || !onChange) return;

    let hiddenValue = settings.defaultValue || '';

    // Handle different value sources
    if (settings.valueSource === 'url_param' && settings.paramName) {
      const urlParams = new URLSearchParams(window.location.search);
      hiddenValue = urlParams.get(settings.paramName) || hiddenValue;
    } else if (settings.valueSource === 'session') {
      hiddenValue = sessionStorage.getItem(settings.paramName) || hiddenValue;
    }

    if (hiddenValue) {
      onChange({ textValue: hiddenValue });
      initialized.current = true;
    }
  }, [settings, onChange, value]);

  // Render nothing (hidden field)
  return null;
}
