import { escapeRegex, sanitize } from './core/sanitize';
import type { Detection, Entity, Methods, ScanResult } from './core/types';
import { REGISTRY } from './entities/countries';

/** Detections scoring below this are dropped. */
const MIN_SCORE = 0.4;

/** Added to the base score when a context term shows up near the match. */
const CONTEXT_BOOST = 0.35;

/** The boost never leaves a detection below this, however low its base score. */
const MIN_SCORE_AFTER_BOOST = 0.4;

/** Scanned on each side of a match looking for context terms. */
const CONTEXT_WINDOW_CHARS = 40;

/**
 * The token that replaces a detection.
 *
 * No ordinal on purpose: every ES_NIF becomes `<ES_NIF>`, so two different
 * people read the same downstream. Numbering them (`<ES_NIF_1>`, `<ES_NIF_2>`)
 * would keep them apart, at the cost of a noisier text.
 */
const placeholder = (detection: Detection) => `<${detection.entity}>`;

/**
 * Regex-only PII detection and anonymization for European entities.
 *
 * There is nothing to configure: `new Nerium().text(document, true)` runs the
 * whole registry. Results carry `category` and `country`, so narrowing them down
 * is a filter over the output rather than a setting on the way in.
 */
export class Nerium implements Methods {
  /**
   * Finds every entity in `text` and gives back the masked text plus what was
   * found. With `anonymizes = false` a text carrying PII is blocked instead,
   * and the blocked result carries no text at all.
   */
  text(text: string, anonymizes: boolean): ScanResult {
    const entities = detect(text);

    if (!anonymizes && entities.length > 0) {
      return { blocked: true, entities };
    }

    return {
      blocked: false,
      anonymized_text: mask(text, entities),
      entities,
    };
  }

  supported_entities(): Entity[] {
    return [...REGISTRY];
  }
}

/**
 * Compiles the patterns and runs them, right here on every call.
 *
 * Compiling is 0.8% of the cost of a document — the search is what costs — and
 * building the RegExp inside the call makes the classic `lastIndex` bug
 * impossible: a shared RegExp carrying `g` remembers where it stopped, so the
 * second call would quietly return fewer matches than the first.
 */
function detect(text: string): Detection[] {
  const found: Detection[] = [];

  for (const entity of REGISTRY) {
    for (const pattern of entity.patterns) {
      const regex = new RegExp(
        pattern.regex,
        pattern.caseSensitive ? 'gsm' : 'gsmi',
      );

      for (const match of text.matchAll(regex)) {
        const value = match[0];
        const start = match.index;

        if (value === '') continue;

        const scored = score(entity, pattern.score, text, start, value);
        if (scored === null) continue;

        found.push({
          entity: entity.name,
          category: entity.category,
          country: entity.country,
          start,
          end: start + value.length,
          score: scored.score,
          value,
          pattern: pattern.name,
          confirmedBy: scored.confirmedBy,
        });
      }
    }
  }

  return resolveOverlaps(found);
}

/** Applies the checksum, the context words and the threshold. `null` drops it. */
function score(
  entity: Entity,
  base: number,
  text: string,
  start: number,
  value: string,
): Pick<Detection, 'score' | 'confirmedBy'> | null {
  const validation = entity.validation;
  const verdict = validation?.run(sanitize(value), value) ?? null;

  // A `filter` never confirms, so a `true` coming from one is ignored.
  if (verdict === false && validation?.kind === 'filter') return null;

  // A failed checksum is not fatal: the context below can still rescue it.
  if (verdict === true && validation?.kind === 'checksum') {
    return { score: 1, confirmedBy: 'checksum' };
  }

  let current = base;
  let confirmedBy: Detection['confirmedBy'] = null;

  if (
    entity.context !== undefined &&
    nearby(text, start, value.length, entity.context)
  ) {
    current = Math.min(
      1,
      Math.max(MIN_SCORE_AFTER_BOOST, current + CONTEXT_BOOST),
    );
    confirmedBy = 'context';
  }

  if (current < MIN_SCORE) return null;

  return { score: Math.round(current * 100) / 100, confirmedBy };
}

/**
 * Looks for any of `terms` in the window around the match.
 *
 * The word boundaries are conditional because `\b` is ASCII-only: `à` is not a
 * word character, so `\bcarta di identità\b` can never match — there is no
 * boundary after a non-word character. Terms ending or starting in an accented
 * letter get no `\b` on that side, which is the whole point of the Italian and
 * German context words existing at all.
 */
function nearby(
  text: string,
  start: number,
  length: number,
  terms: readonly string[],
): boolean {
  const around = text.slice(
    Math.max(0, start - CONTEXT_WINDOW_CHARS),
    start + length + CONTEXT_WINDOW_CHARS,
  );

  return terms.some((term) => {
    const left = /^\w/.test(term) ? String.raw`\b` : '';
    const right = /\w$/.test(term) ? String.raw`\b` : '';

    return new RegExp(`${left}${escapeRegex(term)}${right}`, 'i').test(around);
  });
}

function resolveOverlaps(detections: Detection[]): Detection[] {
  const ranked = [...detections].sort(
    (a, b) =>
      b.score - a.score ||
      b.end - b.start - (a.end - a.start) ||
      a.start - b.start ||
      a.entity.localeCompare(b.entity),
  );

  const kept: Detection[] = [];

  for (const candidate of ranked) {
    const clashes = kept.some(
      (winner) => candidate.start < winner.end && winner.start < candidate.end,
    );

    if (!clashes) kept.push(candidate);
  }

  return kept.sort((a, b) => a.start - b.start || a.end - b.end);
}

/**
 * Replaces every detection with its token, right to left.
 *
 * Right to left because a token rarely has the same length as the value it
 * replaces, so going forwards would shift every offset still pending.
 */
function mask(text: string, detections: readonly Detection[]): string {
  return [...detections]
    .sort((a, b) => b.start - a.start)
    .reduce(
      (masked, detection) =>
        masked.slice(0, detection.start) +
        placeholder(detection) +
        masked.slice(detection.end),
      text,
    );
}
