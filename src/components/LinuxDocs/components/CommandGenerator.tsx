import { useMemo, useState } from 'react';
import { generatorPurposes } from '../data/generator';
import type { GeneratorPurposeId } from '../types/linuxDocs';
import { generateValidatedCommand } from '../lib/commandGenerator';
import { GeneratorAttributes } from './GeneratorAttributes';
import { GeneratorPurpose } from './GeneratorPurpose';
import { GeneratedCommand } from './GeneratedCommand';

export function CommandGenerator() {
  const [purposeId, setPurposeId] = useState<GeneratorPurposeId>('search-text');
  const purpose =
    generatorPurposes.find((item) => item.id === purposeId) ??
    generatorPurposes[0];
  const [values, setValues] = useState<Record<string, string | boolean>>(
    Object.fromEntries(
      purpose.attributes.map((attribute) => [
        attribute.id,
        attribute.type === 'boolean'
          ? attribute.defaultValue === 'true'
          : (attribute.defaultValue ?? ''),
      ]),
    ),
  );

  function changePurpose(id: string) {
    const next =
      generatorPurposes.find((item) => item.id === id) ?? generatorPurposes[0];
    setPurposeId(next.id);
    setValues(
      Object.fromEntries(
        next.attributes.map((attribute) => [
          attribute.id,
          attribute.type === 'boolean'
            ? attribute.defaultValue === 'true'
            : (attribute.defaultValue ?? ''),
        ]),
      ),
    );
  }

  const generated = useMemo(
    () => generateValidatedCommand(purpose, { purpose: purpose.id, values }),
    [purpose, values],
  );

  return (
    <section className="space-y-4">
      <GeneratorPurpose
        purposes={generatorPurposes}
        selected={purpose.id}
        onChange={changePurpose}
      />
      <GeneratorAttributes
        attributes={purpose.attributes}
        values={values}
        onChange={(id, value) =>
          setValues((current) => ({ ...current, [id]: value }))
        }
      />
      <GeneratedCommand
        command={generated.command}
        valid={generated.validation.valid}
        issues={generated.validation.issues}
      />
    </section>
  );
}
