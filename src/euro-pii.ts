import { actionOf, plan, select } from './core/options';
import { escapeRegex, sanitize } from './core/sanitize';
import type {
  AnonymizeOptions,
  AnonymizeResult,
  Country,
  Detection,
  Entity,
  EntityName,
  Kind,
  Methods,
  Selection,
} from './core/types';
import { CATALOG, REGISTRY } from './entities';

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
 */
const placeholder = (detection: Detection) => `<${detection.entity}>`;

export class EuroPii implements Methods {
  /** Detects only, and leaves the decision to the caller. */
  scan(text: string, selection?: Selection): Detection[] {
    return detect(text, select(selection));
  }

  /**
   * Detects and applies the policy. Any detection whose action is `'block'`
   * blocks the whole text, and the result then carries no text at all.
   */
  anonymize(text: string, options: AnonymizeOptions = {}): AnonymizeResult {
    const policy = options.policy ?? {};
    const entities = detect(text, plan(options));
    const actionFor = (detection: Detection) =>
      actionOf(policy, detection.entity, detection.kind);

    const blocked_by = entities.filter((d) => actionFor(d) === 'block');
    if (blocked_by.length > 0) {
      return { blocked: true, blocked_by, entities };
    }

    return {
      blocked: false,
      anonymized_text: mask(
        text,
        entities.filter((d) => actionFor(d) === 'mask'),
      ),
      entities,
    };
  }

  supported_entities(): Entity[] {
    return [...REGISTRY];
  }

  /** Every country with the names of its entities, in registry order. */
  supported_countries(): Record<Country, EntityName[]> {
    return Object.fromEntries(
      Object.entries(CATALOG).map(([country, names]) => [country, [...names]]),
    ) as Record<Country, EntityName[]>;
  }

  /**
   * The kinds some entity uses, alphabetically, with the names of their
   * entities in registry order. A `Kind` no entity uses is left out: `PHONE`
   * is declared but nothing detects it.
   */
  supported_kinds(): Partial<Record<Kind, EntityName[]>> {
    const byKind: Partial<Record<Kind, EntityName[]>> = {};

    for (const entity of REGISTRY) {
      (byKind[entity.kind] ??= []).push(entity.name);
    }

    return Object.fromEntries(
      Object.entries(byKind).sort(([a], [b]) => a.localeCompare(b)),
    );
  }
}

/**
 * Compiles the patterns and runs them, right here on every call.
 *
 * Compiling is 0.8% of the cost of a document — the search is what costs — and
 * building the RegExp inside the call makes the classic `lastIndex` bug
 * impossible: a shared RegExp carrying `g` remembers where it stopped, so the
 * second call would quietly return fewer matches than the first.
 *
 * Only `entities` run, which is why the selection happens before detecting and
 * not by filtering the output: an entity left out could otherwise win an
 * overlap and take a wanted detection down with it.
 */
function detect(text: string, entities: readonly Entity[]): Detection[] {
  const found: Detection[] = [];

  for (const entity of entities) {
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
          kind: entity.kind,
          dataClass: entity.dataClass,
          identifiability: entity.identifiability,
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
