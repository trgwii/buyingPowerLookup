// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// Copyright Joyent, Inc. and Node.js contributors. All rights reserved. MIT license.
import { default as randomBytes } from "https://deno.land/std@0.119.0/node/_crypto/randomBytes.ts";
import randomFill, {
  randomFillSync,
} from "https://deno.land/std@0.119.0/node/_crypto/randomFill.ts";
import randomInt from "https://deno.land/std@0.119.0/node/_crypto/randomInt.ts";
import {
  crypto as wasmCrypto,
  DigestAlgorithm,
  digestAlgorithms,
} from "https://deno.land/std@0.119.0/_wasm_crypto/mod.ts";
import {
  pbkdf2,
  pbkdf2Sync,
} from "https://deno.land/std@0.119.0/node/_crypto/pbkdf2.ts";
import { Buffer } from "https://deno.land/std@0.119.0/node/buffer.ts";
import { Transform } from "https://deno.land/std@0.119.0/node/stream.ts";
import { encode as encodeToHex } from "https://deno.land/std@0.119.0/encoding/hex.ts";
import { encode as encodeToBase64 } from "https://deno.land/std@0.119.0/encoding/base64.ts";
import {
  scrypt,
  scryptSync,
} from "https://deno.land/std@0.119.0/node/_crypto/scrypt.ts";
import { timingSafeEqual } from "https://deno.land/std@0.119.0/node/_crypto/timingSafeEqual.ts";
import type { TransformOptions } from "https://deno.land/std@0.119.0/node/_stream.d.ts";

const coerceToBytes = (data: string | BufferSource) => {
  if (data instanceof Uint8Array) return data;

  // This assumes UTF-8, which may not be correct.
  if (typeof data === "string") return new TextEncoder().encode(data);

  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  if (data instanceof ArrayBuffer) return new Uint8Array(data);

  throw new TypeError("expected data to be string | BufferSource");
};

/**
 * The Hash class is a utility for creating hash digests of data. It can be used in one of two ways:
 *
 * - As a stream that is both readable and writable, where data is written to produce a computed hash digest on the readable side, or
 * - Using the hash.update() and hash.digest() methods to produce the computed hash.
 *
 * The crypto.createHash() method is used to create Hash instances. Hash objects are not to be created directly using the new keyword.
 */
export class Hash extends Transform {
  #context: wasmCrypto.DigestContext;

  constructor(
    algorithm: string | wasmCrypto.DigestContext,
    _opts?: TransformOptions,
  ) {
    super({
      transform(chunk: string, _encoding: string, callback: () => void): void {
        context.update(coerceToBytes(chunk));
        callback();
      },
      flush(callback: () => void): void {
        this.push(context.digest(undefined));
        callback();
      },
    });

    if (typeof algorithm === "string") {
      // Node/OpenSSL and WebCrypto format some digest names differently;
      // we attempt to handle those here.
      algorithm = algorithm.toUpperCase();
      if (opensslToWebCryptoDigestNames[algorithm]) {
        algorithm = opensslToWebCryptoDigestNames[algorithm];
      }
      this.#context = new wasmCrypto.DigestContext(
        algorithm as DigestAlgorithm,
      );
    } else {
      this.#context = algorithm;
    }

    const context = this.#context;
  }

  copy(): Hash {
    return new Hash(this.#context.clone());
  }

  /**
   * Updates the hash content with the given data.
   */
  update(data: string | ArrayBuffer, _encoding?: string): this {
    let bytes;
    if (typeof data === "string") {
      data = new TextEncoder().encode(data);
      bytes = coerceToBytes(data);
    } else {
      bytes = coerceToBytes(data);
    }

    this.#context.update(bytes);

    return this;
  }

  /**
   * Calculates the digest of all of the data.
   *
   * If encoding is provided a string will be returned; otherwise a Buffer is returned.
   *
   * Supported encoding is currently 'hex', 'binary', 'base64'.
   */
  digest(encoding?: string): Buffer | string {
    const digest = this.#context.digest(undefined);
    if (encoding === undefined) {
      return Buffer.from(digest);
    }

    switch (encoding) {
      case "hex":
        return new TextDecoder().decode(encodeToHex(new Uint8Array(digest)));
      case "binary":
        return String.fromCharCode(...digest);
      case "base64":
        return encodeToBase64(digest);
      default:
        throw new Error(
          `The output encoding for hash digest is not implemented: ${encoding}`,
        );
    }
  }
}

/**
 * Supported digest names that OpenSSL/Node and WebCrypto identify differently.
 */
const opensslToWebCryptoDigestNames: Record<string, DigestAlgorithm> = {
  BLAKE2B512: "BLAKE2B",
  BLAKE2S256: "BLAKE2S",
  RIPEMD160: "RIPEMD-160",
  RMD160: "RIPEMD-160",
  SHA1: "SHA-1",
  SHA224: "SHA-224",
  SHA256: "SHA-256",
  SHA384: "SHA-384",
  SHA512: "SHA-512",
};

/**
 * Creates and returns a Hash object that can be used to generate hash digests
 * using the given `algorithm`. Optional `options` argument controls stream behavior.
 */
export function createHash(algorithm: string, opts?: TransformOptions) {
  return new Hash(algorithm, opts);
}

/**
 * Returns an array of the names of the supported hash algorithms, such as 'sha1'.
 */
export function getHashes(): readonly string[] {
  return digestAlgorithms;
}

const randomUUID = () => crypto.randomUUID();

import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

export function createHmac(algorithm: string, key: string) {
  let buf: string[] = [];
  const Hmac = {
    update: (data: string) => {
      buf.push(data);
      return Hmac;
    },
    digest: (format: string) => {
      return hmac(algorithm, key, buf.join(""), "utf8", format);
    },
  };
  return Hmac;
}

export default {
  Hash,
  createHash,
  createHmac,
  getHashes,
  randomFill,
  randomInt,
  randomFillSync,
  pbkdf2,
  pbkdf2Sync,
  randomBytes,
  scrypt,
  scryptSync,
  timingSafeEqual,
  randomUUID,
};
export {
  pbkdf2,
  pbkdf2Sync,
  randomBytes,
  randomFill,
  randomFillSync,
  randomInt,
  randomUUID,
  scrypt,
  scryptSync,
  timingSafeEqual,
};
