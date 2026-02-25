
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
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CONFIG_PATH = path.join(os.homedir(), '.flowdev.json');

export const ConfigManager = {
  get() {
    if (!fs.existsSync(CONFIG_PATH)) {
      return {};
    }
    try {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  },

  remove(key) {
    const config = this.get();
    delete config[key];
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  },

  set(key, value) {
    const config = this.get();
    config[key] = value;
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
      return true;
    } catch (error) {
      console.error("Failed to save configuration.");
      return false;
    }
  },

  remove(key) {
    const config = this.get();
    delete config[key];
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  }
};