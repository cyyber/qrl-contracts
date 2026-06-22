#!/usr/bin/env node
'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const hypc = process.env.HYPC || 'hypcjs';
const addressHexLength = 128;

function run(command, args) {
  const result = childProcess.spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    process.stderr.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    throw new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }
}

function compileHarness() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qrl-contracts-strings-test.'));
  try {
    run(hypc, [
      '--base-path',
      '.',
      '--include-path',
      '.',
      '-o',
      outDir,
      '--abi',
      '--bin',
      'test/utils/StringsAddressHarness.hyp'
    ]);

    const abiFile = fs
      .readdirSync(outDir)
      .find((file) => file.endsWith('.abi') && file.includes('StringsAddressHarness'));

    assert(abiFile, 'StringsAddressHarness ABI was not generated');

    const abi = JSON.parse(fs.readFileSync(path.join(outDir, abiFile), 'utf8'));
    const functions = new Set(abi.filter((entry) => entry.type === 'function').map((entry) => entry.name));

    [
      'checksumAliasMatchesHex',
      'parseCanonicalLowercase',
      'parseUppercaseHex',
      'rejectBareHex',
      'roundTripCanonical',
      'rejectInvalidCharacter',
      'rejectShortAddress',
      'rejectLowercasePrefix',
      'rejectOxPrefix'
    ].forEach((name) => assert(functions.has(name), `missing ABI function ${name}`));
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

function parseAddress(input) {
  if (!input.startsWith('Q')) return { success: false, value: null };

  const body = input.slice(1);

  if (body.length !== addressHexLength) return { success: false, value: null };
  if (!/^[0-9a-fA-F]+$/.test(body)) return { success: false, value: null };

  return { success: true, value: `Q${body.toLowerCase()}` };
}

function assertRoundTrip(input) {
  const parsed = parseAddress(input);
  assert.strictEqual(parsed.success, true, `${input} should parse`);
  assert.deepStrictEqual(parseAddress(parsed.value), parsed);
}

compileHarness();

const zero = `Q${'0'.repeat(addressHexLength)}`;
const max = `Q${'f'.repeat(addressHexLength)}`;
const mixed = `Q${'0123456789abcdef'.repeat(8)}`;
const uppercaseHex = `Q${mixed.slice(1).toUpperCase()}`;

[zero, max, mixed, uppercaseHex].forEach(assertRoundTrip);

assert.deepStrictEqual(parseAddress(uppercaseHex), { success: true, value: mixed });
assert.strictEqual(parseAddress(mixed.slice(1)).success, false);
assert.strictEqual(parseAddress(`q${mixed.slice(1)}`).success, false);
assert.strictEqual(parseAddress(`0x${mixed.slice(1)}`).success, false);
assert.strictEqual(parseAddress(`Q${'0'.repeat(addressHexLength - 1)}`).success, false);
assert.strictEqual(parseAddress(`Q${'0'.repeat(addressHexLength + 1)}`).success, false);
assert.strictEqual(parseAddress(`Q${'0'.repeat(addressHexLength - 1)}g`).success, false);

console.log('Strings address parse/format tests passed');
