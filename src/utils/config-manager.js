/**
 * @fileoverview FlowDev  -  Intelligent CLI tool
 * @module flowdev
 * @version 1.0.5
 *
 * @license MIT
 * Copyright (c) 2026 FlowDev Technologies.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 */

import Conf from 'conf';
const config = new Conf({
  projectName: 'flowdev-cli',
  projectSuffix: '' 
});


const CONFIG_KEYS = {
  DEEPSEEK_KEY: 'api_keys.deepseek',
  DEFAULT_PROVIDER: 'preferences.default_provider'
};

/**
 * 
 * @returns {string|undefined}
 */
export function getDeepSeekKey() {
  return config.get(CONFIG_KEYS.DEEPSEEK_KEY);
}

/**
 * 
 * @param {string} key 
 */
export function setDeepSeekKey(key) {
  if (!key) return;
  config.set(CONFIG_KEYS.DEEPSEEK_KEY, key);
}

export function clearDeepSeekKey() {
  config.delete(CONFIG_KEYS.DEEPSEEK_KEY);
}

export function getAllConfig() {
  return config.store;
}