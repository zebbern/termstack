# RSA Attack Templates

## Standard RSA Decrypt (Known Factors)

```python
from Crypto.Util.number import long_to_bytes, inverse

def rsa_decrypt(n, e, c, p, q):
    """Decrypt RSA given factors p, q."""
    phi = (p - 1) * (q - 1)
    d = inverse(e, phi)
    m = pow(c, d, n)
    return long_to_bytes(m)

# Usage
n = 0x...
e = 65537
c = 0x...
p = 0x...
q = 0x...
print(rsa_decrypt(n, e, c, p, q))
```

## Small e Attack (e=3, no padding)

```python
from Crypto.Util.number import long_to_bytes
import gmpy2

def small_e_attack(c, e=3):
    """If m^e < n, take the e-th root directly."""
    m, exact = gmpy2.iroot(c, e)
    if exact:
        return long_to_bytes(int(m))
    return None

# If m^e is slightly larger than n (wraps once or twice):
def small_e_broadcast(c, n, e=3, max_k=1000):
    """Try c + k*n for small k values."""
    for k in range(max_k):
        m, exact = gmpy2.iroot(c + k * n, e)
        if exact:
            return long_to_bytes(int(m))
    return None
```

## Hastad's Broadcast Attack (Same m, e recipients)

```python
from Crypto.Util.number import long_to_bytes
from sympy.ntheory.modular import crt
import gmpy2

def hastad_broadcast(pairs, e=3):
    """
    pairs = [(n1, c1), (n2, c2), (n3, c3)]
    Requires len(pairs) >= e
    """
    ns = [p[0] for p in pairs]
    cs = [p[1] for p in pairs]

    # Chinese Remainder Theorem
    N, result = crt(ns, cs)
    m, exact = gmpy2.iroot(result, e)
    if exact:
        return long_to_bytes(int(m))
    return None

# Usage with e=3, three ciphertexts
pairs = [(n1, c1), (n2, c2), (n3, c3)]
print(hastad_broadcast(pairs))
```

## Wiener's Attack (Small d)

```python
from Crypto.Util.number import long_to_bytes

def wiener_attack(n, e):
    """Recover d when d < n^0.25 / 3."""
    def continued_fraction(num, den):
        cf = []
        while den:
            q = num // den
            cf.append(q)
            num, den = den, num - q * den
        return cf

    def convergents(cf):
        h_prev, k_prev = 0, 1
        h_curr, k_curr = 1, 0
        for a in cf:
            h_next = a * h_curr + h_prev
            k_next = a * k_curr + k_prev
            yield k_next, h_next  # (k/h) are convergents
            h_prev, k_prev = h_curr, k_curr
            h_curr, k_curr = h_next, k_next

    cf = continued_fraction(e, n)
    for k, d in convergents(cf):
        if k == 0:
            continue
        phi_candidate = (e * d - 1) // k
        if (e * d - 1) % k != 0:
            continue
        # Check: n = p*q where p+q = n - phi + 1
        s = n - phi_candidate + 1
        discrim = s * s - 4 * n
        if discrim >= 0:
            import gmpy2
            sqrt_d = gmpy2.isqrt(discrim)
            if sqrt_d * sqrt_d == discrim:
                return d
    return None

# Usage
d = wiener_attack(n, e)
if d:
    m = pow(c, d, n)
    print(long_to_bytes(m))
```

## Common Modulus Attack (Same n, different e)

```python
from Crypto.Util.number import long_to_bytes, GCD, inverse

def common_modulus(n, e1, c1, e2, c2):
    """Same message encrypted with same n but different e values."""
    assert GCD(e1, e2) == 1, "e1 and e2 must be coprime"

    # Extended GCD to find a, b where a*e1 + b*e2 = 1
    def extended_gcd(a, b):
        if a == 0:
            return b, 0, 1
        gcd, x1, y1 = extended_gcd(b % a, a)
        return gcd, y1 - (b // a) * x1, x1

    _, a, b = extended_gcd(e1, e2)

    # Handle negative exponents
    if a < 0:
        c1 = inverse(c1, n)
        a = -a
    if b < 0:
        c2 = inverse(c2, n)
        b = -b

    m = (pow(c1, a, n) * pow(c2, b, n)) % n
    return long_to_bytes(m)
```

## Factorization Methods

```python
from Crypto.Util.number import GCD
import requests

def factordb_lookup(n):
    """Query factordb.com for known factorizations."""
    r = requests.get(f'http://factordb.com/api', params={'query': str(n)})
    data = r.json()
    if data['status'] == 'FF':  # Fully factored
        factors = [int(f[0]) for f in data['factors']]
        return factors
    return None

def fermat_factor(n, max_iter=1000000):
    """Fermat's factorization — works when p and q are close."""
    import gmpy2
    a = gmpy2.isqrt(n) + 1
    b2 = a * a - n
    for _ in range(max_iter):
        if gmpy2.is_square(b2):
            b = gmpy2.isqrt(b2)
            return int(a - b), int(a + b)
        a += 1
        b2 = a * a - n
    return None

def pollard_p1(n, B=1000000):
    """Pollard's p-1 — works when p-1 has only small factors."""
    a = 2
    for j in range(2, B):
        a = pow(a, j, n)
        d = GCD(a - 1, n)
        if 1 < d < n:
            return d, n // d
    return None

def shared_factor(n1, n2):
    """If two RSA moduli share a prime factor."""
    p = GCD(n1, n2)
    if 1 < p < n1:
        return p, n1 // p
    return None
```
