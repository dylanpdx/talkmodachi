function approxEqual(a, b, tolerance = 0.01) {
    return Math.abs(a - b) <= tolerance;
}