#!/usr/bin/env python3
"""Runner-generated, INDEPENDENT reference vectors for civ-rng-1 and the digest
Merkle construction (spec sections 4.1-4.3 and 10). Written by the Opus runner
on 2026-10-04 so that src/ (written by Astra) is checked against an
implementation it did not write. Never edit the JSON by hand: re-run

    python tools/vectors/gen-vectors.py

which (1) compiles and runs splitmix-ref.c around Vigna's unmodified
splitmix64.c with gcc, (2) cross-checks this script's SplitMix64 against it,
and (3) writes tests/vectors/civ-rng-1.json and tests/vectors/merkle.json.

Pinned definitions (the implementation must match these bytes exactly):
  field encoding  [tag:u8][len:u32 big-endian][payload]
                  tag 'S'=0x53 UTF-8 string, 'I'=0x49 canonical decimal ASCII
                  integer (no leading zeros, no '+', '-0' rejected),
                  'B'=0x42 raw bytes. Key bytes = concatenation of the fields.
  key tuple       S"civ-rng-1", S worldSeed, S manifestDigest, S level,
                  S entityId, S purpose, I episodeOrBucket, I ordinal, I attempt
  fnv1a64         offset 14695981039346656037, prime 1099511628211, mod 2^64
  key64           mix64(fnv1a64(keyBytes))
  draw(key, n)    mix64((key + (n + 1) * 0x9E3779B97F4A7C15) mod 2^64)
  u53(addr, i)    draw(key64(addr, attempt=0), i) >> 11
  below(addr,n,i) for a in 0..127: d = draw(key64(addr, attempt=a), i);
                  if d < 2^64 - (2^64 mod n): return d mod n   (else RNG_EXHAUSTED)
  expQ32(addr, i) u52 = draw(key64(addr, attempt=0), i) >> 12;
                  U = (u52 + 0.5) / 2^52; E = -ln(U); max(1, floor(E * 2^32))
                  (reference computed here with 60-digit Decimal ln; the JS
                  implementation uses a logPos port and must be within 1 of it)
  merkle          leaf = SHA256(0x00 || bytes); node = SHA256(0x01 || L || R);
                  odd last node promoted unchanged; empty = SHA256(0x02 || "civ-empty")
"""
import hashlib
import json
import os
import subprocess
import sys
from decimal import Decimal, getcontext

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "..", "tests", "vectors")
M64 = (1 << 64) - 1
GAMMA = 0x9E3779B97F4A7C15


def mix64(z):
    z &= M64
    z = ((z ^ (z >> 30)) * 0xBF58476D1CE4E5B9) & M64
    z = ((z ^ (z >> 27)) * 0x94D049BB133111EB) & M64
    return z ^ (z >> 31)


def draw(key, n):
    return mix64((key + (n + 1) * GAMMA) & M64)


def fnv1a64(data):
    h = 14695981039346656037
    for b in data:
        h ^= b
        h = (h * 1099511628211) & M64
    return h


def field(tag, payload):
    return bytes([ord(tag)]) + len(payload).to_bytes(4, "big") + payload


def S(s):
    return field("S", s.encode("utf-8"))


def I(n):
    return field("I", str(int(n)).encode("ascii"))


def key_bytes(addr, attempt):
    return (S("civ-rng-1") + S(addr["worldSeed"]) + S(addr["manifestDigest"]) + S(addr["level"])
            + S(addr["entityId"]) + S(addr["purpose"]) + I(addr["episodeOrBucket"])
            + I(addr["ordinal"]) + I(attempt))


def key64(addr, attempt):
    return mix64(fnv1a64(key_bytes(addr, attempt)))


def below(addr, n, i=0):
    limit = (1 << 64) - ((1 << 64) % n)
    for a in range(128):
        d = draw(key64(addr, a), i)
        if d < limit:
            return d % n, a
    raise RuntimeError("RNG_EXHAUSTED")


getcontext().prec = 60


def exp_q32_from_u52(u52):
    U = (Decimal(u52) + Decimal("0.5")) / (Decimal(2) ** 52)
    E = -U.ln()
    q = int((E * (Decimal(2) ** 32)).to_integral_value(rounding="ROUND_FLOOR"))
    return max(1, q), E


def run_c_reference():
    exe = os.path.join(HERE, "splitmix-ref.exe" if os.name == "nt" else "splitmix-ref")
    subprocess.run(["gcc", "-O0", "-o", exe, os.path.join(HERE, "splitmix-ref.c")], check=True, cwd=HERE)
    try:
        out = subprocess.run([exe], check=True, capture_output=True, text=True).stdout
    finally:
        os.remove(exe)
    return json.loads(out)


def main():
    ref = run_c_reference()
    for v in ref["mix64"]:
        assert mix64(int(v["in"])) == int(v["out"]), v
    for v in ref["counter"]:
        assert draw(int(v["key"]), v["n"]) == int(v["out"]), v

    base = {"worldSeed": "civ-toy-1", "manifestDigest": "0" * 64, "level": "P",
            "entityId": "arc:toy:lin:toy:0", "purpose": "haz.toy", "episodeOrBucket": 0,
            "ordinal": 0}
    addrs = [base,
             dict(base, purpose="evt.toy.magnitude", episodeOrBucket=7, ordinal=3),
             dict(base, entityId="region:r00", episodeOrBucket=-5),
             dict(base, worldSeed="seed-æøå-\U0001F30D", level="D")]
    keys = []
    for a in addrs:
        kb = key_bytes(a, 0)
        keys.append({"addr": a, "attempt": 0, "keyBytesHex": kb.hex(),
                     "fnv1a64": str(fnv1a64(kb)), "key64": str(key64(a, 0)),
                     "draws": [str(draw(key64(a, 0), n)) for n in (0, 1, 2, 1000)],
                     "u53_i0": str(draw(key64(a, 0), 0) >> 11)})

    # Aliasing check: ("a","bc") vs ("ab","c") as consecutive S fields.
    alias = {"a_bc": (S("a") + S("bc")).hex(), "ab_c": (S("ab") + S("c")).hex()}
    assert alias["a_bc"] != alias["ab_c"]

    fnv_plain = [{"utf8": s, "fnv1a64": str(fnv1a64(s.encode("utf-8")))} for s in ("", "a", "civ-rng-1")]

    belows = []
    for a, n, i in ((base, 1, 0), (base, 6, 0), (base, 1 << 32, 0), (base, 1 << 64, 0),
                    (addrs[1], 1000000, 0), (addrs[1], 10, 5)):
        val, att = below(a, n, i)
        belows.append({"addr": a, "n": str(n), "i": i, "value": str(val), "acceptedAttempt": att})

    # Forced rejection: n = 2^63 + 1 rejects ~half of all draws. Find an entityId whose
    # attempt 0 is rejected and attempt 1 accepted.
    n_rej = (1 << 63) + 1
    forced = None
    for j in range(10000):
        a = dict(base, entityId=f"reject:{j}")
        val, att = below(a, n_rej, 0)
        if att == 1:
            forced = {"addr": a, "n": str(n_rej), "i": 0, "value": str(val), "acceptedAttempt": 1,
                      "attempt0Draw": str(draw(key64(a, 0), 0)),
                      "limit": str((1 << 64) - ((1 << 64) % n_rej))}
            break
    assert forced is not None

    expv = []
    for u52 in (0, 1, 1 << 51, (1 << 52) - 1):
        q, E = exp_q32_from_u52(u52)
        expv.append({"u52": str(u52), "E": format(E, ".30f"), "expQ32Ref": str(q)})
    for a in addrs[:2]:
        u52 = draw(key64(a, 0), 0) >> 12
        q, E = exp_q32_from_u52(u52)
        expv.append({"addr": a, "i": 0, "u52": str(u52), "E": format(E, ".30f"), "expQ32Ref": str(q)})

    rng = {"generatedBy": "tools/vectors/gen-vectors.py (runner, Python %s) + splitmix-ref.c via gcc" % sys.version.split()[0],
           "splitmixReference": "https://prng.di.unimi.it/splitmix64.c (unmodified, public domain)",
           "gamma": str(GAMMA), "mix64": ref["mix64"], "counter": ref["counter"],
           "fnv1a64Plain": fnv_plain, "aliasEncoding": alias, "keys": keys,
           "below": belows, "belowForcedRejection": forced, "expQ32": expv}

    def leaf(b):
        return hashlib.sha256(b"\x00" + b).digest()

    def node(l, r):
        return hashlib.sha256(b"\x01" + l + r).digest()

    def root(leaves):
        if not leaves:
            return hashlib.sha256(b"\x02" + b"civ-empty").digest()
        level = [leaf(x) for x in leaves]
        while len(level) > 1:
            nxt = [node(level[k], level[k + 1]) for k in range(0, len(level) - 1, 2)]
            if len(level) % 2:
                nxt.append(level[-1])
            level = nxt
        return level[0]

    merkle = {"generatedBy": "tools/vectors/gen-vectors.py (runner, hashlib)", "leafInputsUtf8": [],
              "cases": []}
    for leaves in ([], ["a"], ["a", "b"], ["a", "b", "c"], ["a", "b", "c", "d", "e"]):
        merkle["cases"].append({"leavesUtf8": leaves,
                                "root": root([x.encode() for x in leaves]).hex()})
    merkle["leafHashA"] = leaf(b"a").hex()

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "civ-rng-1.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(rng, f, indent=2, ensure_ascii=False)
        f.write("\n")
    with open(os.path.join(OUT, "merkle.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(merkle, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print("C reference cross-check OK; wrote", os.path.normpath(OUT))


if __name__ == "__main__":
    main()
