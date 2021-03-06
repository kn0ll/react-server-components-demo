/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactModel} from 'react-server/src/ReactFlightServer';
import type {BundlerConfig} from './ReactFlightServerWebpackBundlerConfig';
import type {Writable} from 'stream';

import {
  createRequest,
  startWork,
  startFlowing,
  serverFunctionCache,
} from 'react-server/src/ReactFlightServer';

function createDrainHandler(destination, request) {
  return () => startFlowing(request);
}

type Options = {
  onError?: (error: mixed) => void,
};

function pipeToNodeWritable(
  model: ReactModel,
  destination: Writable,
  webpackMap: BundlerConfig,
  options?: Options,
): void {
  const request = createRequest(
    model,
    destination,
    webpackMap,
    options ? options.onError : undefined,
  );
  destination.on('drain', createDrainHandler(destination, request));
  startWork(request);
}

function handleServerFunctions(sendResponse) {
  return function (req, res, next) {
    const fn = serverFunctionCache.get(req.params.fnId)
    if (fn) {
      const result = fn(...req.body)
      if (result && result.then) {
        result.then((props) => sendResponse(props, res));
      } else {
        sendResponse(result, res)
      }
    } else {
      next()
    }
  }
}

export {pipeToNodeWritable, handleServerFunctions};
