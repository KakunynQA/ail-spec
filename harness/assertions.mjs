export function normalizeAssertion(assertion) {
  const kindMap = {
    contains_any: 'text_contains_any',
    contains_none: 'text_contains_none',
  };

  const kind = assertion.kind || kindMap[assertion.type] || assertion.type;
  return {
    id: assertion.id || assertion.label || 'unnamed_assertion',
    kind,
    dimension: assertion.dimension || 'unspecified',
    severity: assertion.severity || 'must',
    patterns: assertion.patterns || [],
    value: assertion.value,
  };
}

export function wordCount(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function assertionPasses(output, assertion) {
  const normalized = normalizeAssertion(assertion);
  const lower = output.toLowerCase();

  switch (normalized.kind) {
    case 'max_words':
      return wordCount(output) <= normalized.value;
    case 'text_contains_none':
      return !normalized.patterns.some(pattern => lower.includes(pattern.toLowerCase()));
    case 'text_contains_any':
      return normalized.patterns.some(pattern => lower.includes(pattern.toLowerCase()));
    default:
      return null;
  }
}

export function scoreAssertions(outputs, assertions) {
  return assertions.map(assertion => {
    const normalized = normalizeAssertion(assertion);
    const perSample = outputs.map(output => assertionPasses(output, normalized));
    const passable = perSample.filter(result => result !== null);
    const passRate = passable.length === 0
      ? 0
      : passable.filter(Boolean).length / passable.length;

    return {
      id: normalized.id,
      kind: normalized.kind,
      dimension: normalized.dimension,
      severity: normalized.severity,
      pass_rate: passRate,
      per_sample: perSample,
    };
  });
}

export function taskPasses(scores) {
  return scores.every(score => score.pass_rate >= 0.5);
}
