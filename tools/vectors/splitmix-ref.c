/* Runner-written harness around Sebastiano Vigna's UNMODIFIED public-domain
 * splitmix64.c (fetched 2026-10-04 from https://prng.di.unimi.it/splitmix64.c).
 * It prints reference vectors for civ-rng-1 (spec section 4.2):
 *   mix64(z)        = the SplitMix64 output function = next() with x = z - gamma
 *   draw(key, n)    = mix64(key + (n + 1) * gamma) = the (n+1)-th next() with x = key
 * Build and run (see gen-vectors.py, which calls this):
 *   gcc -O0 -o splitmix-ref splitmix-ref.c && ./splitmix-ref
 */
#include <stdio.h>
#include <inttypes.h>
#include "splitmix64.c"

static const uint64_t GAMMA = 0x9e3779b97f4a7c15ULL;

static uint64_t mix64_ref(uint64_t z) {
  x = z - GAMMA;
  return next();
}

int main(void) {
  const uint64_t mixIn[] = {0ULL, 1ULL, 2ULL, 0x9e3779b97f4a7c15ULL,
                            0xffffffffffffffffULL, 0x0123456789abcdefULL};
  printf("{\n  \"mix64\": [\n");
  for (int i = 0; i < 6; i++)
    printf("    {\"in\": \"%" PRIu64 "\", \"out\": \"%" PRIu64 "\"}%s\n", mixIn[i],
           mix64_ref(mixIn[i]), i < 5 ? "," : "");
  printf("  ],\n  \"counter\": [\n");
  const uint64_t keys[] = {0ULL, 1234567ULL, 0xdeadbeefcafebabeULL};
  int first = 1;
  for (int k = 0; k < 3; k++) {
    x = keys[k];
    for (int n = 0; n <= 1000; n++) {
      uint64_t v = next(); /* this is draw(key, n) */
      if (n <= 3 || n == 999 || n == 1000) {
        printf("%s    {\"key\": \"%" PRIu64 "\", \"n\": %d, \"out\": \"%" PRIu64 "\"}",
               first ? "" : ",\n", keys[k], n, v);
        first = 0;
      }
    }
  }
  printf("\n  ]\n}\n");
  return 0;
}
