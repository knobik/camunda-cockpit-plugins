import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import image from '@rollup/plugin-image';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import scss from 'rollup-plugin-scss';
import typescript from '@rollup/plugin-typescript';

const plugins = [
  replace({
    preventAssignment: true,
    'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? JSON.stringify('production') : null,
    '"use client";': '',
    '\'use client\';': '',
  }),
  alias({
    entries: [{ find: 'inherits', replacement: 'inherits/inherits_browser' }],
  }),
  resolve(),
  commonjs({
    include: 'node_modules/**',
  }),
  typescript(),
  image(),
  json(),
  scss({
    insert: true,
  }),
];

function onwarn(warning, superOnWarn) {
  if (
    warning.code === 'THIS_IS_UNDEFINED' ||
    warning.message.includes('Module level directives')
  ) {
    return;
  }
  superOnWarn(warning);
}

export default [
  {
    input: 'src/RobotModule/index.ts',
    output: {
      file: 'robot-module.js',
    },
    plugins,
  },
  {
    onwarn,
    input: 'src/instance-historic-activities.tsx',
    output: {
      file: 'instance-historic-activities.js',
    },
    plugins,
  },
  {
    onwarn,
    input: 'src/definition-historic-activities.tsx',
    output: {
      file: 'definition-historic-activities.js',
    },
    plugins,
  },
  {
    onwarn,
    input: 'src/instance-route-history.tsx',
    output: {
      file: 'instance-route-history.js',
    },
    plugins,
  },
  {
    onwarn,
    input: 'src/tasklist-audit-log.tsx',
    output: {
      file: 'tasklist-audit-log.js',
    },
    plugins,
  },
  {
    onwarn,
    input: 'src/instance-tab-modify.tsx',
    output: {
      file: 'instance-tab-modify.js',
    },
    plugins,
  },
  {
    onwarn,
    input: 'src/definition-batch-modify.tsx',
    output: {
      file: 'definition-batch-modify.js',
    },
    plugins,
  },
  {
    onwarn,
    input: 'src/definition-batch-retry.tsx',
    output: {
      file: 'definition-batch-retry.js',
    },
    plugins,
  },
];
