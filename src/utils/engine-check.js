
/**
 * @fileoverview FlowDev  -  Intelligent CLI tool
 * @module flowdev
 * @version 1.2.0
 * * @license MIT
 * Copyright (c) 2026 FlowDev Technologies.
 * * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';

const LOCAL_MODEL = 'onnx-community/Qwen2.5-1.5B-Instruct';
const MAX_NEW_TOKENS = 2048;
const BAR_WIDTH = 30;

const HF_CACHE_DIR = path.join(os.homedir(), '.cache', 'huggingface', 'hub');
const MODEL_CACHE = path.join(HF_CACHE_DIR, 'models--onnx-community--Qwen2.5-1.5B-Instruct');

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '?';
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function renderBar(label, pct, loaded, total) {
  const filled = Math.round((pct / 100) * BAR_WIDTH);
  const empty = BAR_WIDTH - filled;
  const bar = chalk.green('#'.repeat(filled)) + chalk.dim('-'.repeat(empty));
  const pctStr = chalk.bold.white(`${String(Math.round(pct)).padStart(3)}%`);
  const sizeStr = chalk.dim(`${formatBytes(loaded)} / ${formatBytes(total)}`);
  const name = chalk.cyan(label.padEnd(20).slice(0, 20));
  process.stdout.write(`\r  ${name}  [${bar}]  ${pctStr}  ${sizeStr}   `);
}

function clearBar(label) {
  process.stdout.write('\r' + ' '.repeat(process.stdout.columns ?? 80) + '\r');
  console.log(`  ${chalk.green('[OK]')} ${chalk.cyan(label)}`);
}

async function isModelCached() {
  const snapshotsDir = path.join(MODEL_CACHE, 'snapshots');
  if (!(await fs.pathExists(snapshotsDir))) return false;
  const entries = await fs.readdir(snapshotsDir);
  return entries.length > 0;
}

let _pipeline = null;

async function getLocalPipeline(spinner) {
  if (_pipeline) return _pipeline;

  const { pipeline, env } = await import('@huggingface/transformers');
  
  
  env.logLevel = 'error'; 
  env.backends.onnx.wasm.numThreads = 4;

  const cached = await isModelCached();

  if (!cached) {
    if (spinner) spinner.stop();
    console.log(chalk.bold.magenta(`\n  First launch: Downloading Qwen2.5 (1.5B)...\n`));
    const seen = new Set();
    const onProgress = (ev) => {
      if (ev.status !== 'progress' && ev.status !== 'downloading') return;
      const label = ev.file ?? ev.name ?? 'chunk';
      if (!seen.has(label)) { seen.add(label); process.stdout.write('\n'); }
      renderBar(label, ev.progress ?? 0, ev.loaded ?? 0, ev.total ?? 0);
      if ((ev.progress ?? 0) >= 100) clearBar(label);
    };

    _pipeline = await pipeline('text-generation', LOCAL_MODEL, {
      dtype: 'q4',
      device: 'cpu',
      progress_callback: onProgress,
    });
    console.log(chalk.bold.green('\n  Model installed successfully!\n'));
    if (spinner) spinner.start();
  } else {
    _pipeline = await pipeline('text-generation', LOCAL_MODEL, {
      dtype: 'q4',
      device: 'cpu',
      local_files_only: true,
    });
  }
  return _pipeline;
}

export async function getAIResponse(messages, spinner) {
  const { TextStreamer } = await import('@huggingface/transformers');
  const generator = await getLocalPipeline(spinner);

  const queue = [];
  let resolver = null;
  let finished = false;

  const push = (token) => {
    if (resolver) { resolver({ value: token, done: false }); resolver = null; }
    else queue.push(token);
  };

  const streamer = new TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (text) => push(text),
  });

  generator(messages, {
    max_new_tokens: MAX_NEW_TOKENS,
    streamer,
    do_sample: true,
    temperature: 0.4, 
  }).then(() => {
    finished = true;
    if (resolver) resolver({ value: '', done: true });
  });

  return (async function* () {
    while (true) {
      if (queue.length > 0) {
        yield { message: { content: queue.shift() } };
      } else if (finished) {
        break;
      } else {
        const token = await new Promise((res) => { resolver = res; });
        if (token.done) break;
        yield { message: { content: token.value } };
      }
    }
  })();
}