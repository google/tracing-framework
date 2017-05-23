/**
 * Copyright 2013 Google, Inc. All Rights Reserved.
 *
 * Use of this source code is governed by a BSD-style license that can be
 * found in the LICENSE file.
 */

/**
 * @fileoverview A JavaScript port of Merseene Twister algorithm.
 * Adapted from https://gist.github.com/banksean/300494
 * by Sean McCullough (banksean@gmail.com).
 *
 * @author benvanik@google.com (Ben Vanik)
 */

/*
  A C-program for MT19937, with initialization improved 2002/1/26.
  Coded by Takuji Nishimura and Makoto Matsumoto.

  Before using, initialize the state by using init_genrand(seed)
  or init_by_array(init_key, key_length).

  Copyright (C) 1997 - 2002, Makoto Matsumoto and Takuji Nishimura,
  All rights reserved.

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions
  are met:

    1. Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.

    2. Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

    3. The names of its contributors may not be used to endorse or promote
      products derived from this software without specific prior written
      permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
  "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
  LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
  A PARTICULAR PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL THE COPYRIGHT OWNER OR
  CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.


  Any feedback is very welcome.
  http://www.math.sci.hiroshima-u.ac.jp/~m-mat/MT/emt.html
  email: m-mat @ math.sci.hiroshima-u.ac.jp (remove space)
*/

goog.provide('wtf.math.MersenneTwister');



/**
 * Mersenne Twister (MT19937) implementation.
 * @param {number} seed Initial seed value.
 * @constructor
 */
wtf.math.MersenneTwister = function(seed) {
  /**
   * The array for the state vector.
   * @type {!Int32Array}
   * @private
   */
  this.mt_ = new Int32Array(wtf.math.MersenneTwister.N_);

  /**
   * mti == N + 1 means mt[N] is not initialized.
   * @type {number}
   * @private
   */
  this.mti_ = wtf.math.MersenneTwister.N_ + 1;

  this.initialize_(seed);
};


/**
 * @type {number}
 * @const
 * @private
 */
wtf.math.MersenneTwister.N_ = 624;


/**
 * @type {number}
 * @const
 * @private
 */
wtf.math.MersenneTwister.M_ = 397;


/**
 * Constant vector a.
 * mag01[x] = x * MATRIX_A  for x=0,1
 * @type {!Int32Array}
 * @const
 * @private
 */
wtf.math.MersenneTwister.MAG01_ = new Int32Array([0, 0x9908b0df]);


/**
 * Most significant w-r bits.
 * @type {number}
 * @const
 * @private
 */
wtf.math.MersenneTwister.UPPER_MASK_ = 0x80000000;


/**
 * Least significant r bits.
 * @type {number}
 * @const
 * @private
 */
wtf.math.MersenneTwister.LOWER_MASK_ = 0x7FFFFFFF;


/**
 * Initializes mt[N] with a seed.
 * @param {number} seed Seed value.
 * @private
 */
wtf.math.MersenneTwister.prototype.initialize_ = function(seed) {
  var mt = this.mt_;

  mt[0] = seed >>> 0;
  for (this.mti_ = 1; this.mti_ < wtf.math.MersenneTwister.N_; this.mti_++) {
    var s = mt[this.mti_ - 1] ^ (mt[this.mti_ - 1] >>> 30);
    mt[this.mti_] =
        (((((s & 0xffff0000) >>> 16) * 1812433253) << 16) +
            (s & 0x0000ffff) * 1812433253) + this.mti_;
    /* See Knuth TAOCP Vol2. 3rd Ed. P.106 for multiplier. */
    /* In the previous versions, MSBs of the seed affect   */
    /* only MSBs of the array mt[].                        */
    /* 2002/01/09 modified by Makoto Matsumoto             */
    mt[this.mti_] >>>= 0;
    /* for >32 bit machines */
  }
};


/**
 * Generates a random number on [0,0xffffffff]-interval.
 * @return {number} Random number.
 */
wtf.math.MersenneTwister.prototype.randomInt32 = function() {
  var mt = this.mt_;

  var N = wtf.math.MersenneTwister.N_;
  var M = wtf.math.MersenneTwister.M_;
  var MAG01 = wtf.math.MersenneTwister.MAG01_;

  // Generate N words at one time, as needed.
  if (this.mti_ >= N) {
    // If init_genrand() has not been called a default initial seed is used.
    if (this.mti_ == N + 1) {
      this.initialize_(5489);
    }

    for (var kk = 0; kk < N - M; kk++) {
      var y = (mt[kk] & wtf.math.MersenneTwister.UPPER_MASK_) |
          (mt[kk + 1] & wtf.math.MersenneTwister.LOWER_MASK_);
      mt[kk] = mt[kk + M] ^ (y >>> 1) ^ MAG01[y & 0x1];
    }
    for (; kk < N - 1; kk++) {
      var y = (mt[kk] & wtf.math.MersenneTwister.UPPER_MASK_) |
          (mt[kk + 1] & wtf.math.MersenneTwister.LOWER_MASK_);
      mt[kk] = mt[kk + (M - N)] ^ (y >>> 1) ^ MAG01[y & 0x1];
    }
    var y = (mt[N - 1] & wtf.math.MersenneTwister.UPPER_MASK_) |
        (mt[0] & wtf.math.MersenneTwister.LOWER_MASK_);
    mt[N - 1] = mt[M - 1] ^ (y >>> 1) ^ MAG01[y & 0x1];

    this.mti_ = 0;
  }

  var y = mt[this.mti_++];

  // Tempering.
  y ^= (y >>> 11);
  y ^= (y << 7) & 0x9d2c5680;
  y ^= (y << 15) & 0xefc60000;
  y ^= (y >>> 18);

  return y >>> 0;
};


/**
 * Generates a random value from [0-1].
 * @return {number} Random number.
 */
wtf.math.MersenneTwister.prototype.random = function() {
  // Divided by 2^32.
  return this.randomInt32() * (1 / 4294967296.0);
};
